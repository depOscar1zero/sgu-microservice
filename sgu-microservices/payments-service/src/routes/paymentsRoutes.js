const express = require("express");
const { body, query, param } = require("express-validator");
const router = express.Router();

const {
  createPayment,
  getPaymentById,
  getPaymentsByEnrollment,
  getUserPayments,
  processRefund,
  getPaymentStats,
  createPaymentIntent,
  authenticateToken,
} = require("../controllers/paymentsController");

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

/**
 * POST /api/payments
 * Crear un nuevo pago
 */
router.post(
  "/",
  [
    body("enrollmentId").isUUID().withMessage("ID de inscripción inválido"),
    body("amount")
      .isFloat({ min: 0.01 })
      .withMessage("Monto debe ser mayor a 0"),
    body("paymentMethod")
      .isIn(["credit_card", "debit_card", "bank_transfer", "cash", "stripe"])
      .withMessage("Método de pago inválido"),
    body("paymentMethodDetails")
      .optional()
      .isObject()
      .withMessage("Detalles del método de pago deben ser un objeto"),
  ],
  createPayment
);

/**
 * POST /api/payments/intent
 * Crear Payment Intent para Stripe
 */
router.post(
  "/intent",
  [
    body("enrollmentId").isUUID().withMessage("ID de inscripción inválido"),
    body("amount")
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage("Monto debe ser mayor a 0"),
  ],
  createPaymentIntent
);

/**
 * GET /api/payments
 * Obtener pagos del usuario autenticado
 */
router.get(
  "/",
  [
    query("status")
      .optional()
      .isIn([
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ])
      .withMessage("Estado de pago inválido"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Límite debe ser entre 1 y 100"),
    query("offset")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Offset debe ser mayor o igual a 0"),
  ],
  getUserPayments
);

/**
 * GET /api/payments/stats
 * Obtener estadísticas de pagos (solo admins)
 */
router.get(
  "/stats",
  [
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Fecha de inicio inválida"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("Fecha de fin inválida"),
  ],
  getPaymentStats
);

/**
 * GET /api/payments/:id
 * Obtener pago por ID
 */
router.get(
  "/:id",
  [param("id").isUUID().withMessage("ID de pago inválido")],
  getPaymentById
);

/**
 * GET /api/payments/enrollment/:enrollmentId
 * Obtener pagos por inscripción
 */
router.get(
  "/enrollment/:enrollmentId",
  [param("enrollmentId").isUUID().withMessage("ID de inscripción inválido")],
  getPaymentsByEnrollment
);

/**
 * POST /api/payments/:id/refund
 * Procesar reembolso de un pago
 */
router.post(
  "/:id/refund",
  [
    param("id").isUUID().withMessage("ID de pago inválido"),
    body("amount")
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage("Monto de reembolso debe ser mayor a 0"),
    body("reason")
      .optional()
      .isString()
      .isLength({ min: 1, max: 500 })
      .withMessage("Razón del reembolso debe tener entre 1 y 500 caracteres"),
  ],
  processRefund
);

/**
 * GET /api/payments/health
 * Health check del servicio
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Payments Service is healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

module.exports = router;
