const Course = require('../models/Course');
const { Op } = require('sequelize');

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
    status = 'ACTIVE',
    search
  } = req.query;

  // Construcción de filtros
  const where = { isVisible: true };

  if (department) where.department = department;
  if (status) where.status = status;

  // Búsqueda por texto en nombre y descripción
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }

  // Configuración de paginación
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = Math.min(parseInt(limit), 100); // Máximo 100 por página

  // Consulta con paginación usando Sequelize
  const { count, rows: courses } = await Course.findAndCountAll({
    where,
    limit: limitNum,
    offset,
    order: [['createdAt', 'DESC']]
  });

  const totalPages = Math.ceil(count / limitNum);

  res.status(200).json({
    success: true,
    data: {
      courses: courses,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalResults: count,
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
  const course = await Course.findByPk(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Curso no encontrado',
      timestamp: new Date().toISOString()
    });
  }

  res.status(200).json({
    success: true,
    data: course,
    timestamp: new Date().toISOString()
  });
});

/**
 * Obtener un curso por código
 */
const getCourseByCode = catchAsync(async (req, res) => {
  const course = await Course.findOne({ 
    where: {
      code: req.params.code.toUpperCase(),
      isVisible: true 
    }
  });

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Curso no encontrado',
      timestamp: new Date().toISOString()
    });
  }

  res.status(200).json({
    success: true,
    data: course,
    timestamp: new Date().toISOString()
  });
});

/**
 * Crear nuevo curso
 */
const createCourse = catchAsync(async (req, res) => {
  // Verificar si el código existe
  if (!req.body.code) {
    return res.status(400).json({
      success: false,
      message: 'El código del curso es requerido',
      timestamp: new Date().toISOString()
    });
  }

  // Verificar si ya existe un curso con el mismo código
  const existingCourse = await Course.findOne({ where: { code: req.body.code } });
  if (existingCourse) {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un curso con este código',
      timestamp: new Date().toISOString()
    });
  }

  // Crear el curso usando Sequelize
  const course = await Course.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Curso creado exitosamente',
    data: course,
    timestamp: new Date().toISOString()
  });
});

/**
 * Actualizar curso
 */
const updateCourse = catchAsync(async (req, res) => {
  const course = await Course.findByPk(req.params.id);

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
      where: {
        code: req.body.code,
        id: { [Op.ne]: req.params.id }
      }
    });
    
    if (existingCourse) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otro curso con este código',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Actualizar campos usando Sequelize
  await course.update(req.body);

  // Recargar el curso para obtener los datos actualizados
  await course.reload();

  res.status(200).json({
    success: true,
    message: 'Curso actualizado exitosamente',
    data: course,
    timestamp: new Date().toISOString()
  });
});

/**
 * Eliminar curso (soft delete)
 */
const deleteCourse = catchAsync(async (req, res) => {
  const course = await Course.findByPk(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Curso no encontrado',
      timestamp: new Date().toISOString()
    });
  }

  // Soft delete - solo marcamos como no visible
  await course.update({
    isVisible: false,
    status: 'INACTIVE'
  });

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
  const course = await Course.findByPk(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Curso no encontrado',
      timestamp: new Date().toISOString()
    });
  }

  if (course.status !== 'ACTIVE') {
    return res.status(400).json({
      success: false,
      message: 'No se pueden reservar cupos en un curso inactivo',
      timestamp: new Date().toISOString()
    });
  }

  const availableSlots = course.getAvailableSlots();

  if (quantity > availableSlots) {
    return res.status(400).json({
      success: false,
      message: 'No hay suficientes cupos disponibles',
      data: { 
        requested: quantity,
        available: availableSlots 
      },
      timestamp: new Date().toISOString()
    });
  }

  await course.update({
    enrolled: course.enrolled + quantity
  });

  res.status(200).json({
    success: true,
    message: `${quantity} cupo(s) reservado(s) exitosamente`,
    data: { 
      course: {
        id: course.id,
        code: course.code,
        name: course.name,
        availableSlots: course.getAvailableSlots(),
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
  const course = await Course.findByPk(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Curso no encontrado',
      timestamp: new Date().toISOString()
    });
  }

  const newEnrolled = Math.max(0, course.enrolled - quantity);
  await course.update({
    enrolled: newEnrolled
  });

  res.status(200).json({
    success: true,
    message: `${quantity} cupo(s) liberado(s) exitosamente`,
    data: { 
      course: {
        id: course.id,
        code: course.code,
        name: course.name,
        availableSlots: course.getAvailableSlots(),
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
  // Obtener estadísticas generales usando Sequelize
  const totalCourses = await Course.count({ where: { isVisible: true } });
  const activeCourses = await Course.count({ 
    where: { 
      isVisible: true, 
      status: 'ACTIVE' 
    } 
  });
  
  const courses = await Course.findAll({
    where: { isVisible: true },
    attributes: ['capacity', 'enrolled', 'price', 'department']
  });

  const totalCapacity = courses.reduce((sum, course) => sum + course.capacity, 0);
  const totalEnrolled = courses.reduce((sum, course) => sum + course.enrolled, 0);
  const avgPrice = courses.length > 0 
    ? courses.reduce((sum, course) => sum + parseFloat(course.price), 0) / courses.length 
    : 0;

  // Estadísticas por departamento
  const departmentStats = {};
  courses.forEach(course => {
    if (!departmentStats[course.department]) {
      departmentStats[course.department] = {
        count: 0,
        totalPrice: 0,
        courses: []
      };
    }
    departmentStats[course.department].count++;
    departmentStats[course.department].totalPrice += parseFloat(course.price);
    departmentStats[course.department].courses.push(course);
  });

  // Calcular promedios por departamento
  const departmentStatsArray = Object.keys(departmentStats).map(dept => ({
    department: dept,
    count: departmentStats[dept].count,
    avgPrice: departmentStats[dept].totalPrice / departmentStats[dept].count
  })).sort((a, b) => b.count - a.count);

  res.status(200).json({
    success: true,
    data: {
      totalCourses,
      activeCourses,
      inactiveCourses: totalCourses - activeCourses,
      totalCapacity,
      totalEnrolled,
      avgPrice: Math.round(avgPrice * 100) / 100,
      byDepartment: departmentStatsArray
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