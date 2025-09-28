const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

// Importar rutas
const coursesRoutes = require("./routes/coursesRoutes");

const app = express();

// Middleware de seguridad
app.use(helmet());

// Middleware de CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Middleware de logging
app.use(morgan("combined"));

// Middleware para parsear JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rutas
app.use("/api/courses", coursesRoutes);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    res.status(200).json({
      status: "OK",
      service: "Courses Service",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      database: "Connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      service: "Courses Service",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      database: "Disconnected",
      error: error.message,
    });
  }
});

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    message: "Courses Service API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      courses: "/api/courses",
    },
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      message: err.message,
      details: err.errors,
    });
  }

  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      error: "Database Validation Error",
      message: err.message,
      details: err.errors,
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      error: "Duplicate Entry",
      message: "A course with this code already exists",
    });
  }

  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      error: "Foreign Key Constraint",
      message: "Referenced record does not exist",
    });
  }

  if (err.name === "SequelizeDatabaseError") {
    return res.status(500).json({
      error: "Database Error",
      message: "A database error occurred",
    });
  }

  // Error genérico
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// Middleware para rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
});

module.exports = app;
