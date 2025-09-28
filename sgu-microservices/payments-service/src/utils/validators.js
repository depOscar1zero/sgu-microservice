const { body, param, query, validationResult } = require("express-validator");

/**
 * Validadores para el Payments Service
 */

// Validadores para crear pago
const createPaymentValidators = [
  body("enrollmentId")
    .isUUID()
    .withMessage("ID de inscripción debe ser un UUID válido"),

  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Monto debe ser un número mayor a 0"),

  body("paymentMethod")
    .isIn(["credit_card", "debit_card", "bank_transfer", "cash", "stripe"])
    .withMessage("Método de pago inválido"),

  body("paymentMethodDetails")
    .optional()
    .isObject()
    .withMessage("Detalles del método de pago deben ser un objeto"),

  body("currency")
    .optional()
    .isIn(["USD", "MXN", "EUR"])
    .withMessage("Moneda inválida"),
];

// Validadores para Payment Intent
const createPaymentIntentValidators = [
  body("enrollmentId")
    .isUUID()
    .withMessage("ID de inscripción debe ser un UUID válido"),

  body("amount")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Monto debe ser un número mayor a 0"),
];

// Validadores para reembolso
const refundValidators = [
  param("id").isUUID().withMessage("ID de pago debe ser un UUID válido"),

  body("amount")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Monto de reembolso debe ser mayor a 0"),

  body("reason")
    .optional()
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage("Razón del reembolso debe tener entre 1 y 500 caracteres"),
];

// Validadores para consultas
const getPaymentsValidators = [
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
];

// Validadores para estadísticas
const statsValidators = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Fecha de inicio debe ser una fecha válida"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("Fecha de fin debe ser una fecha válida"),
];

// Validadores para parámetros de ruta
const paymentIdValidator = [
  param("id").isUUID().withMessage("ID de pago debe ser un UUID válido"),
];

const enrollmentIdValidator = [
  param("enrollmentId")
    .isUUID()
    .withMessage("ID de inscripción debe ser un UUID válido"),
];

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Datos de entrada inválidos",
      details: errors.array(),
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

/**
 * Validadores personalizados
 */
const customValidators = {
  // Validar monto de pago
  validatePaymentAmount: (amount, maxAmount = 10000, minAmount = 0.01) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      throw new Error("Monto debe ser un número válido");
    }
    if (numAmount < minAmount) {
      throw new Error(`Monto debe ser al menos $${minAmount}`);
    }
    if (numAmount > maxAmount) {
      throw new Error(`Monto no puede exceder $${maxAmount}`);
    }
    return true;
  },

  // Validar método de pago
  validatePaymentMethod: (method) => {
    const validMethods = [
      "credit_card",
      "debit_card",
      "bank_transfer",
      "cash",
      "stripe",
    ];
    if (!validMethods.includes(method)) {
      throw new Error("Método de pago inválido");
    }
    return true;
  },

  // Validar moneda
  validateCurrency: (currency) => {
    const validCurrencies = ["USD", "MXN", "EUR"];
    if (!validCurrencies.includes(currency)) {
      throw new Error("Moneda inválida");
    }
    return true;
  },

  // Validar estado de pago
  validatePaymentStatus: (status) => {
    const validStatuses = [
      "pending",
      "processing",
      "completed",
      "failed",
      "cancelled",
      "refunded",
    ];
    if (!validStatuses.includes(status)) {
      throw new Error("Estado de pago inválido");
    }
    return true;
  },

  // Validar detalles de tarjeta de crédito
  validateCardDetails: (cardDetails) => {
    if (!cardDetails || typeof cardDetails !== "object") {
      throw new Error("Detalles de tarjeta requeridos");
    }

    const { number, expMonth, expYear, cvc } = cardDetails;

    if (!number || !/^\d{13,19}$/.test(number.replace(/\s/g, ""))) {
      throw new Error("Número de tarjeta inválido");
    }

    if (!expMonth || expMonth < 1 || expMonth > 12) {
      throw new Error("Mes de expiración inválido");
    }

    if (!expYear || expYear < new Date().getFullYear()) {
      throw new Error("Año de expiración inválido");
    }

    if (!cvc || !/^\d{3,4}$/.test(cvc)) {
      throw new Error("CVC inválido");
    }

    return true;
  },

  // Validar datos de Stripe
  validateStripeData: (stripeData) => {
    if (!stripeData || typeof stripeData !== "object") {
      throw new Error("Datos de Stripe requeridos");
    }

    const { paymentMethodId, paymentIntentId } = stripeData;

    if (!paymentMethodId && !paymentIntentId) {
      throw new Error("ID de método de pago o Payment Intent requerido");
    }

    return true;
  },
};

/**
 * Sanitizadores
 */
const sanitizers = {
  // Sanitizar monto
  sanitizeAmount: (amount) => {
    return parseFloat(amount).toFixed(2);
  },

  // Sanitizar datos de tarjeta
  sanitizeCardData: (cardData) => {
    const sanitized = { ...cardData };
    if (sanitized.number) {
      sanitized.number = sanitized.number.replace(/\s/g, "");
    }
    return sanitized;
  },

  // Sanitizar datos de usuario
  sanitizeUserData: (userData) => {
    const sanitized = { ...userData };
    if (sanitized.email) {
      sanitized.email = sanitized.email.toLowerCase().trim();
    }
    if (sanitized.name) {
      sanitized.name = sanitized.name.trim();
    }
    return sanitized;
  },
};

module.exports = {
  createPaymentValidators,
  createPaymentIntentValidators,
  refundValidators,
  getPaymentsValidators,
  statsValidators,
  paymentIdValidator,
  enrollmentIdValidator,
  handleValidationErrors,
  customValidators,
  sanitizers,
};
