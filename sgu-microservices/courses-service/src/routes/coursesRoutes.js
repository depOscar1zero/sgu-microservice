const express = require("express");
const { body, validationResult } = require("express-validator");
const Course = require("../models/Course");

const router = express.Router();

// Middleware de validación
const validateCourse = [
  body("code").notEmpty().withMessage("Course code is required"),
  body("name").notEmpty().withMessage("Course name is required"),
  body("department").notEmpty().withMessage("Department is required"),
  body("credits")
    .isInt({ min: 1, max: 10 })
    .withMessage("Credits must be between 1 and 10"),
  body("capacity").isInt({ min: 1 }).withMessage("Capacity must be at least 1"),
  body("price")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Price must be a valid decimal"),
];

// GET /api/courses - Obtener todos los cursos
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, department, status = "ACTIVE" } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (department) where.department = department;
    if (status) where.status = status;
    where.isVisible = true;

    const { count, rows } = await Course.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["code", "ASC"]],
    });

    res.json({
      data: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/courses/:id - Obtener un curso por ID
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/courses - Crear un nuevo curso
router.post("/", validateCourse, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/courses/:id - Actualizar un curso
router.put("/:id", validateCourse, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    await course.update(req.body);
    res.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/courses/:id - Eliminar un curso (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Soft delete - marcar como invisible
    await course.update({ isVisible: false, status: "INACTIVE" });
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/courses/:id/availability - Verificar disponibilidad
router.get("/:id/availability", async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
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
    console.error("Error checking availability:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/courses/:id/enroll - Inscribir estudiante
router.post("/:id/enroll", async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (!course.isAvailable()) {
      return res.status(400).json({ error: "Course is not available or full" });
    }

    await course.update({ enrolled: course.enrolled + 1 });
    res.json({
      message: "Enrollment successful",
      enrolled: course.enrolled,
      capacity: course.capacity,
      availableSlots: course.getAvailableSlots(),
    });
  } catch (error) {
    console.error("Error enrolling student:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
