const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const logger = require("./utils/logger");
const gatewayConfig = require("./config/gateway");
const proxyService = require("./services/proxyService");
const authService = require("./services/authService");
const rateLimitService = require("./services/rateLimitService");
const metricsService = require("./services/metricsService");

class GatewayApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      })
    );

    // CORS configuration
    this.app.use(cors(gatewayConfig.cors));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Logging
    this.app.use(
      morgan("combined", {
        stream: {
          write: (message) => logger.info(message.trim()),
        },
      })
    );

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.id = Math.random().toString(36).substr(2, 9);
      req.startTime = Date.now();
      res.setHeader("X-Request-ID", req.id);
      next();
    });

    // Métricas middleware
    if (gatewayConfig.monitoring.enabled) {
      this.app.use(metricsService.metricsMiddleware());
    }

    // Rate limiting global
    this.app.use(rateLimitService.global());
  }

  setupRoutes() {
    // Health check
    this.app.get("/health", (req, res) => {
      res.json({
        success: true,
        service: "API Gateway",
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
      });
    });

    // Métricas
    if (gatewayConfig.monitoring.enabled) {
      this.app.get("/metrics", async (req, res) => {
        try {
          const metrics = await metricsService.getMetrics();
          res.set("Content-Type", "text/plain");
          res.send(metrics);
        } catch (error) {
          logger.error("Failed to get metrics:", error);
          res.status(500).json({
            success: false,
            message: "Error getting metrics",
          });
        }
      });
    }

    // Swagger documentation
    if (gatewayConfig.swagger.enabled) {
      const swaggerOptions = {
        definition: {
          openapi: "3.0.0",
          info: {
            title: gatewayConfig.swagger.title,
            version: gatewayConfig.swagger.version,
            description: gatewayConfig.swagger.description,
          },
          servers: [
            {
              url: `http://localhost:${this.port}`,
              description: "Development server",
            },
          ],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
              },
            },
          },
        },
        apis: ["./src/routes/*.js"],
      };

      const swaggerSpec = swaggerJsdoc(swaggerOptions);
      this.app.use(
        gatewayConfig.swagger.path,
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec)
      );
    }

    // Root endpoint
    this.app.get("/", (req, res) => {
      res.json({
        success: true,
        message: "SGU API Gateway",
        version: "1.0.0",
        endpoints: {
          health: "/health",
          metrics: "/metrics",
          docs: gatewayConfig.swagger.enabled
            ? gatewayConfig.swagger.path
            : null,
          services: gatewayConfig.getAllServices().map((service) => ({
            name: service,
            path: gatewayConfig.getServiceConfig(service).prefix,
          })),
        },
      });
    });

    // Service routes
    this.setupServiceRoutes();

    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        message: "Endpoint no encontrado",
        path: req.originalUrl,
        method: req.method,
      });
    });
  }

  setupServiceRoutes() {
    // Auth Service
    this.app.use(
      "/api/auth",
      rateLimitService.authEndpoint(),
      proxyService.healthCheckMiddleware("auth"),
      proxyService.createProxy("auth")
    );

    // Courses Service
    this.app.use(
      "/api/courses",
      authService.authenticate(),
      rateLimitService.getServiceLimiter("courses"),
      proxyService.healthCheckMiddleware("courses"),
      proxyService.createProxy("courses")
    );

    // Enrollment Service
    this.app.use(
      "/api/enrollments",
      authService.authenticate(),
      rateLimitService.getServiceLimiter("enrollment"),
      proxyService.healthCheckMiddleware("enrollment"),
      proxyService.createProxy("enrollment")
    );

    // Payments Service
    this.app.use(
      "/api/payments",
      authService.authenticate(),
      rateLimitService.paymentEndpoint(),
      proxyService.healthCheckMiddleware("payments"),
      proxyService.createProxy("payments")
    );

    // Notifications Service
    this.app.use(
      "/api/notifications",
      authService.authenticate(),
      rateLimitService.getServiceLimiter("notifications"),
      proxyService.healthCheckMiddleware("notifications"),
      proxyService.createProxy("notifications")
    );

    // Endpoints específicos con autorización
    this.setupProtectedRoutes();
  }

  setupProtectedRoutes() {
    // Admin only routes
    this.app.use(
      "/api/admin/*",
      authService.authenticate(),
      authService.authorize(["admin"]),
      rateLimitService.criticalEndpoint()
    );

    // Teacher only routes
    this.app.use(
      "/api/teacher/*",
      authService.authenticate(),
      authService.authorize(["teacher", "admin"]),
      rateLimitService.authenticatedUser()
    );

    // Student only routes
    this.app.use(
      "/api/student/*",
      authService.authenticate(),
      authService.authorize(["student", "admin"]),
      rateLimitService.authenticatedUser()
    );
  }

  setupErrorHandling() {
    // Error handling middleware
    this.app.use((error, req, res, next) => {
      logger.logError(error, {
        requestId: req.id,
        method: req.method,
        url: req.url,
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // Proxy errors
      if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        return res.status(503).json({
          success: false,
          message: "Servicio temporalmente no disponible",
          error: error.message,
        });
      }

      // Rate limit errors
      if (error.status === 429) {
        return res.status(429).json({
          success: false,
          message: "Demasiadas solicitudes",
          retryAfter: error.retryAfter,
        });
      }

      // Authentication errors
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Token inválido",
        });
      }

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expirado",
        });
      }

      // Default error
      res.status(error.status || 500).json({
        success: false,
        message: error.message || "Error interno del servidor",
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      });
    });

    // Unhandled promise rejection
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Promise Rejection", {
        reason: reason.toString(),
        stack: reason.stack,
        promise: promise.toString(),
      });
    });

    // Uncaught exception
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      this.shutdown();
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received, shutting down gracefully");
      this.shutdown();
    });
  }

  async start() {
    try {
      // Inicializar servicios
      await this.initializeServices();

      // Iniciar servidor
      this.server = this.app.listen(this.port, () => {
        logger.info(`API Gateway running on port ${this.port}`, {
          port: this.port,
          environment: process.env.NODE_ENV || "development",
          version: process.env.npm_package_version || "1.0.0",
          services: gatewayConfig.getAllServices(),
        });
      });

      // Configurar timeout del servidor
      this.server.timeout = gatewayConfig.timeout.request;
    } catch (error) {
      logger.logError(error, { service: "API Gateway" });
      process.exit(1);
    }
  }

  async initializeServices() {
    try {
      // Inicializar monitoreo de salud
      if (gatewayConfig.loadBalancing.healthCheck.enabled) {
        proxyService.startHealthMonitoring();
      }

      // Verificar salud de servicios
      await proxyService.checkAllServicesHealth();

      logger.info("All services initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize services:", error);
      throw error;
    }
  }

  async shutdown() {
    try {
      logger.info("Starting graceful shutdown...");

      // Cerrar servidor HTTP
      if (this.server) {
        this.server.close(() => {
          logger.info("HTTP server closed");
        });
      }

      // Cerrar servicios
      await rateLimitService.close();

      logger.info("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown:", error);
      process.exit(1);
    }
  }
}

module.exports = GatewayApp;
