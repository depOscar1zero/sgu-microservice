const Enrollment = require("../models/Enrollment");
const {
  AuthServiceClient,
  CoursesServiceClient,
} = require("../services/externalServices");
const axios = require("axios");

// Importar las estrategias de validación
const EnrollmentValidationContext = require("../strategies/EnrollmentValidationContext");
const AvailabilityValidationStrategy = require("../strategies/AvailabilityValidationStrategy");
const PrerequisitesValidationStrategy = require("../strategies/PrerequisitesValidationStrategy");
const EnrollmentLimitValidationStrategy = require("../strategies/EnrollmentLimitValidationStrategy");
const DuplicateEnrollmentValidationStrategy = require("../strategies/DuplicateEnrollmentValidationStrategy");

/**
 * Wrapper para manejo de errores async
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Función para enviar notificación de inscripción
 */
const sendEnrollmentNotification = async (user, course, enrollment) => {
  try {
    const notificationsUrl =
      process.env.NOTIFICATIONS_SERVICE_URL || "http://localhost:3005";

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
            course.scheduleDays ? course.scheduleDays.join(", ") : "Por definir"
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
      type: "email",
      channel: "email",
      priority: "high",
      category: "enrollment",
      metadata: {
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        enrollmentId: enrollment.id,
        instructorName: course.instructorName,
        schedule: course.scheduleDays
          ? course.scheduleDays.join(", ")
          : "Por definir",
      },
    };

    await axios.post(
      `${notificationsUrl}/api/notifications/`,
      notificationData
    );
    console.log(`✅ Notificación de inscripción enviada a ${user.email}`);
  } catch (error) {
    console.error(
      "❌ Error enviando notificación de inscripción:",
      error.message
    );
    // No lanzar error para no interrumpir la inscripción
  }
};

/**
 * Configurar el contexto de validación con todas las estrategias
 */
const setupValidationContext = () => {
  const context = new EnrollmentValidationContext();

  // Agregar estrategias en orden de prioridad
  context.addStrategy(new AvailabilityValidationStrategy());
  context.addStrategy(new PrerequisitesValidationStrategy());
  context.addStrategy(new EnrollmentLimitValidationStrategy());
  context.addStrategy(new DuplicateEnrollmentValidationStrategy());

  return context;
};

/**
 * Inscribir estudiante a un curso usando el patrón Strategy
 */
