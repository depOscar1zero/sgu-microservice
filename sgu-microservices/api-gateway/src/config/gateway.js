const logger = require("../utils/logger");

class GatewayConfig {
  constructor() {
    this.services = {
      auth: {
        url: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
        prefix: "/api/auth",
        timeout: 5000,
        retries: 3,
      },
      courses: {
        url: process.env.COURSES_SERVICE_URL || "http://localhost:3002",
        prefix: "/api/courses",
        timeout: 5000,
        retries: 3,
      },
      enrollment: {
        url: process.env.ENROLLMENT_SERVICE_URL || "http://localhost:3003",
        prefix: "/api/enrollments",
        timeout: 5000,
        retries: 3,
      },
      payments: {
        url: process.env.PAYMENTS_SERVICE_URL || "http://localhost:3004",
        prefix: "/api/payments",
        timeout: 10000, // Pagos requieren más tiempo
        retries: 3,
      },
      notifications: {
        url: process.env.NOTIFICATIONS_SERVICE_URL || "http://localhost:3005",
        prefix: "/api/notifications",
        timeout: 5000,
        retries: 3,
      },
    };

    this.rateLimits = {
      global: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 1000, // máximo 1000 requests por ventana
        message: "Demasiadas solicitudes desde esta IP, intenta más tarde",
      },
      auth: {
        windowMs: 15 * 60 * 1000,
        max: 100, // Límite más estricto para autenticación
        message: "Demasiados intentos de autenticación, intenta más tarde",
      },
      payments: {
        windowMs: 15 * 60 * 1000,
        max: 50, // Límite muy estricto para pagos
        message: "Demasiadas solicitudes de pago, intenta más tarde",
      },
    };

    this.cors = {
      origin: process.env.ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-API-Key",
        "X-Request-ID",
      ],
    };

    this.security = {
      jwtSecret: process.env.JWT_SECRET || "your-secret-key",
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
      apiKeyHeader: "X-API-Key",
      apiKeys: process.env.API_KEYS?.split(",") || [],
    };

    this.monitoring = {
      enabled: process.env.MONITORING_ENABLED === "true",
      metricsPath: "/metrics",
      healthCheckPath: "/health",
      prometheus: {
        enabled: process.env.PROMETHEUS_ENABLED === "true",
        port: process.env.PROMETHEUS_PORT || 9090,
      },
    };

    this.cache = {
      enabled: process.env.CACHE_ENABLED === "true",
      ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutos
      redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
      },
    };

    this.logging = {
      level: process.env.LOG_LEVEL || "info",
      format: process.env.LOG_FORMAT || "combined",
      file: process.env.LOG_FILE || "logs/gateway.log",
    };

    this.timeout = {
      request: parseInt(process.env.REQUEST_TIMEOUT) || 30000, // 30 segundos
      connection: parseInt(process.env.CONNECTION_TIMEOUT) || 5000, // 5 segundos
    };

    this.retry = {
      attempts: parseInt(process.env.RETRY_ATTEMPTS) || 3,
      delay: parseInt(process.env.RETRY_DELAY) || 1000, // 1 segundo
      backoff: process.env.RETRY_BACKOFF || "exponential",
    };

    this.circuitBreaker = {
      enabled: process.env.CIRCUIT_BREAKER_ENABLED === "true",
      threshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD) || 5,
      timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT) || 60000, // 1 minuto
      resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET) || 30000, // 30 segundos
    };

    this.loadBalancing = {
      strategy: process.env.LOAD_BALANCING_STRATEGY || "round-robin",
      healthCheck: {
        enabled: process.env.HEALTH_CHECK_ENABLED === "true",
        interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 segundos
        timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000, // 5 segundos
      },
    };

    this.swagger = {
      enabled: process.env.SWAGGER_ENABLED === "true",
      path: "/api-docs",
      title: "SGU API Gateway",
      version: "1.0.0",
      description: "API Gateway para el Sistema de Gestión Universitaria",
    };

    this.validateConfig();
  }

  validateConfig() {
    const requiredEnvVars = ["JWT_SECRET"];
    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      logger.error("Missing required environment variables:", {
        missing: missingVars,
      });
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }

    // Validar URLs de servicios
    Object.entries(this.services).forEach(([name, config]) => {
      try {
        new URL(config.url);
      } catch (error) {
        logger.error(`Invalid service URL for ${name}:`, {
          service: name,
          url: config.url,
          error: error.message,
        });
        throw new Error(`Invalid service URL for ${name}: ${config.url}`);
      }
    });

    logger.info("Gateway configuration validated successfully");
  }

  getServiceConfig(serviceName) {
    const service = this.services[serviceName];
    if (!service) {
      throw new Error(`Service ${serviceName} not found in configuration`);
    }
    return service;
  }

  getRateLimit(serviceName) {
    return this.rateLimits[serviceName] || this.rateLimits.global;
  }

  isServiceEnabled(serviceName) {
    return !!this.services[serviceName];
  }

  getServiceHealthCheckUrl(serviceName) {
    const service = this.getServiceConfig(serviceName);
    return `${service.url}/health`;
  }

  getServiceMetricsUrl(serviceName) {
    const service = this.getServiceConfig(serviceName);
    return `${service.url}/metrics`;
  }

  getAllServices() {
    return Object.keys(this.services);
  }

  getEnabledServices() {
    return Object.entries(this.services)
      .filter(([name, config]) => this.isServiceEnabled(name))
      .map(([name, config]) => ({ name, ...config }));
  }
}

module.exports = new GatewayConfig();
