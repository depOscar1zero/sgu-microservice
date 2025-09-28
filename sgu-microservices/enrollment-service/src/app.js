const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Importar rutas
const enrollmentRoutes = require('./routes/enrollmentRoutes');

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
    service: 'Enrollment Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'SQLite Connected'
  });
});

// Información del servicio
app.get('/info', (req, res) => {
  res.status(200).json({
    service: 'Enrollment Service',
    description: 'Microservicio para gestión de inscripciones de estudiantes',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      enrollments: {
        enroll: 'POST /api/enrollments',
        myEnrollments: 'GET /api/enrollments/my',
        getById: 'GET /api/enrollments/:id',
        cancel: 'PUT /api/enrollments/:id/cancel',
        processPayment: 'PUT /api/enrollments/:id/payment',
        courseEnrollments: 'GET /api/enrollments/course/:courseId (admin)',
        stats: 'GET /api/enrollments/stats (admin)'
      }
    },
    integrations: {
      authService: process.env.AUTH_SERVICE_URL,
      coursesService: process.env.COURSES_SERVICE_URL
    },
    businessRules: {
      maxEnrollmentsPerStudent: process.env.MAX_ENROLLMENTS_PER_STUDENT || 8,
      enrollmentDeadlineHours: process.env.ENROLLMENT_DEADLINE_HOURS || 24
    },
    timestamp: new Date().toISOString()
  });
});

// Rutas principales
app.use('/api/enrollments', enrollmentRoutes);

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada en el servicio de inscripciones`,
    timestamp: new Date().toISOString()
  });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error capturado en Enrollment Service:', err);

  // Error de validación de Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
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

  // Error de duplicado (inscripción única)
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Ya existe una inscripción para este estudiante en este curso',
      timestamp: new Date().toISOString()
    });
  }

  // Error de foreign key (referencias inválidas)
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Referencias inválidas en los datos proporcionados',
      timestamp: new Date().toISOString()
    });
  }

  // Error de conexión a otros servicios
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      message: 'Servicio externo no disponible temporalmente',
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