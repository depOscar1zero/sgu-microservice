const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getAllCourses,
  getCourseById,
  getCourseByCode,
  createCourse,
  updateCourse,
  deleteCourse,
  reserveSlots,
  releaseSlots,
  getCourseStats
} = require('../controllers/coursesController');

const router = express.Router();

/**
 * Validaciones comunes
 */
const validateObjectId = [
  param('id').isMongoId().withMessage('ID de curso inválido')
];

const validateCourseCode = [
  param('code').matches(/^[A-Z]{2,4}\d{3,4}$/).withMessage('Código de curso inválido (ej: MATH101)')
];

const validateCourseCreation = [
  body('code')
    .matches(/^[A-Z]{2,4}\d{3,4}$/)
    .withMessage('Código debe seguir el formato: 2-4 letras + 3-4 números (ej: MATH101)'),
  
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nombre debe tener entre 3 y 100 caracteres'),
  
  body('description')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Descripción debe tener entre 10 y 1000 caracteres'),
  
  body('department')
    .isIn(['Ingeniería', 'Matemáticas', 'Ciencias', 'Humanidades', 'Administración', 'Derecho', 'Medicina', 'Arquitectura'])
    .withMessage('Departamento no válido'),
  
  body('credits')
    .isInt({ min: 1, max: 12 })
    .withMessage('Créditos debe ser un número entre 1 y 12'),
  
  body('level')
    .isIn(['Pregrado', 'Posgrado', 'Maestría', 'Doctorado'])
    .withMessage('Nivel no válido'),
  
  body('capacity')
    .isInt({ min: 5, max: 200 })
    .withMessage('Capacidad debe ser un número entre 5 y 200'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Precio debe ser un número positivo'),
  
  body('currency')
    .isIn(['USD', 'MXN', 'EUR'])
    .withMessage('Moneda no válida'),
  
  body('schedule.startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora de inicio inválida (formato HH:MM)'),
  
  body('schedule.endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora de fin inválida (formato HH:MM)'),
  
  body('semester')
    .matches(/^(Primavera|Verano|Otoño|Invierno)\s\d{4}$/)
    .withMessage('Formato de semestre inválido (ej: "Primavera 2025")'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  
  body('endDate')
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
  
  body('instructor.name')
    .isLength({ min: 2 })
    .withMessage('Nombre del instructor requerido'),
  
  body('instructor.email')
    .isEmail()
    .withMessage('Email del instructor inválido')
];

const validateSlotOperation = [
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Cantidad debe ser un número entre 1 y 50')
];

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      })),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Rutas públicas (no requieren autenticación)
 */

// GET /api/courses - Obtener todos los cursos con filtros
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe ser entre 1 y 100'),
  query('department').optional().isIn(['Ingeniería', 'Matemáticas', 'Ciencias', 'Humanidades', 'Administración', 'Derecho', 'Medicina', 'Arquitectura']),
  query('level').optional().isIn(['Pregrado', 'Posgrado', 'Maestría', 'Doctorado']),
  query('status').optional().isIn(['Activo', 'Inactivo', 'Lleno', 'Cancelado']),
  handleValidationErrors
], getAllCourses);

// GET /api/courses/stats - Obtener estadísticas de cursos
router.get('/stats', getCourseStats);

// GET /api/courses/:id - Obtener curso por ID
router.get('/:id', validateObjectId, handleValidationErrors, getCourseById);

// GET /api/courses/code/:code - Obtener curso por código
router.get('/code/:code', validateCourseCode, handleValidationErrors, getCourseByCode);

/**
 * Rutas protegidas (requieren autenticación de administrador)
 * Nota: Por ahora las dejamos sin middleware de auth para desarrollo
 * Más adelante agregaremos: requireAuth, restrictTo('admin')
 */

// POST /api/courses - Crear nuevo curso
router.post('/', validateCourseCreation, handleValidationErrors, createCourse);

// PUT /api/courses/:id - Actualizar curso
router.put('/:id', [
  ...validateObjectId,
  ...validateCourseCreation
], handleValidationErrors, updateCourse);

// DELETE /api/courses/:id - Eliminar curso (soft delete)
router.delete('/:id', validateObjectId, handleValidationErrors, deleteCourse);

/**
 * Rutas específicas para gestión de cupos
 */

// POST /api/courses/:id/reserve - Reservar cupos
router.post('/:id/reserve', [
  ...validateObjectId,
  ...validateSlotOperation
], handleValidationErrors, reserveSlots);

// POST /api/courses/:id/release - Liberar cupos
router.post('/:id/release', [
  ...validateObjectId,
  ...validateSlotOperation
], handleValidationErrors, releaseSlots);

module.exports = router;