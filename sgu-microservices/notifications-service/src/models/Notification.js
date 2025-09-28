const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    // Información básica
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["email", "sms", "push", "in_app"],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "sent", "delivered", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true,
    },

    // Contenido
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "NotificationTemplate",
      index: true,
    },

    // Destinatario
    recipient: {
      email: String,
      phone: String,
      deviceToken: String,
      name: String,
    },

    // Metadatos
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    tags: [String],

    // Programación
    scheduledAt: {
      type: Date,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },

    // Intentos y errores
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    lastAttemptAt: Date,
    errorMessage: String,
    errorCode: String,

    // Timestamps
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

// Índices compuestos
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ scheduledAt: 1, status: 1 });
notificationSchema.index({ createdAt: -1 });

// Métodos de instancia
notificationSchema.methods.markAsSent = function () {
  this.status = "sent";
  this.sentAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsDelivered = function () {
  this.status = "delivered";
  this.deliveredAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsFailed = function (errorMessage, errorCode) {
  this.status = "failed";
  this.errorMessage = errorMessage;
  this.errorCode = errorCode;
  this.lastAttemptAt = new Date();
  this.attempts += 1;
  return this.save();
};

notificationSchema.methods.markAsRead = function () {
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.canRetry = function () {
  return this.attempts < this.maxAttempts && this.status === "failed";
};

notificationSchema.methods.isExpired = function () {
  return this.expiresAt && new Date() > this.expiresAt;
};

notificationSchema.methods.isScheduled = function () {
  return this.scheduledAt && new Date() < this.scheduledAt;
};

// Métodos estáticos
notificationSchema.statics.findByUser = function (userId, options = {}) {
  const query = { userId };

  if (options.status) {
    query.status = options.status;
  }

  if (options.type) {
    query.type = options.type;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

notificationSchema.statics.findPending = function () {
  return this.find({
    status: "pending",
    $or: [
      { scheduledAt: { $exists: false } },
      { scheduledAt: { $lte: new Date() } },
    ],
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  });
};

notificationSchema.statics.getStats = function (userId = null) {
  const match = userId ? { userId } : {};

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
};

// Middleware
notificationSchema.pre("save", function (next) {
  if (this.isNew) {
    // Establecer fecha de expiración por defecto (7 días)
    if (!this.expiresAt) {
      this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
  }
  next();
});

module.exports = mongoose.model("Notification", notificationSchema);
