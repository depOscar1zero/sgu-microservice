const mongoose = require("mongoose");

/**
 * Modelo de Notificación para MongoDB
 * Representa las notificaciones enviadas a los usuarios
 */
const notificationSchema = new mongoose.Schema(
  {
    // Información del destinatario
    recipient: {
      userId: {
        type: String,
        required: true,
        index: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      name: {
        type: String,
        required: true,
      },
    },

    // Contenido de la notificación
    subject: {
      type: String,
      required: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    // Tipo y canal de notificación
    type: {
      type: String,
      enum: ["email", "sms", "push", "system"],
      required: true,
      default: "email",
    },

    channel: {
      type: String,
      enum: ["email", "sms", "push", "in_app"],
      required: true,
      default: "email",
    },

    // Estado de la notificación
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed", "cancelled"],
      required: true,
      default: "pending",
    },

    // Prioridad
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      required: true,
      default: "normal",
    },

    // Categoría de la notificación
    category: {
      type: String,
      enum: [
        "enrollment",
        "payment",
        "course",
        "system",
        "reminder",
        "alert",
        "welcome",
        "password_reset",
      ],
      required: true,
    },

    // Metadatos adicionales
    metadata: {
      courseId: String,
      enrollmentId: String,
      paymentId: String,
      templateId: String,
      variables: mongoose.Schema.Types.Mixed,
    },

    // Información de entrega
    delivery: {
      sentAt: Date,
      deliveredAt: Date,
      failedAt: Date,
      retryCount: {
        type: Number,
        default: 0,
        max: 3,
      },
      errorMessage: String,
      provider: String, // gmail, twilio, firebase, etc.
    },

    // Configuración de la notificación
    settings: {
      isHtml: {
        type: Boolean,
        default: true,
      },
      attachments: [String],
      replyTo: String,
      tags: [String],
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

// Índices para optimizar consultas
notificationSchema.index({ "recipient.userId": 1, createdAt: -1 });
notificationSchema.index({ status: 1, createdAt: -1 });
notificationSchema.index({ category: 1, status: 1 });
notificationSchema.index({ "delivery.sentAt": -1 });

// Métodos del modelo
notificationSchema.methods.markAsSent = function (provider = null) {
  this.status = "sent";
  this.delivery.sentAt = new Date();
  if (provider) {
    this.delivery.provider = provider;
  }
  return this.save();
};

notificationSchema.methods.markAsDelivered = function () {
  this.status = "delivered";
  this.delivery.deliveredAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsFailed = function (errorMessage) {
  this.status = "failed";
  this.delivery.failedAt = new Date();
  this.delivery.errorMessage = errorMessage;
  this.delivery.retryCount += 1;
  return this.save();
};

notificationSchema.methods.incrementRetry = function () {
  this.delivery.retryCount += 1;
  return this.save();
};

// Métodos estáticos
notificationSchema.statics.findByUser = function (userId, limit = 50) {
  return this.find({ "recipient.userId": userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

notificationSchema.statics.findPending = function () {
  return this.find({ status: "pending" }).sort({ priority: -1, createdAt: 1 });
};

notificationSchema.statics.findFailed = function () {
  return this.find({
    status: "failed",
    "delivery.retryCount": { $lt: 3 },
  }).sort({ createdAt: 1 });
};

// Virtual para obtener el tiempo de entrega
notificationSchema.virtual("deliveryTime").get(function () {
  if (this.delivery.sentAt && this.delivery.deliveredAt) {
    return this.delivery.deliveredAt - this.delivery.sentAt;
  }
  return null;
});

// Virtual para verificar si puede reintentar
notificationSchema.virtual("canRetry").get(function () {
  return this.status === "failed" && this.delivery.retryCount < 3;
});

module.exports = mongoose.model("Notification", notificationSchema);
