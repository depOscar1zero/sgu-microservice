const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const Redis = require("redis");
const logger = require("../utils/logger");
const gatewayConfig = require("../config/gateway");

class RateLimitService {
  constructor() {
    this.redis = null;
    this.limiters = new Map();
    this.initializeRedis();
    this.createLimiters();
  }

  initializeRedis() {
    if (gatewayConfig.cache.enabled) {
      try {
        this.redis = Redis.createClient({
          host: gatewayConfig.cache.redis.host,
          port: gatewayConfig.cache.redis.port,
          password: gatewayConfig.cache.redis.password,
          db: gatewayConfig.cache.redis.db,
        });

        this.redis.on("error", (error) => {
          logger.error("Redis connection error:", error);
        });

        this.redis.on("connect", () => {
          logger.info("Redis connected for rate limiting");
        });

        this.redis.connect();
      } catch (error) {
        logger.error("Failed to initialize Redis for rate limiting:", error);
      }
    }
  }

  createLimiters() {
    // Rate limiter global
    this.limiters.set(
      "global",
      this.createLimiter("global", gatewayConfig.rateLimits.global)
    );

    // Rate limiters específicos por servicio
    Object.entries(gatewayConfig.rateLimits).forEach(([service, config]) => {
      if (service !== "global") {
        this.limiters.set(service, this.createLimiter(service, config));
      }
    });

    // Rate limiter por usuario
    this.limiters.set("user", this.createUserLimiter());

    // Rate limiter por IP
    this.limiters.set("ip", this.createIPLimiter());

    // Rate limiter para endpoints críticos
    this.limiters.set("critical", this.createCriticalLimiter());
  }

  createLimiter(name, config) {
    const limiterConfig = {
      windowMs: config.windowMs,
      max: config.max,
      message: {
        success: false,
        message: config.message,
        retryAfter: Math.ceil(config.windowMs / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Saltar rate limiting para health checks
        return req.path === "/health" || req.path === "/metrics";
      },
      keyGenerator: (req) => {
        // Usar IP como clave por defecto
        return req.ip;
      },
      onLimitReached: (req, res, options) => {
        logger.warn("Rate limit reached", {
          service: name,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          path: req.path,
          method: req.method,
          limit: config.max,
          windowMs: config.windowMs,
        });
      },
    };

    // Usar Redis store si está disponible
    if (this.redis && gatewayConfig.cache.enabled) {
      limiterConfig.store = new RedisStore({
        sendCommand: (...args) => this.redis.sendCommand(args),
      });
    }

    return rateLimit(limiterConfig);
  }

  createUserLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // 100 requests por usuario por ventana
      message: {
        success: false,
        message: "Demasiadas solicitudes para este usuario",
        retryAfter: 900, // 15 minutos
      },
      keyGenerator: (req) => {
        // Usar ID de usuario si está autenticado, sino IP
        return req.user?.id || req.ip;
      },
      skip: (req) => {
        // Saltar para administradores
        return req.user?.role === "admin";
      },
      onLimitReached: (req, res, options) => {
        logger.warn("User rate limit reached", {
          userId: req.user?.id,
          ip: req.ip,
          path: req.path,
          method: req.method,
        });
      },
    });
  }

  createIPLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 200, // 200 requests por IP por ventana
      message: {
        success: false,
        message: "Demasiadas solicitudes desde esta IP",
        retryAfter: 900,
      },
      keyGenerator: (req) => req.ip,
      onLimitReached: (req, res, options) => {
        logger.warn("IP rate limit reached", {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          path: req.path,
          method: req.method,
        });
      },
    });
  }

  createCriticalLimiter() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minuto
      max: 10, // 10 requests por minuto para endpoints críticos
      message: {
        success: false,
        message: "Demasiadas solicitudes a endpoint crítico",
        retryAfter: 60,
      },
      keyGenerator: (req) => {
        // Usar IP + path para endpoints críticos
        return `${req.ip}:${req.path}`;
      },
      onLimitReached: (req, res, options) => {
        logger.warn("Critical endpoint rate limit reached", {
          ip: req.ip,
          path: req.path,
          method: req.method,
          userId: req.user?.id,
        });
      },
    });
  }

  // Obtener rate limiter por nombre
  getLimiter(name) {
    return this.limiters.get(name);
  }

  // Obtener rate limiter por servicio
  getServiceLimiter(serviceName) {
    return this.limiters.get(serviceName) || this.limiters.get("global");
  }

  // Crear rate limiter personalizado
  createCustomLimiter(config) {
    return rateLimit({
      windowMs: config.windowMs || 15 * 60 * 1000,
      max: config.max || 100,
      message: config.message || {
        success: false,
        message: "Rate limit exceeded",
        retryAfter: Math.ceil((config.windowMs || 15 * 60 * 1000) / 1000),
      },
      keyGenerator: config.keyGenerator || ((req) => req.ip),
      skip: config.skip,
      onLimitReached: config.onLimitReached,
      store: this.redis
        ? new RedisStore({
            sendCommand: (...args) => this.redis.sendCommand(args),
          })
        : undefined,
    });
  }

  // Middleware para endpoints críticos
  criticalEndpoint() {
    return this.limiters.get("critical");
  }

  // Middleware para autenticación
  authEndpoint() {
    return this.limiters.get("auth");
  }

  // Middleware para pagos
  paymentEndpoint() {
    return this.limiters.get("payments");
  }

  // Middleware para usuarios autenticados
  authenticatedUser() {
    return this.limiters.get("user");
  }

  // Middleware para IPs
  ipBased() {
    return this.limiters.get("ip");
  }

  // Middleware global
  global() {
    return this.limiters.get("global");
  }

  // Obtener estadísticas de rate limiting
  async getRateLimitStats() {
    const stats = {
      limiters: Array.from(this.limiters.keys()),
      redis: {
        connected: !!this.redis,
        enabled: gatewayConfig.cache.enabled,
      },
      config: {
        global: gatewayConfig.rateLimits.global,
        services: Object.keys(gatewayConfig.rateLimits).filter(
          (k) => k !== "global"
        ),
      },
    };

    return stats;
  }

  // Limpiar rate limiters
  async clearRateLimits() {
    if (this.redis) {
      try {
        await this.redis.flushDb();
        logger.info("Rate limit cache cleared");
      } catch (error) {
        logger.error("Failed to clear rate limit cache:", error);
      }
    }
  }

  // Cerrar conexión Redis
  async close() {
    if (this.redis) {
      try {
        await this.redis.quit();
        logger.info("Redis connection closed");
      } catch (error) {
        logger.error("Failed to close Redis connection:", error);
      }
    }
  }
}

module.exports = new RateLimitService();
