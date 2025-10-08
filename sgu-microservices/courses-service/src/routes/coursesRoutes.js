const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const {
  getAllCourses,
  getCourseById,
  getCourseByCode,
  createCourse,
  updateCourse,
  deleteCourse,
  reserveSlots,
  releaseSlots,
  getCourseStats,
} = require('../controllers/coursesController');

const router = express.Router();

// Middleware de validación
const validateCourse = [
  body('code').notEmpty().withMessage('Course code is required'),
  body('name').notEmpty().withMessage('Course name is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('credits')
    .isInt({ min: 1, max: 10 })
    .withMessage('Credits must be between 1 and 10'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('price')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Price must be a valid decimal'),
];

// GET /api/courses - Obtener todos los cursos
router.get('/', getAllCourses);

// GET /api/courses/stats - Obtener estadísticas de cursos
router.get('/stats', getCourseStats);

// GET /api/courses/code/:code - Obtener curso por código
router.get('/code/:code', getCourseByCode);

// GET /api/courses/:id - Obtener un curso por ID
router.get('/:id', getCourseById);

// POST /api/courses - Crear un nuevo curso
router.post('/', validateCourse, createCourse);

// PUT /api/courses/:id - Actualizar un curso
router.put('/:id', validateCourse, updateCourse);

// DELETE /api/courses/:id - Eliminar un curso (soft delete)
router.delete('/:id', deleteCourse);

// GET /api/courses/:id/availability - Verificar disponibilidad
router.get('/:id/availability', async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const availableSlots = course.getAvailableSlots();
    res.json({
      courseId: course.id,
      code: course.code,
      name: course.name,
      capacity: course.capacity,
      enrolled: course.enrolled,
      availableSlots,
      isFull: availableSlots <= 0,
      isAvailable: course.isAvailable(),
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/courses/:id/reserve - Reservar cupos
router.post('/:id/reserve', reserveSlots);

// POST /api/courses/:id/release - Liberar cupos
router.post('/:id/release', releaseSlots);

// POST /api/courses/:id/enroll - Inscribir estudiante
router.post('/:id/enroll', async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (!course.isAvailable()) {
      return res.status(400).json({ error: 'Course is not available or full' });
    }

    await course.update({ enrolled: course.enrolled + 1 });
    res.json({
      message: 'Enrollment successful',
      enrolled: course.enrolled,
      capacity: course.capacity,
      availableSlots: course.getAvailableSlots(),
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
