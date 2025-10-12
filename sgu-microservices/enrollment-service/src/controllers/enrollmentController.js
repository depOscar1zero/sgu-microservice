const Enrollment = require('../models/Enrollment');
const {
  CoursesServiceClient,
} = require('../services/externalServices');
const axios = require('axios');

/**
 * Wrapper para manejo de errores async
 */
const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Función para enviar notificación de inscripción
 * TODO: Implementar cuando el servicio de notificaciones esté disponible
 */
/* eslint-disable-next-line no-unused-vars */
const sendEnrollmentNotification = async (_user, _course, _enrollment) => {
  try {
    const notificationsUrl =
      process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3005';

    const notificationData = {
      recipient: {
        userId: user.id.toString(),
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
      subject: `Confirmación de Inscripción - ${course.code}`,
      message: `
        <h2>¡Inscripción Confirmada!</h2>
        <p>Hola <strong>${user.firstName}</strong>,</p>
        <p>Tu inscripción al curso ha sido confirmada exitosamente.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Detalles del Curso:</h3>
          <p><strong>Curso:</strong> ${course.name}</p>
          <p><strong>Código:</strong> ${course.code}</p>
          <p><strong>Horario:</strong> ${
            course.scheduleDays ? course.scheduleDays.join(', ') : 'Por definir'
          }</p>
          <p><strong>Instructor:</strong> ${course.instructorName}</p>
          <p><strong>Créditos:</strong> ${course.credits}</p>
        </div>
        <p>¡Esperamos que tengas un excelente semestre!</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un email automático del Sistema de Gestión Universitaria.
        </p>
      `,
      type: 'email',
      channel: 'email',
      priority: 'high',
      category: 'enrollment',
      metadata: {
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        enrollmentId: enrollment.id,
        instructorName: course.instructorName,
        schedule: course.scheduleDays
          ? course.scheduleDays.join(', ')
          : 'Por definir',
      },
    };

    await axios.post(
      `${notificationsUrl}/api/notifications/`,
      notificationData
    );
    console.log(`✅ Notificación de inscripción enviada a ${user.email}`);
  } catch (error) {
    console.error(
      '❌ Error enviando notificación de inscripción:',
      error.message
    );
    // No lanzar error para no interrumpir la inscripción
  }
};

/**
 * Inscribir estudiante a un curso
 */
const enrollStudent = catchAsync(async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.userId;

  // 1. Verificar que el curso existe y está disponible
  const courseResult =
    await CoursesServiceClient.checkCourseAvailability(courseId);
  if (!courseResult.success) {
    return res.status(400).json({
      success: false,
      message: courseResult.error,
      timestamp: new Date().toISOString(),
    });
  }

  const course = courseResult.data;
  if (!course.canEnroll) {
    return res.status(400).json({
      success: false,
      message: 'El curso no está disponible para inscripción',
      details: {
        status: course.status,
        availableSlots: course.availableSlots,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Verificar que el estudiante no esté ya inscrito
  const existingEnrollment = await Enrollment.findOne({
    where: {
      userId,
      courseId,
      status: ['Pending', 'Confirmed', 'Paid', 'Completed'],
    },
  });

  if (existingEnrollment) {
    return res.status(409).json({
      success: false,
      message: 'Ya estás inscrito en este curso',
      enrollment: existingEnrollment.toPublicJSON(),
      timestamp: new Date().toISOString(),
    });
  }

  // 3. Verificar límite de inscripciones del estudiante
  const activeEnrollments = await Enrollment.findActiveByUser(userId);
  const maxEnrollments = parseInt(process.env.MAX_ENROLLMENTS_PER_STUDENT) || 8;

  if (activeEnrollments.length >= maxEnrollments) {
    return res.status(400).json({
      success: false,
      message: `Has alcanzado el límite máximo de ${maxEnrollments} inscripciones activas`,
      currentEnrollments: activeEnrollments.length,
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Verificar prerrequisitos
  const prerequisitesResult = await CoursesServiceClient.checkPrerequisites(
    courseId,
    userId,
    req.headers.authorization
  );
  if (!prerequisitesResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Error verificando prerrequisitos',
      error: prerequisitesResult.error,
      timestamp: new Date().toISOString(),
    });
  }

  if (!prerequisitesResult.data.canEnroll) {
    return res.status(400).json({
      success: false,
      message: 'No cumples con los prerrequisitos para este curso',
      missingPrerequisites: prerequisitesResult.data.missingPrerequisites,
      timestamp: new Date().toISOString(),
    });
  }

  // 5. Reservar cupo en el curso
  const reservationResult = await CoursesServiceClient.reserveSlots(
    courseId,
    1
  );
  if (!reservationResult.success) {
    return res.status(400).json({
      success: false,
      message: 'No se pudo reservar cupo en el curso',
      error: reservationResult.error,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // 6. Crear la inscripción
    const enrollment = await Enrollment.create({
      userId,
      courseId,
      studentEmail: req.user.email,
      studentName: `${req.user.firstName || ''} ${
        req.user.lastName || ''
      }`.trim(),
      studentId: req.user.studentId,
      courseCode: course.code,
      courseName: course.name,
      courseCredits: course.credits,
      courseSemester: course.semester,
      amount: course.price,
      currency: course.currency || 'USD',
      status: 'Pending',
      enrolledBy: userId,
    });

    // 7. Confirmar automáticamente la inscripción
    await enrollment.confirm();

    res.status(201).json({
      success: true,
      message: 'Inscripción realizada exitosamente',
      data: {
        enrollment: enrollment.toPublicJSON(),
        course: {
          id: course.id,
          code: course.code,
          name: course.name,
          availableSlots: reservationResult.data.availableSlots,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Si falla la creación de la inscripción, liberar el cupo
    console.error('Error creando inscripción, liberando cupo:', error);
    await CoursesServiceClient.releaseSlots(courseId, 1);
    throw error;
  }
});

/**
 * Obtener inscripciones de un estudiante
 */
const getStudentEnrollments = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { status, semester } = req.query;

  const whereClause = { userId };
  if (status) whereClause.status = status;
  if (semester) whereClause.courseSemester = semester;

  const enrollments = await Enrollment.findAll({
    where: whereClause,
    order: [['enrollmentDate', 'DESC']],
  });

  res.status(200).json({
    success: true,
    data: {
      enrollments: enrollments.map(e => e.toPublicJSON()),
      summary: {
        total: enrollments.length,
        byStatus: {
          pending: enrollments.filter(e => e.status === 'Pending').length,
          confirmed: enrollments.filter(e => e.status === 'Confirmed').length,
          paid: enrollments.filter(e => e.status === 'Paid').length,
          completed: enrollments.filter(e => e.status === 'Completed').length,
          cancelled: enrollments.filter(e => e.status === 'Cancelled').length,
        },
      },
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Obtener inscripciones de un curso (solo para administradores)
 */
const getCourseEnrollments = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  // Verificar que el curso existe
  const courseResult = await CoursesServiceClient.getCourseById(courseId);
  if (!courseResult.success) {
    return res.status(404).json({
      success: false,
      message: 'Curso no encontrado',
      timestamp: new Date().toISOString(),
    });
  }

  const enrollments = await Enrollment.findByCourse(courseId);

  res.status(200).json({
    success: true,
    data: {
      course: courseResult.data,
      enrollments: enrollments.map(e => e.toPublicJSON()),
      summary: {
        totalEnrolled: enrollments.length,
        byStatus: {
          confirmed: enrollments.filter(e => e.status === 'Confirmed').length,
          paid: enrollments.filter(e => e.status === 'Paid').length,
          completed: enrollments.filter(e => e.status === 'Completed').length,
        },
      },
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Obtener detalles de una inscripción específica
 */
const getEnrollmentById = catchAsync(async (req, res) => {
  const { enrollmentId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const enrollment = await Enrollment.findByPk(enrollmentId);

  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Inscripción no encontrada',
      timestamp: new Date().toISOString(),
    });
  }

  // Verificar permisos: solo el propietario o un admin puede ver la inscripción
  if (enrollment.userId !== userId && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para ver esta inscripción',
      timestamp: new Date().toISOString(),
    });
  }

  res.status(200).json({
    success: true,
    data: {
      enrollment: enrollment.toPublicJSON(),
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Cancelar inscripción
 */
const cancelEnrollment = catchAsync(async (req, res) => {
  const { enrollmentId } = req.params;
  const { reason } = req.body;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const enrollment = await Enrollment.findByPk(enrollmentId);

  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Inscripción no encontrada',
      timestamp: new Date().toISOString(),
    });
  }

  // Verificar permisos
  if (enrollment.userId !== userId && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para cancelar esta inscripción',
      timestamp: new Date().toISOString(),
    });
  }

  // Verificar que se puede cancelar
  if (!enrollment.canBeCancelled()) {
    return res.status(400).json({
      success: false,
      message: 'Esta inscripción no puede ser cancelada',
      currentStatus: enrollment.status,
      timestamp: new Date().toISOString(),
    });
  }

  // Liberar cupo en el curso
  const releaseResult = await CoursesServiceClient.releaseSlots(
    enrollment.courseId,
    1
  );
  if (!releaseResult.success) {
    console.warn('No se pudo liberar cupo en el curso:', releaseResult.error);
  }

  // Cancelar inscripción
  await enrollment.cancel(reason, userId);

  res.status(200).json({
    success: true,
    message: 'Inscripción cancelada exitosamente',
    data: {
      enrollment: enrollment.toPublicJSON(),
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Procesar pago de inscripción
 */
const processPayment = catchAsync(async (req, res) => {
  const { enrollmentId } = req.params;
  const { paymentId, amount } = req.body;
  const userId = req.user.userId;

  const enrollment = await Enrollment.findByPk(enrollmentId);

  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Inscripción no encontrada',
      timestamp: new Date().toISOString(),
    });
  }

  // Verificar permisos
  if (enrollment.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para procesar el pago de esta inscripción',
      timestamp: new Date().toISOString(),
    });
  }

  // Verificar que requiere pago
  if (!enrollment.requiresPayment()) {
    return res.status(400).json({
      success: false,
      message: 'Esta inscripción no requiere pago',
      paymentStatus: enrollment.paymentStatus,
      timestamp: new Date().toISOString(),
    });
  }

  // Verificar monto
  if (amount && parseFloat(amount) !== parseFloat(enrollment.amount)) {
    return res.status(400).json({
      success: false,
      message: 'El monto del pago no coincide con el monto de la inscripción',
      expected: enrollment.amount,
      received: amount,
      timestamp: new Date().toISOString(),
    });
  }

  // Marcar como pagada
  await enrollment.markAsPaid(paymentId);

  res.status(200).json({
    success: true,
    message: 'Pago procesado exitosamente',
    data: {
      enrollment: enrollment.toPublicJSON(),
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Obtener estadísticas de inscripciones
 */
const getEnrollmentStats = catchAsync(async (req, res) => {
  const { semester } = req.query;

  // Estadísticas generales
  const totalEnrollments = await Enrollment.count({
    where: semester ? { courseSemester: semester } : {},
  });

  const enrollmentsByStatus = await Enrollment.findAll({
    attributes: [
      'status',
      [
        Enrollment.sequelize.fn('COUNT', Enrollment.sequelize.col('status')),
        'count',
      ],
    ],
    where: semester ? { courseSemester: semester } : {},
    group: ['status'],
    raw: true,
  });

  // Obtener inscripciones por semestre de forma más simple
  const allEnrollments = await Enrollment.findAll({
    attributes: ['courseSemester'],
    raw: true,
  });

  const enrollmentsBySemester = allEnrollments.reduce((acc, enrollment) => {
    const semester = enrollment.courseSemester || 'Unknown';
    acc[semester] = (acc[semester] || 0) + 1;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      total: totalEnrollments,
      byStatus: enrollmentsByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      bySemester: Object.entries(enrollmentsBySemester).map(
        ([semester, count]) => ({
          semester,
          count,
        })
      ),
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Obtener todas las inscripciones con filtros opcionales (admin)
 */
const getAllEnrollments = catchAsync(async (req, res) => {
  const { studentId, courseId, status } = req.query;

  const whereClause = {};
  if (studentId) whereClause.studentId = studentId;
  if (courseId) whereClause.courseId = courseId;
  if (status) whereClause.status = status;

  const enrollments = await Enrollment.findAll({
    where: whereClause,
    order: [['enrollmentDate', 'DESC']],
  });

  res.status(200).json({
    success: true,
    data: enrollments.map(e => e.toPublicJSON()),
    summary: {
      total: enrollments.length,
      byStatus: {
        pending: enrollments.filter(e => e.status === 'Pending').length,
        confirmed: enrollments.filter(e => e.status === 'Confirmed').length,
        paid: enrollments.filter(e => e.status === 'Paid').length,
        completed: enrollments.filter(e => e.status === 'Completed').length,
        cancelled: enrollments.filter(e => e.status === 'Cancelled').length,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Aprobar inscripción (admin)
 */
const approveEnrollment = catchAsync(async (req, res) => {
  const { enrollmentId } = req.params;

  const enrollment = await Enrollment.findByPk(enrollmentId);

  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Inscripción no encontrada',
      timestamp: new Date().toISOString(),
    });
  }

  if (enrollment.status !== 'Pending') {
    return res.status(400).json({
      success: false,
      message: 'Solo se pueden aprobar inscripciones pendientes',
      currentStatus: enrollment.status,
      timestamp: new Date().toISOString(),
    });
  }

  await enrollment.confirm();

  res.status(200).json({
    success: true,
    message: 'Inscripción aprobada exitosamente',
    data: {
      enrollment: enrollment.toPublicJSON(),
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Rechazar inscripción (admin)
 */
const rejectEnrollment = catchAsync(async (req, res) => {
  const { enrollmentId } = req.params;
  const { reason } = req.body;

  const enrollment = await Enrollment.findByPk(enrollmentId);

  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Inscripción no encontrada',
      timestamp: new Date().toISOString(),
    });
  }

  if (!['Pending', 'Confirmed'].includes(enrollment.status)) {
    return res.status(400).json({
      success: false,
      message: 'Solo se pueden rechazar inscripciones pendientes o confirmadas',
      currentStatus: enrollment.status,
      timestamp: new Date().toISOString(),
    });
  }

  // Liberar cupo en el curso si estaba confirmada
  if (enrollment.status === 'Confirmed') {
    const releaseResult = await CoursesServiceClient.releaseSlots(
      enrollment.courseId,
      1
    );
    if (!releaseResult.success) {
      console.warn('No se pudo liberar cupo en el curso:', releaseResult.error);
    }
  }

  await enrollment.cancel(
    reason || 'Rechazada por administrador',
    req.user.userId
  );

  res.status(200).json({
    success: true,
    message: 'Inscripción rechazada exitosamente',
    data: {
      enrollment: enrollment.toPublicJSON(),
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = {
  enrollStudent,
  getStudentEnrollments,
  getAllEnrollments,
  getCourseEnrollments,
  getEnrollmentById,
  cancelEnrollment,
  processPayment,
  getEnrollmentStats,
  approveEnrollment,
  rejectEnrollment,
};
