const express = require('express');
const { body, param, query } = require('express-validator');
const {
  enrollStudent,
  getStudentEnrollments,
  getCourseEnrollments,
  getEnrollmentById,
  cancelEnrollment,
  processPayment,
  getEnrollmentStats
} = require('../controllers/enrollmentController');

const {
  authenticateToken,
  requireStudent,
  requireAdmin,
  requireStudentOrAdmin
} = require('../middleware/authMiddleware');

const router = express.Router();

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
 * Validaciones
 */
const validateEnrollment = [
  body('courseId')
    .notEmpty()
    .withMessage('ID del curso es requerido')
    .isLength({ min: 20, max: 30 })
    .withMessage('ID del curso debe tener formato válido')
];

const validateCancelEnrollment = [
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La razón no puede exceder 500 caracteres')
];

const validatePayment = [
  body('paymentId')
    .notEmpty()
    .withMessage('ID del pago es requerido'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El monto debe ser un número positivo')
];

const validateObjectId = [
  param('enrollmentId')
    .isUUID()
    .withMessage('ID de inscripción inválido')
];

const validateCourseId = [
  param('courseId')
    .isLength({ min: 20, max: 30 })
    .withMessage('ID de curso inválido')
];

/**
 * RUTAS PARA ESTUDIANTES
 */

// POST /api/enrollments - Inscribir estudiante a un curso
router.post('/', [
  authenticateToken,
  requireStudent,
  ...validateEnrollment,
  handleValidationErrors
], enrollStudent);

// GET /api/enrollments/my - Obtener mis inscripciones
router.get('/my', [
  authenticateToken,
  requireStudent,
  query('status')
    .optional()
    .isIn(['Pending', 'Confirmed', 'Paid', 'Cancelled', 'Completed', 'Failed'])
    .withMessage('Estado de inscripción inválido'),
  query('semester')
    .optional()
    .matches(/^(Primavera|Verano|Otoño|Invierno)\s\d{4}$/)
    .withMessage('Formato de semestre inválido'),
  handleValidationErrors
], getStudentEnrollments);

// GET /api/enrollments/:enrollmentId - Obtener detalles de una inscripción
router.get('/:enrollmentId', [
  authenticateToken,
  requireStudentOrAdmin,
  ...validateObjectId,
  handleValidationErrors
], getEnrollmentById);

// PUT /api/enrollments/:enrollmentId/cancel - Cancelar inscripción
router.put('/:enrollmentId/cancel', [
  authenticateToken,
  requireStudentOrAdmin,
  ...validateObjectId,
  ...validateCancelEnrollment,
  handleValidationErrors
], cancelEnrollment);

// PUT /api/enrollments/:enrollmentId/payment - Procesar pago
router.put('/:enrollmentId/payment', [
  authenticateToken,
  requireStudent,
  ...validateObjectId,
  ...validatePayment,
  handleValidationErrors
], processPayment);

/**
 * RUTAS PARA ADMINISTRADORES
 */

// GET /api/enrollments/course/:courseId - Obtener inscripciones de un curso
router.get('/course/:courseId', [
  authenticateToken,
  requireAdmin,
  ...validateCourseId,
  handleValidationErrors
], getCourseEnrollments);

// GET /api/enrollments/stats - Obtener estadísticas de inscripciones
router.get('/stats', [
  authenticateToken,
  requireAdmin,
  query('semester')
    .optional()
    .matches(/^(Primavera|Verano|Otoño|Invierno)\s\d{4}$/)
    .withMessage('Formato de semestre inválido'),
  handleValidationErrors
], getEnrollmentStats);

module.exports = router;