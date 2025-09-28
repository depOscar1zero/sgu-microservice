#!/usr/bin/env node

/**
 * Servidor principal del Notifications Service
 * Sistema de Gestión Universitaria (SGU)
 */

const NotificationsApp = require("./app");
const logger = require("./utils/logger");

// Configurar variables de entorno
require("dotenv").config();

// Validar variables de entorno requeridas
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error("Missing required environment variables:", {
    missing: missingEnvVars,
  });
  process.exit(1);
}

// Configurar timezone
process.env.TZ = process.env.TIMEZONE || "America/Mexico_City";

// Configurar límites de memoria
if (process.env.NODE_ENV === "production") {
  process.env.NODE_OPTIONS = "--max-old-space-size=2048";
}

// Crear e iniciar aplicación
const app = new NotificationsApp();

// Manejar errores no capturados
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection:", {
    reason: reason.toString(),
    stack: reason.stack,
    promise: promise.toString(),
  });
  process.exit(1);
});

// Iniciar servidor
app.start().catch((error) => {
  logger.error("Failed to start Notifications Service:", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Exportar para testing
module.exports = app;
