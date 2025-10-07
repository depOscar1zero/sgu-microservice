const Payment = require("../models/Payment");
const StripeService = require("../services/stripeService");
const {
  AuthServiceClient,
  EnrollmentServiceClient,
  NotificationHelper,
} = require("../services/externalServices");
const { validationResult } = require("express-validator");
const axios = require("axios");

/**
 * Wrapper para manejo de errores async
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Función para enviar notificación de pago
 */
const sendPaymentNotification = async (
  user,
  payment,
  type = "confirmation"
) => {
  try {
    const notificationsUrl =
      process.env.NOTIFICATIONS_SERVICE_URL || "http://localhost:3005";

    let subject, message, priority, category;

    if (type === "confirmation") {
      subject = "Confirmación de Pago Exitoso";
      message = `
        <h2>¡Pago Confirmado!</h2>
        <p>Hola <strong>${user.firstName}</strong>,</p>
        <p>Tu pago ha sido procesado exitosamente.</p>
        <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #0ea5e9;">
          <h3>Detalles del Pago:</h3>
          <p><strong>Monto:</strong> $${payment.amount}</p>
          <p><strong>Método:</strong> ${payment.paymentMethod}</p>
          <p><strong>Referencia:</strong> ${payment.stripePaymentIntentId}</p>
          <p><strong>Fecha:</strong> ${new Date(
            payment.createdAt
          ).toLocaleDateString()}</p>
        </div>
        <p>Gracias por tu pago. Tu inscripción está ahora completamente confirmada.</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un email automático del Sistema de Gestión Universitaria.
        </p>
      `;
      priority = "normal";
      category = "payment";
    } else if (type === "reminder") {
      subject = "Recordatorio de Pago Pendiente";
      message = `
        <h2>Recordatorio de Pago</h2>
        <p>Hola <strong>${user.firstName}</strong>,</p>
        <p>Tienes un pago pendiente que requiere tu atención.</p>
        <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc2626;">
          <h3>Detalles del Pago:</h3>
          <p><strong>Monto:</strong> $${payment.amount}</p>
          <p><strong>Descripción:</strong> ${payment.description}</p>
          <p><strong>Fecha de Vencimiento:</strong> ${new Date(
            payment.dueDate
          ).toLocaleDateString()}</p>
        </div>
        <p>Por favor, realiza el pago antes de la fecha de vencimiento para evitar inconvenientes.</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un email automático del Sistema de Gestión Universitaria.
        </p>
      `;
      priority = "urgent";
      category = "payment";
    }

    const notificationData = {
      recipient: {
        userId: user.id.toString(),
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
      subject,
      message,
      type: "email",
      channel: "email",
      priority,
      category,
      metadata: {
        paymentId: payment.id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        dueDate: payment.dueDate,
        description: payment.description,
      },
    };

    await axios.post(
      `${notificationsUrl}/api/notifications/`,
      notificationData
    );
    console.log(`✅ Notificación de pago enviada a ${user.email}`);
  } catch (error) {
    console.error("❌ Error enviando notificación de pago:", error.message);
    // No lanzar error para no interrumpir el proceso de pago
  }
};

/**
 * Middleware para verificar autenticación
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Token de acceso requerido",
      });
    }

    // Verificar token con el servicio de autenticación
    const authClient = new AuthServiceClient();
    const authResult = await authClient.verifyToken(token);
    if (!authResult.success) {
      return res.status(401).json({
        success: false,
        error: authResult.error,
      });
    }

    req.user = authResult.data;
    req.token = token;
    next();
  } catch (error) {
    console.error("Error en autenticación:", error);
    res.status(401).json({
      success: false,
      error: "Error verificando autenticación",
    });
  }
};

/**
 * Crear un nuevo pago
 */
const createPayment = catchAsync(async (req, res) => {
  const { enrollmentId, amount, paymentMethod, paymentMethodDetails } =
    req.body;
  const userId = req.user.id;

  // Validar datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Datos de entrada inválidos",
      details: errors.array(),
    });
  }

  // Verificar que la inscripción existe y requiere pago
  const enrollmentCheck = await EnrollmentServiceClient.checkPaymentRequired(
    enrollmentId,
    req.token
  );
  if (!enrollmentCheck.success) {
    return res.status(400).json({
      success: false,
      error: enrollmentCheck.error,
    });
  }

  const enrollment = enrollmentCheck.data;
  if (!enrollment.requiresPayment) {
    return res.status(400).json({
      success: false,
      error: "La inscripción no requiere pago o ya ha sido pagada",
    });
  }

  if (!enrollment.canProcessPayment) {
    return res.status(400).json({
      success: false,
      error:
        "No se puede procesar el pago para esta inscripción en su estado actual",
    });
  }

  // Verificar que el monto coincida
  if (parseFloat(amount) !== parseFloat(enrollment.amount)) {
    return res.status(400).json({
      success: false,
      error: "El monto del pago no coincide con el monto de la inscripción",
      expected: enrollment.amount,
      received: amount,
    });
  }

  try {
    // Crear el registro de pago
    const payment = await Payment.create({
      enrollmentId,
      userId,
      amount,
      currency: enrollment.currency || "USD",
      paymentMethod,
      paymentMethodDetails,
      clientIp: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: {
        enrollmentCode: enrollment.courseCode,
        courseName: enrollment.courseName,
        studentName: enrollment.studentName,
        studentEmail: enrollment.studentEmail,
      },
    });

    // Procesar el pago según el método
    let paymentResult;
    if (paymentMethod === "stripe") {
      paymentResult = await processStripePayment(payment, paymentMethodDetails);
    } else {
      // Para otros métodos, simular procesamiento exitoso
      paymentResult = { success: true, data: { status: "completed" } };
    }

    if (paymentResult.success) {
      // Marcar pago como completado
      await payment.markAsCompleted(paymentResult.data);

      // Actualizar estado de la inscripción
      await EnrollmentServiceClient.updatePaymentStatus(
        enrollmentId,
        {
          paymentId: payment.id,
          paymentStatus: "Paid",
          paymentMethod: paymentMethod,
          paidAt: new Date(),
        },
        req.token
      );

      // Enviar notificación de éxito
      await NotificationHelper.sendPaymentSuccessNotification(userId, {
        amount: payment.amount,
        currency: payment.currency,
        enrollmentId: payment.enrollmentId,
        paymentId: payment.id,
      });

      res.status(201).json({
        success: true,
        message: "Pago procesado exitosamente",
        data: {
          payment: payment.toPublicJSON(),
          enrollment: {
            id: enrollment.id,
            status: "Paid",
            paymentStatus: "Paid",
          },
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      // Marcar pago como fallido
      await payment.markAsFailed(paymentResult.error);

      // Enviar notificación de fallo
      await NotificationHelper.sendPaymentFailureNotification(
        userId,
        {
          amount: payment.amount,
          currency: payment.currency,
          enrollmentId: payment.enrollmentId,
          paymentId: payment.id,
        },
        paymentResult.error
      );

      res.status(400).json({
        success: false,
        error: paymentResult.error,
        data: {
          payment: payment.toPublicJSON(),
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error procesando pago:", error);
    res.status(500).json({
      success: false,
      error: "Error interno procesando el pago",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Procesar pago con Stripe
 */
const processStripePayment = async (payment, paymentMethodDetails) => {
  try {
    // Crear Payment Intent
    const paymentIntentResult = await StripeService.createPaymentIntent(
      payment.amount,
      payment.currency,
      {
        enrollmentId: payment.enrollmentId,
        userId: payment.userId,
        paymentId: payment.id,
      }
    );

    if (!paymentIntentResult.success) {
      return {
        success: false,
        error: paymentIntentResult.error,
      };
    }

    const paymentIntent = paymentIntentResult.data;

    // Confirmar el pago
    const confirmResult = await StripeService.confirmPaymentIntent(
      paymentIntent.id,
      paymentMethodDetails.paymentMethodId
    );

    if (!confirmResult.success) {
      return {
        success: false,
        error: StripeService.formatStripeError(confirmResult.error),
      };
    }

    const confirmedPayment = confirmResult.data;
    const charge = confirmedPayment.charges[0];

    return {
      success: true,
      data: {
        paymentIntentId: paymentIntent.id,
        chargeId: charge.id,
        paymentMethodDetails: {
          type: charge.payment_method_details?.card?.brand || "card",
          last4: charge.payment_method_details?.card?.last4,
          expMonth: charge.payment_method_details?.card?.exp_month,
          expYear: charge.payment_method_details?.card?.exp_year,
        },
        processingFee: charge.balance_transaction?.fee
          ? charge.balance_transaction.fee / 100
          : 0,
        netAmount: charge.balance_transaction?.net
          ? charge.balance_transaction.net / 100
          : payment.amount,
      },
    };
  } catch (error) {
    console.error("Error procesando pago con Stripe:", error);
    return {
      success: false,
      error: "Error procesando pago con Stripe",
    };
  }
};

/**
 * Obtener pago por ID
 */
const getPaymentById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  const payment = await Payment.findByPk(id);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Pago no encontrado",
      timestamp: new Date().toISOString(),
    });
  }

  // Verificar permisos: solo el propietario o un admin puede ver el pago
  if (payment.userId !== userId && userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "No tienes permisos para ver este pago",
      timestamp: new Date().toISOString(),
    });
  }

  res.status(200).json({
    success: true,
    data: {
      payment: payment.toPublicJSON(),
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Obtener pagos por inscripción
 */
const getPaymentsByEnrollment = catchAsync(async (req, res) => {
  const { enrollmentId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Verificar que la inscripción pertenece al usuario (o es admin)
  if (userRole !== "admin") {
    const enrollmentCheck = await EnrollmentServiceClient.getEnrollmentById(
      enrollmentId,
      req.token
    );
    if (!enrollmentCheck.success || enrollmentCheck.data.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para ver los pagos de esta inscripción",
        timestamp: new Date().toISOString(),
      });
    }
  }

  const payments = await Payment.findByEnrollment(enrollmentId);

  res.status(200).json({
    success: true,
    data: {
      payments: payments.map((p) => p.toPublicJSON()),
      total: payments.length,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Obtener pagos del usuario
 */
const getUserPayments = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { status, limit = 20, offset = 0 } = req.query;

  const result = await Payment.findByUser(userId, {
    status,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.status(200).json({
    success: true,
    data: {
      payments: result.rows.map((p) => p.toPublicJSON()),
      pagination: {
        total: result.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.count > parseInt(offset) + parseInt(limit),
      },
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Procesar reembolso
 */
const processRefund = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  const payment = await Payment.findByPk(id);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Pago no encontrado",
      timestamp: new Date().toISOString(),
    });
  }

  // Verificar permisos
  if (payment.userId !== userId && userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "No tienes permisos para procesar reembolsos de este pago",
      timestamp: new Date().toISOString(),
    });
  }

  if (!payment.canBeRefunded()) {
    return res.status(400).json({
      success: false,
      message: "Este pago no puede ser reembolsado",
      currentStatus: payment.status,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Procesar reembolso con Stripe si aplica
    if (payment.stripeChargeId) {
      const refundResult = await StripeService.createRefund(
        payment.stripeChargeId,
        amount ? parseFloat(amount) : null,
        reason
      );

      if (!refundResult.success) {
        return res.status(400).json({
          success: false,
          error: refundResult.error,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Procesar reembolso en la base de datos
    await payment.processRefund(amount, reason);

    // Actualizar estado de la inscripción si es necesario
    if (userRole === "admin") {
      await EnrollmentServiceClient.updatePaymentStatus(
        payment.enrollmentId,
        {
          paymentStatus: "Refunded",
          refundedAt: new Date(),
          refundReason: reason,
        },
        req.token
      );
    }

    res.status(200).json({
      success: true,
      message: "Reembolso procesado exitosamente",
      data: {
        payment: payment.toPublicJSON(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error procesando reembolso:", error);
    res.status(500).json({
      success: false,
      error: "Error interno procesando el reembolso",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Obtener estadísticas de pagos
 */
const getPaymentStats = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const { startDate, endDate } = req.query;

  // Solo admins pueden ver estadísticas globales
  if (userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "No tienes permisos para ver estadísticas de pagos",
      timestamp: new Date().toISOString(),
    });
  }

  const stats = await Payment.getStats({
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    userId: userRole === "admin" ? null : userId,
  });

  res.status(200).json({
    success: true,
    data: {
      stats,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Crear Payment Intent para Stripe (para frontend)
 */
const createPaymentIntent = catchAsync(async (req, res) => {
  const { enrollmentId, amount } = req.body;
  const userId = req.user.id;

  // Verificar que la inscripción existe y requiere pago
  const enrollmentCheck = await EnrollmentServiceClient.checkPaymentRequired(
    enrollmentId,
    req.token
  );
  if (!enrollmentCheck.success) {
    return res.status(400).json({
      success: false,
      error: enrollmentCheck.error,
    });
  }

  const enrollment = enrollmentCheck.data;
  if (!enrollment.requiresPayment) {
    return res.status(400).json({
      success: false,
      error: "La inscripción no requiere pago",
    });
  }

  // Crear Payment Intent
  const paymentIntentResult = await StripeService.createPaymentIntent(
    amount || enrollment.amount,
    enrollment.currency || "USD",
    {
      enrollmentId,
      userId,
      courseCode: enrollment.courseCode,
      courseName: enrollment.courseName,
    }
  );

  if (!paymentIntentResult.success) {
    return res.status(400).json({
      success: false,
      error: paymentIntentResult.error,
    });
  }

  res.status(201).json({
    success: true,
    data: {
      clientSecret: paymentIntentResult.data.clientSecret,
      paymentIntentId: paymentIntentResult.data.id,
      amount: paymentIntentResult.data.amount,
      currency: paymentIntentResult.data.currency,
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = {
  createPayment,
  getPaymentById,
  getPaymentsByEnrollment,
  getUserPayments,
  processRefund,
  getPaymentStats,
  createPaymentIntent,
  authenticateToken,
};