const enrollStudent = catchAsync(async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.userId;

  // Configurar contexto de validación
  const validationContext = setupValidationContext();

  // Contexto para las validaciones
  const validationData = {
    courseId,
    userId,
    authToken: req.headers.authorization,
  };

  // Ejecutar todas las validaciones
  const validationResult = await validationContext.validateUntilFirstError(
    validationData
  );

  if (!validationResult.isValid) {
    return res.status(400).json({
      success: false,
      message: validationResult.firstError.error,
      details: validationResult.firstError.details,
      validationStrategy: validationResult.strategy,
      timestamp: new Date().toISOString(),
    });
  }

  // Si todas las validaciones pasaron, proceder con la inscripción
  try {
    // Obtener información del curso (ya validada por AvailabilityValidationStrategy)
    const courseResult = await CoursesServiceClient.checkCourseAvailability(
      courseId
    );
    const course = courseResult.data;

    // Reservar cupo en el curso
    const reservationResult = await CoursesServiceClient.reserveSlots(
      courseId,
      1
    );
    if (!reservationResult.success) {
      return res.status(400).json({
        success: false,
        message: "No se pudo reservar cupo en el curso",
        error: reservationResult.error,
        timestamp: new Date().toISOString(),
      });
    }

    // Crear la inscripción
    const enrollment = await Enrollment.create({
      userId,
      courseId,
      studentEmail: req.user.email,
      studentName: `${req.user.firstName || ""} ${
        req.user.lastName || ""
      }`.trim(),
      studentId: req.user.studentId,
      courseCode: course.code,
      courseName: course.name,
      courseCredits: course.credits,
      courseSemester: course.semester,
      amount: course.price,
      currency: course.currency || "USD",
      status: "Pending",
      enrolledBy: userId,
    });

    // Confirmar automáticamente la inscripción
    await enrollment.confirm();

    // Enviar notificación (asíncrono)
    const user = {
      id: userId,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
    };
    sendEnrollmentNotification(user, course, enrollment);

    res.status(201).json({
      success: true,
      message: "Inscripción realizada exitosamente",
      data: {
        enrollment: enrollment.toPublicJSON(),
        course: {
          id: course.id,
          code: course.code,
          name: course.name,
          availableSlots: reservationResult.data.availableSlots,
        },
        validations: {
          passed: validationContext.getStrategies().map((s) => s.getName()),
          strategy: "Strategy Pattern Implementation",
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Si falla la creación de la inscripción, liberar el cupo
    console.error("Error creando inscripción, liberando cupo:", error);
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
    order: [["enrollmentDate", "DESC"]],
  });

  res.status(200).json({
    success: true,
    data: {
      enrollments: enrollments.map((e) => e.toPublicJSON()),
      summary: {
        total: enrollments.length,
        byStatus: {
          pending: enrollments.filter((e) => e.status === "Pending").length,
          confirmed: enrollments.filter((e) => e.status === "Confirmed").length,
          paid: enrollments.filter((e) => e.status === "Paid").length,
          completed: enrollments.filter((e) => e.status === "Completed").length,
          cancelled: enrollments.filter((e) => e.status === "Cancelled").length,
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
      message: "Curso no encontrado",
      timestamp: new Date().toISOString(),
    });
  }

  const enrollments = await Enrollment.findByCourse(courseId);

  res.status(200).json({
    success: true,
    data: {
      course: courseResult.data,
      enrollments: enrollments.map((e) => e.toPublicJSON()),
      summary: {
        totalEnrolled: enrollments.length,
        byStatus: {
          confirmed: enrollments.filter((e) => e.status === "Confirmed").length,
          paid: enrollments.filter((e) => e.status === "Paid").length,
          completed: enrollments.filter((e) => e.status === "Completed").length,
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
      message: "Inscripción no encontrada",
      timestamp: new Date().toISOString(),
    });
  }

  // Verificar permisos: solo el propietario o un admin puede ver la inscripción
  if (enrollment.userId !== userId && userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "No tienes permisos para ver esta inscripción",
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
      message: "Inscripción no encontrada",
      timestamp: new Date().toISOString(),
    });
  }

  // Verificar permisos
  if (enrollment.userId !== userId && userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "No tienes permisos para cancelar esta inscripción",
      timestamp: new Date().toISOString(),
    });
  }

  // Verificar que se puede cancelar
  if (!enrollment.canBeCancelled()) {
    return res.status(400).json({
      success: false,
      message: "Esta inscripción no puede ser cancelada",
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
    console.warn("No se pudo liberar cupo en el curso:", releaseResult.error);
  }

  // Cancelar inscripción
  await enrollment.cancel(reason, userId);

  res.status(200).json({
    success: true,
    message: "Inscripción cancelada exitosamente",
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
      message: "Inscripción no encontrada",
      timestamp: new Date().toISOString(),
    });
  }

  // Verificar permisos
  if (enrollment.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: "No tienes permisos para procesar el pago de esta inscripción",
      timestamp: new Date().toISOString(),
    });
  }

  // Verificar que requiere pago
  if (!enrollment.requiresPayment()) {
    return res.status(400).json({
      success: false,
      message: "Esta inscripción no requiere pago",
      paymentStatus: enrollment.paymentStatus,
      timestamp: new Date().toISOString(),
    });
  }

  // Verificar monto
  if (amount && parseFloat(amount) !== parseFloat(enrollment.amount)) {
    return res.status(400).json({
      success: false,
      message: "El monto del pago no coincide con el monto de la inscripción",
      expected: enrollment.amount,
      received: amount,
      timestamp: new Date().toISOString(),
    });
  }

  // Marcar como pagada
  await enrollment.markAsPaid(paymentId);

  res.status(200).json({
    success: true,
    message: "Pago procesado exitosamente",
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
      "status",
      [
        Enrollment.sequelize.fn("COUNT", Enrollment.sequelize.col("status")),
        "count",
      ],
    ],
    where: semester ? { courseSemester: semester } : {},
    group: ["status"],
    raw: true,
  });

  const enrollmentsBySemester = await Enrollment.findAll({
    attributes: [
      "courseSemester",
      [
        Enrollment.sequelize.fn(
          "COUNT",
          Enrollment.sequelize.col("courseSemester")
        ),
        "count",
      ],
    ],
    group: ["courseSemester"],
    order: [["courseSemester", "DESC"]],
    raw: true,
  });

  res.status(200).json({
    success: true,
    data: {
      total: totalEnrollments,
      byStatus: enrollmentsByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      bySemester: enrollmentsBySemester.map((item) => ({
        semester: item.courseSemester,
        count: parseInt(item.count),
      })),
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = {
  enrollStudent,
  getStudentEnrollments,
  getCourseEnrollments,
  getEnrollmentById,
  cancelEnrollment,
  processPayment,
  getEnrollmentStats,
};
