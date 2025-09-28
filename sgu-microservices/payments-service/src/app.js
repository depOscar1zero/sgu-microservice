const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

// Middleware de seguridad
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

// Parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Middleware de logging personalizado
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`
  );
  next();
});

// Rutas
const paymentsRoutes = require("./routes/paymentsRoutes");

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "Payments Service",
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use("/api/payments", paymentsRoutes);

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SGU Payments Service API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      payments: "/api/payments",
      docs: "/api/docs",
    },
    timestamp: new Date().toISOString(),
  });
});

// Manejo de rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error("Error no manejado:", error);

  // Error de validación
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Error de validación",
      details: error.errors,
      timestamp: new Date().toISOString(),
    });
  }

  // Error de Sequelize
  if (error.name === "SequelizeError") {
    return res.status(400).json({
      success: false,
      error: "Error de base de datos",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Error de Stripe
  if (error.type && error.type.startsWith("Stripe")) {
    return res.status(400).json({
      success: false,
      error: "Error de procesamiento de pago",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Error genérico
  res.status(500).json({
    success: false,
    error: "Error interno del servidor",
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;
