const mongoose = require("mongoose");
const { Schema } = mongoose;

const templateSchema = new Schema(
  {
    // Información básica
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: String,
    type: {
      type: String,
      required: true,
      enum: ["email", "sms", "push", "in_app"],
      index: true,
    },
    category: {
      type: String,
      required: true,
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
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Contenido del template
    subject: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    htmlContent: String,

    // Variables del template
    variables: [
      {
        name: String,
        description: String,
        required: Boolean,
        defaultValue: String,
      },
    ],

    // Configuración
    settings: {
      priority: {
        type: String,
        enum: ["low", "normal", "high", "urgent"],
        default: "normal",
      },
      maxAttempts: {
        type: Number,
        default: 3,
      },
      retryDelay: {
        type: Number,
        default: 300000, // 5 minutos en ms
      },
      expiresIn: {
        type: Number,
        default: 604800000, // 7 días en ms
      },
    },

    // Metadatos
    tags: [String],
    version: {
      type: Number,
      default: 1,
    },
    createdBy: String,
    lastModifiedBy: String,
  },
  {
    timestamps: true,
    collection: "notification_templates",
  }
);

// Índices
templateSchema.index({ name: 1, type: 1 });
templateSchema.index({ category: 1, isActive: 1 });
templateSchema.index({ tags: 1 });

// Métodos de instancia
templateSchema.methods.render = function (variables = {}) {
  let subject = this.subject;
  let content = this.content;
  let htmlContent = this.htmlContent;

  // Reemplazar variables en el template
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    subject = subject.replace(regex, variables[key] || "");
    content = content.replace(regex, variables[key] || "");
    if (htmlContent) {
      htmlContent = htmlContent.replace(regex, variables[key] || "");
    }
  });

  return {
    subject,
    content,
    htmlContent,
  };
};

templateSchema.methods.validateVariables = function (variables) {
  const requiredVars = this.variables.filter((v) => v.required);
  const missingVars = requiredVars.filter((v) => !(v.name in variables));

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required variables: ${missingVars.map((v) => v.name).join(", ")}`
    );
  }

  return true;
};

templateSchema.methods.getDefaultVariables = function () {
  const defaults = {};
  this.variables.forEach((variable) => {
    if (variable.defaultValue) {
      defaults[variable.name] = variable.defaultValue;
    }
  });
  return defaults;
};

// Métodos estáticos
templateSchema.statics.findByCategory = function (category, isActive = true) {
  return this.find({ category, isActive }).sort({ name: 1 });
};

templateSchema.statics.findByType = function (type, isActive = true) {
  return this.find({ type, isActive }).sort({ name: 1 });
};

templateSchema.statics.findByName = function (name) {
  return this.findOne({ name, isActive: true });
};

// Middleware
templateSchema.pre("save", function (next) {
  if (this.isModified("content") || this.isModified("subject")) {
    this.version += 1;
  }
  next();
});

module.exports = mongoose.model("NotificationTemplate", templateSchema);
