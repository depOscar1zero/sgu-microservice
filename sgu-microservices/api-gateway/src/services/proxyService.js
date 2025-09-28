const { createProxyMiddleware } = require("http-proxy-middleware");
const axios = require("axios");
const logger = require("../utils/logger");
const gatewayConfig = require("../config/gateway");

class ProxyService {
  constructor() {
    this.serviceHealth = new Map();
    this.circuitBreakers = new Map();
    this.requestCounts = new Map();
    this.initializeCircuitBreakers();
  }

  initializeCircuitBreakers() {
    gatewayConfig.getAllServices().forEach((serviceName) => {
      this.circuitBreakers.set(serviceName, {
        state: "closed", // closed, open, half-open
        failures: 0,
        lastFailure: null,
        nextAttempt: null,
      });
    });
  }

  // Crear proxy middleware para un servicio
  createProxy(serviceName) {
    const serviceConfig = gatewayConfig.getServiceConfig(serviceName);

    return createProxyMiddleware({
      target: serviceConfig.url,
      changeOrigin: true,
      timeout: serviceConfig.timeout,
      retries: serviceConfig.retries,
      pathRewrite: {
        [`^${serviceConfig.prefix}`]: "",
      },
      onError: (err, req, res) => {
        logger.error(`Proxy error for ${serviceName}:`, {
          service: serviceName,
          error: err.message,
          url: req.url,
          method: req.method,
        });

        this.handleServiceError(serviceName, err);

        if (!res.headersSent) {
          res.status(502).json({
            success: false,
            message: "Servicio temporalmente no disponible",
            service: serviceName,
            error: err.message,
          });
        }
      },
      onProxyReq: (proxyReq, req, res) => {
        // Agregar headers de tracking
        proxyReq.setHeader(
          "X-Request-ID",
          req.id || Math.random().toString(36).substr(2, 9)
        );
        proxyReq.setHeader("X-Gateway-Service", serviceName);
        proxyReq.setHeader("X-Original-IP", req.ip);
        proxyReq.setHeader(
          "X-User-Agent",
          req.get("User-Agent") || "SGU-Gateway"
        );

        // Log de request
        logger.info(`Proxying request to ${serviceName}`, {
          service: serviceName,
          method: req.method,
          url: req.url,
          target: serviceConfig.url,
          requestId: req.id,
        });
      },
      onProxyRes: (proxyRes, req, res) => {
        // Log de response
        logger.info(`Response from ${serviceName}`, {
          service: serviceName,
          statusCode: proxyRes.statusCode,
          method: req.method,
          url: req.url,
          requestId: req.id,
        });

        // Agregar headers de response
        proxyRes.headers["X-Gateway-Service"] = serviceName;
        proxyRes.headers["X-Response-Time"] = Date.now() - req.startTime;
      },
    });
  }

  // Verificar salud de un servicio
  async checkServiceHealth(serviceName) {
    try {
      const healthUrl = gatewayConfig.getServiceHealthCheckUrl(serviceName);
      const response = await axios.get(healthUrl, {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      });

      const isHealthy = response.status === 200 && response.data?.success;
      this.serviceHealth.set(serviceName, {
        healthy: isHealthy,
        lastCheck: new Date(),
        responseTime: response.headers["x-response-time"] || 0,
        status: response.status,
      });

      logger.info(`Health check for ${serviceName}`, {
        service: serviceName,
        healthy: isHealthy,
        status: response.status,
        responseTime: response.headers["x-response-time"],
      });

      return isHealthy;
    } catch (error) {
      logger.error(`Health check failed for ${serviceName}:`, {
        service: serviceName,
        error: error.message,
      });

      this.serviceHealth.set(serviceName, {
        healthy: false,
        lastCheck: new Date(),
        error: error.message,
      });

      return false;
    }
  }

  // Verificar salud de todos los servicios
  async checkAllServicesHealth() {
    const services = gatewayConfig.getAllServices();
    const healthChecks = await Promise.allSettled(
      services.map((service) => this.checkServiceHealth(service))
    );

    const results = {};
    services.forEach((service, index) => {
      const result = healthChecks[index];
      results[service] = {
        healthy: result.status === "fulfilled" && result.value,
        error: result.status === "rejected" ? result.reason.message : null,
      };
    });

    return results;
  }

