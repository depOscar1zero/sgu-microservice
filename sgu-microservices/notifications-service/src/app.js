const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const logger = require("./utils/logger");
const notificationRoutes = require("./routes/notificationRoutes");
const queueService = require("./services/queueService");

class NotificationsApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3005;
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
    this.app.use(
      cors({
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
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 1000, // máximo 1000 requests por ventana
      message: {
        success: false,
        message: "Demasiadas solicitudes desde esta IP, intenta más tarde",
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

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
      res.setHeader("X-Request-ID", req.id);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get("/health", (req, res) => {
      res.json({
        success: true,
        service: "Notifications Service",
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
      });
    });

    // Root endpoint
    this.app.get("/", (req, res) => {
      res.json({
        success: true,
        message: "SGU Notifications Service",
        version: "1.0.0",
        endpoints: {
          health: "/health",
          notifications: "/api/notifications",
          templates: "/api/notifications/templates",
        },
      });
    });

    // API routes
    this.app.use("/api/notifications", notificationRoutes);

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

      // Mongoose validation error
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: "Error de validación",
          errors,
        });
      }

      // Mongoose duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(409).json({
          success: false,
          message: `${field} ya existe`,
        });
      }

      // JWT errors
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
        logger.info(`Notifications Service running on port ${this.port}`, {
          port: this.port,
          environment: process.env.NODE_ENV || "development",
          version: process.env.npm_package_version || "1.0.0",
        });
      });

      // Configurar timeout del servidor
      this.server.timeout = 30000; // 30 segundos
    } catch (error) {
      logger.logError(error, { service: "Notifications Service" });
      process.exit(1);
    }
  }

  async initializeServices() {
    try {
      // Inicializar base de datos
      const database = require("./config/database");
      await database.connect();

      // Inicializar colas
      // Las colas se inicializan automáticamente en el constructor

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

      // Cerrar colas
      await queueService.close();

      // Cerrar base de datos
      const database = require("./config/database");
      await database.disconnect();

      logger.info("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown:", error);
      process.exit(1);
    }
  }
}

module.exports = NotificationsApp;
