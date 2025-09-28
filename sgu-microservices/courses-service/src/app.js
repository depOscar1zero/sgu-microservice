const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Importar rutas
const coursesRoutes = require('./routes/coursesRoutes');

const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Middleware de logging
app.use(morgan('combined'));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Courses Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'MongoDB Atlas Connected'
  });
});

// Información del servicio
app.get('/info', (req, res) => {
  res.status(200).json({
    service: 'Courses Service',
    description: 'Microservicio para gestión del catálogo académico',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      courses: {
        getAll: 'GET /api/courses',
        getById: 'GET /api/courses/:id',
        getByCode: 'GET /api/courses/code/:code',
        create: 'POST /api/courses',
        update: 'PUT /api/courses/:id',
        delete: 'DELETE /api/courses/:id',
        reserveSlots: 'POST /api/courses/:id/reserve',
        releaseSlots: 'POST /api/courses/:id/release',
        stats: 'GET /api/courses/stats'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Rutas principales
app.use('/api/courses', coursesRoutes);

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada en el servicio de cursos`,
    timestamp: new Date().toISOString()
  });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error capturado:', err);

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  // Error de duplicado (código único)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    
    return res.status(409).json({
      success: false,
      message: `Ya existe un curso con ${field}: ${value}`,
      timestamp: new Date().toISOString()
    });
  }

  // Error de Cast (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID de curso inválido',
      timestamp: new Date().toISOString()
    });
  }

  // Error genérico del servidor
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack
    })
  });
});

module.exports = app;