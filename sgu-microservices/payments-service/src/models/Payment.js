const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modelo de Payment
 * Representa los pagos del sistema
 */
const Payment = sequelize.define(
  'Payment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // ID de la inscripción relacionada
    enrollmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'enrollment_id',
      validate: {
        notEmpty: true,
      },
    },

    // ID del usuario que realiza el pago
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      validate: {
        notEmpty: true,
      },
    },

    // Monto del pago
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        isDecimal: true,
      },
    },

    // Moneda del pago
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      validate: {
        isIn: [['USD', 'MXN', 'EUR']],
      },
    },

    // Método de pago
    paymentMethod: {
      type: DataTypes.ENUM(
        'credit_card',
        'debit_card',
        'bank_transfer',
        'cash',
        'stripe'
      ),
      allowNull: false,
      field: 'payment_method',
    },

    // Estado del pago
    status: {
      type: DataTypes.ENUM(
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'refunded'
      ),
      allowNull: false,
      defaultValue: 'pending',
    },

    // ID del Payment Intent de Stripe
    stripePaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'stripe_payment_intent_id',
    },

    // ID del Charge de Stripe
    stripeChargeId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'stripe_charge_id',
    },

    // Información del método de pago
    paymentMethodDetails: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'payment_method_details',
    },

    // Metadatos adicionales
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    // Información de procesamiento
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processed_at',
    },

    // Información de fallo
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'failure_reason',
    },

    // Información de reembolso
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'refunded_at',
    },

    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'refund_amount',
    },

    refundReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'refund_reason',
    },

    // Fee de procesamiento
    processingFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'processing_fee',
    },

    // Neto recibido
    netAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'net_amount',
    },

    // IP del cliente
    clientIp: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'client_ip',
    },

    // User Agent del cliente
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent',
    },
  },
  {
    tableName: 'payments',
    indexes: [
      {
        fields: ['enrollment_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['stripe_payment_intent_id'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

/**
 * Métodos de instancia
 */
Payment.prototype.toPublicJSON = function () {
  return {
    id: this.id,
    enrollmentId: this.enrollmentId,
    amount: parseFloat(this.amount),
    currency: this.currency,
    paymentMethod: this.paymentMethod,
    status: this.status,
    paymentMethodDetails: this.paymentMethodDetails,
    processedAt: this.processedAt,
    failureReason: this.failureReason,
    refundedAt: this.refundedAt,
    refundAmount: this.refundAmount ? parseFloat(this.refundAmount) : null,
    refundReason: this.refundReason,
    processingFee: this.processingFee ? parseFloat(this.processingFee) : null,
    netAmount: this.netAmount ? parseFloat(this.netAmount) : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

/**
 * Verificar si el pago puede ser procesado
 */
Payment.prototype.canBeProcessed = function () {
  return this.status === 'pending' || this.status === 'processing';
};

/**
 * Verificar si el pago puede ser reembolsado
 */
Payment.prototype.canBeRefunded = function () {
  return this.status === 'completed' && !this.refundedAt;
};

/**
 * Marcar pago como completado
 */
Payment.prototype.markAsCompleted = async function (stripeData = null) {
  this.status = 'completed';
  this.processedAt = new Date();

  if (stripeData) {
    this.stripePaymentIntentId = stripeData.paymentIntentId;
    this.stripeChargeId = stripeData.chargeId;
    this.paymentMethodDetails = stripeData.paymentMethodDetails;
    this.processingFee = stripeData.processingFee;
    this.netAmount = stripeData.netAmount;
  }

  await this.save();
  return this;
};

/**
 * Marcar pago como fallido
 */
Payment.prototype.markAsFailed = async function (reason) {
  this.status = 'failed';
  this.failureReason = reason;
  await this.save();
  return this;
};

/**
 * Procesar reembolso
 */
Payment.prototype.processRefund = async function (amount, reason) {
  if (!this.canBeRefunded()) {
    throw new Error('Este pago no puede ser reembolsado');
  }

  const refundAmount = amount || this.amount;
  this.refundedAt = new Date();
  this.refundAmount = refundAmount;
  this.refundReason = reason;
  this.status = 'refunded';

  await this.save();
  return this;
};

/**
 * Métodos estáticos
 */

/**
 * Buscar pagos por usuario
 */
Payment.findByUser = async function (userId, options = {}) {
  const { status, limit = 50, offset = 0 } = options;

  const whereClause = { userId };
  if (status) whereClause.status = status;

  return await this.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
};

/**
 * Buscar pagos por inscripción
 */
Payment.findByEnrollment = async function (enrollmentId) {
  return await this.findAll({
    where: { enrollmentId },
    order: [['createdAt', 'DESC']],
  });
};

/**
 * Obtener estadísticas de pagos
 */
Payment.getStats = async function (options = {}) {
  const { startDate, endDate, userId } = options;

  const whereClause = {};
  if (startDate && endDate) {
    whereClause.createdAt = {
      [sequelize.Op.between]: [startDate, endDate],
    };
  }
  if (userId) {
    whereClause.userId = userId;
  }

  const stats = await this.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
    ],
    where: whereClause,
    group: ['status'],
    raw: true,
  });

  const totalStats = await this.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalPayments'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      [sequelize.fn('AVG', sequelize.col('amount')), 'averageAmount'],
    ],
    where: whereClause,
    raw: true,
  });

  return {
    byStatus: stats.reduce((acc, stat) => {
      acc[stat.status] = {
        count: parseInt(stat.count),
        totalAmount: parseFloat(stat.totalAmount || 0),
      };
      return acc;
    }, {}),
    totals: totalStats[0]
      ? {
          totalPayments: parseInt(totalStats[0].totalPayments),
          totalAmount: parseFloat(totalStats[0].totalAmount || 0),
          averageAmount: parseFloat(totalStats[0].averageAmount || 0),
        }
      : {},
  };
};

module.exports = Payment;