  // Manejar errores de servicio
  handleServiceError(serviceName, error) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (!circuitBreaker) return;

    circuitBreaker.failures++;
    circuitBreaker.lastFailure = new Date();

    // Activar circuit breaker si se supera el threshold
    if (circuitBreaker.failures >= gatewayConfig.circuitBreaker.threshold) {
      circuitBreaker.state = "open";
      circuitBreaker.nextAttempt = new Date(
        Date.now() + gatewayConfig.circuitBreaker.timeout
      );

      logger.warn(`Circuit breaker opened for ${serviceName}`, {
        service: serviceName,
        failures: circuitBreaker.failures,
        threshold: gatewayConfig.circuitBreaker.threshold,
        nextAttempt: circuitBreaker.nextAttempt,
      });
    }
  }

  // Verificar si el circuit breaker está abierto
  isCircuitBreakerOpen(serviceName) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (!circuitBreaker) return false;

    if (circuitBreaker.state === "open") {
      if (new Date() >= circuitBreaker.nextAttempt) {
        circuitBreaker.state = "half-open";
        logger.info(`Circuit breaker half-open for ${serviceName}`);
        return false;
      }
      return true;
    }

    return false;
  }

  // Resetear circuit breaker
  resetCircuitBreaker(serviceName) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.state = "closed";
      circuitBreaker.failures = 0;
      circuitBreaker.lastFailure = null;
      circuitBreaker.nextAttempt = null;

      logger.info(`Circuit breaker reset for ${serviceName}`);
    }
  }

  // Obtener estadísticas de servicios
  getServiceStats() {
    const stats = {};

    gatewayConfig.getAllServices().forEach((serviceName) => {
      const health = this.serviceHealth.get(serviceName);
      const circuitBreaker = this.circuitBreakers.get(serviceName);
      const requestCount = this.requestCounts.get(serviceName) || 0;

      stats[serviceName] = {
        healthy: health?.healthy || false,
        lastCheck: health?.lastCheck,
        responseTime: health?.responseTime || 0,
        circuitBreaker: {
          state: circuitBreaker?.state || "closed",
          failures: circuitBreaker?.failures || 0,
          lastFailure: circuitBreaker?.lastFailure,
        },
        requestCount,
      };
    });

    return stats;
  }

  // Incrementar contador de requests
  incrementRequestCount(serviceName) {
    const current = this.requestCounts.get(serviceName) || 0;
    this.requestCounts.set(serviceName, current + 1);
  }

  // Obtener servicio más saludable (load balancing)
  getHealthiestService(serviceName) {
    const serviceConfig = gatewayConfig.getServiceConfig(serviceName);
    const health = this.serviceHealth.get(serviceName);

    if (!health?.healthy) {
      throw new Error(`Service ${serviceName} is not healthy`);
    }

    return serviceConfig;
  }

  // Middleware para verificar salud del servicio
  healthCheckMiddleware(serviceName) {
    return (req, res, next) => {
      if (this.isCircuitBreakerOpen(serviceName)) {
        return res.status(503).json({
          success: false,
          message: "Servicio temporalmente no disponible (Circuit Breaker)",
          service: serviceName,
        });
      }

      const health = this.serviceHealth.get(serviceName);
      if (!health?.healthy) {
        return res.status(503).json({
          success: false,
          message: "Servicio no disponible",
          service: serviceName,
        });
      }

      this.incrementRequestCount(serviceName);
      next();
    };
  }

  // Iniciar monitoreo de salud
  startHealthMonitoring() {
    if (!gatewayConfig.loadBalancing.healthCheck.enabled) return;

    const interval = setInterval(async () => {
      try {
        await this.checkAllServicesHealth();
      } catch (error) {
        logger.error("Health monitoring error:", error);
      }
    }, gatewayConfig.loadBalancing.healthCheck.interval);

    // Limpiar interval al cerrar la aplicación
    process.on("SIGTERM", () => clearInterval(interval));
    process.on("SIGINT", () => clearInterval(interval));
  }
}

module.exports = new ProxyService();
