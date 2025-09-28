const Course = require('../models/Course');

/**
 * Wrapper para manejo de errores async
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Obtener todos los cursos con filtros y paginación
 */
const getAllCourses = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    department,
    level,
    semester,
    status = 'Activo',
    search
  } = req.query;

  // Construcción de filtros
  const filters = { isVisible: true };

  if (department) filters.department = department;
  if (level) filters.level = level;
  if (semester) filters.semester = semester;
  if (status) filters.status = status;

  // Búsqueda por texto en nombre y descripción
  if (search) {
    filters.$text = { $search: search };
  }

  // Configuración de paginación
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = Math.min(parseInt(limit), 100); // Máximo 100 por página

  // Consulta con paginación
  const courses = await Course.find(filters)
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 })
    .select('-__v');

  const total = await Course.countDocuments(filters);
  const totalPages = Math.ceil(total / limitNum);

  res.status(200).json({
    success: true,
    data: {
      courses,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalResults: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Obtener un curso por ID
 */
const getCourseById = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id).select('-__v');

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Curso no encontrado',
      timestamp: new Date().toISOString()
    });
  }

  res.status(200).json({
    success: true,
    data: { course },
    timestamp: new Date().toISOString()
  });
});

/**
 * Obtener un curso por código
 */
const getCourseByCode = catchAsync(async (req, res) => {
  const course = await Course.findOne({ 
    code: req.params.code.toUpperCase(),
    isVisible: true 
  }).select('-__v');

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Curso no encontrado',
      timestamp: new Date().toISOString()
    });
  }

  res.status(200).json({
    success: true,
    data: { course },
    timestamp: new Date().toISOString()
  });
});

/**
 * Crear nuevo curso
 */
const createCourse = catchAsync(async (req, res) => {
  // Verificar si ya existe un curso con el mismo código
  const existingCourse = await Course.findOne({ code: req.body.code });
  if (existingCourse) {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un curso con este código',
      timestamp: new Date().toISOString()
    });
  }

  // Establecer cupos disponibles igual a la capacidad por defecto
  if (!req.body.availableSlots) {
    req.body.availableSlots = req.body.capacity;
  }

  const course = new Course(req.body);
  await course.save();

  res.status(201).json({
    success: true,
    message: 'Curso creado exitosamente',
    data: { course },
    timestamp: new Date().toISOString()
  });
});

/**
 * Actualizar curso
 */
const updateCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Curso no encontrado',
      timestamp: new Date().toISOString()
    });
  }

  // Verificar si se está cambiando el código y ya existe otro curso con ese código
  if (req.body.code && req.body.code !== course.code) {
    const existingCourse = await Course.findOne({ 
      code: req.body.code,
      _id: { $ne: req.params.id }
    });
    
    if (existingCourse) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otro curso con este código',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Actualizar campos
  Object.keys(req.body).forEach(key => {
    course[key] = req.body[key];
  });

  await course.save();

  res.status(200).json({
    success: true,
    message: 'Curso actualizado exitosamente',
    data: { course },
    timestamp: new Date().toISOString()
  });
});

/**
 * Eliminar curso (soft delete)
 */
const deleteCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Curso no encontrado',
      timestamp: new Date().toISOString()
    });
  }

  // Soft delete - solo marcamos como no visible
  course.isVisible = false;
  course.status = 'Inactivo';
  await course.save();

  res.status(200).json({
    success: true,
    message: 'Curso eliminado exitosamente',
    timestamp: new Date().toISOString()
  });
});

/**
 * Reservar cupos en un curso
 */
const reserveSlots = catchAsync(async (req, res) => {
  const { quantity = 1 } = req.body;
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Curso no encontrado',
      timestamp: new Date().toISOString()
    });
  }

  if (course.status !== 'Activo') {
    return res.status(400).json({
      success: false,
      message: 'No se pueden reservar cupos en un curso inactivo',
      timestamp: new Date().toISOString()
    });
  }

  const success = course.reserveSlots(quantity);

  if (!success) {
    return res.status(400).json({
      success: false,
      message: 'No hay suficientes cupos disponibles',
      data: { 
        requested: quantity,
        available: course.availableSlots 
      },
      timestamp: new Date().toISOString()
    });
  }

  await course.save();

  res.status(200).json({
    success: true,
    message: `${quantity} cupo(s) reservado(s) exitosamente`,
    data: { 
      course: {
        id: course._id,
        code: course.code,
        name: course.name,
        availableSlots: course.availableSlots,
        capacity: course.capacity,
        status: course.status
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Liberar cupos de un curso
 */
const releaseSlots = catchAsync(async (req, res) => {
  const { quantity = 1 } = req.body;
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Curso no encontrado',
      timestamp: new Date().toISOString()
    });
  }

  course.releaseSlots(quantity);
  await course.save();

  res.status(200).json({
    success: true,
    message: `${quantity} cupo(s) liberado(s) exitosamente`,
    data: { 
      course: {
        id: course._id,
        code: course.code,
        name: course.name,
        availableSlots: course.availableSlots,
        capacity: course.capacity,
        status: course.status
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Obtener estadísticas de cursos
 */
const getCourseStats = catchAsync(async (req, res) => {
  const stats = await Course.aggregate([
    { $match: { isVisible: true } },
    {
      $group: {
        _id: null,
        totalCourses: { $sum: 1 },
        activeCourses: {
          $sum: { $cond: [{ $eq: ['$status', 'Activo'] }, 1, 0] }
        },
        fullCourses: {
          $sum: { $cond: [{ $eq: ['$status', 'Lleno'] }, 1, 0] }
        },
        totalCapacity: { $sum: '$capacity' },
        totalEnrolled: { $sum: { $subtract: ['$capacity', '$availableSlots'] } },
        avgPrice: { $avg: '$price' }
      }
    }
  ]);

  const departmentStats = await Course.aggregate([
    { $match: { isVisible: true } },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      general: stats[0] || {},
      byDepartment: departmentStats
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = {
  getAllCourses,
  getCourseById,
  getCourseByCode,
  createCourse,
  updateCourse,
  deleteCourse,
  reserveSlots,
  releaseSlots,
  getCourseStats
};