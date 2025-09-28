const Joi = require("joi");
const logger = require("../utils/logger");

class ValidationMiddleware {
  // Validación para crear notificación
  validateNotification(req, res, next) {
    const schema = Joi.object({
      userId: Joi.string().required().messages({
        "string.empty": "El ID del usuario es requerido",
        "any.required": "El ID del usuario es requerido",
      }),
      type: Joi.string()
        .valid("email", "sms", "push", "in_app")
        .required()
        .messages({
          "any.only": "El tipo debe ser email, sms, push o in_app",
          "any.required": "El tipo es requerido",
        }),
      subject: Joi.string().required().max(200).messages({
        "string.empty": "El asunto es requerido",
        "string.max": "El asunto no puede exceder 200 caracteres",
        "any.required": "El asunto es requerido",
      }),
      message: Joi.string().required().max(1000).messages({
        "string.empty": "El mensaje es requerido",
        "string.max": "El mensaje no puede exceder 1000 caracteres",
        "any.required": "El mensaje es requerido",
      }),
      recipient: Joi.object({
        email: Joi.string().email().when("$type", {
          is: "email",
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        phone: Joi.string().when("$type", {
          is: "sms",
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        deviceToken: Joi.string().when("$type", {
          is: "push",
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        name: Joi.string().optional(),
      }).required(),
      templateId: Joi.string().optional(),
      priority: Joi.string()
        .valid("low", "normal", "high", "urgent")
        .default("normal"),
      scheduledAt: Joi.date().greater("now").optional(),
      metadata: Joi.object().default({}),
      tags: Joi.array().items(Joi.string()).default([]),
    });

    const { error, value } = schema.validate(req.body, {
      context: { type: req.body.type },
    });

    if (error) {
      logger.warn("Notification validation failed", {
        error: error.details[0].message,
        body: req.body,
      });
      return res.status(400).json({
        success: false,
        message: "Datos de validación inválidos",
        error: error.details[0].message,
      });
    }

    req.body = value;
    next();
  }

  // Validación para notificación inmediata
  validateImmediateNotification(req, res, next) {
    const schema = Joi.object({
      userId: Joi.string().required(),
      type: Joi.string().valid("email", "sms", "push").required(),
      subject: Joi.string().required().max(200),
      message: Joi.string().required().max(1000),
      recipient: Joi.object({
        email: Joi.string().email().when("$type", {
          is: "email",
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        phone: Joi.string().when("$type", {
          is: "sms",
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        deviceToken: Joi.string().when("$type", {
          is: "push",
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        name: Joi.string().optional(),
      }).required(),
      priority: Joi.string()
        .valid("low", "normal", "high", "urgent")
        .default("normal"),
    });

    const { error, value } = schema.validate(req.body, {
      context: { type: req.body.type },
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos de validación inválidos",
        error: error.details[0].message,
      });
    }

    req.body = value;
    next();
  }

  // Validación para crear template
  validateTemplate(req, res, next) {
    const schema = Joi.object({
      name: Joi.string().required().max(100).messages({
        "string.empty": "El nombre es requerido",
        "string.max": "El nombre no puede exceder 100 caracteres",
        "any.required": "El nombre es requerido",
      }),
      description: Joi.string().max(500).optional(),
      type: Joi.string().valid("email", "sms", "push", "in_app").required(),
      category: Joi.string()
        .valid(
          "enrollment",
          "payment",
          "course",
          "system",
          "reminder",
          "alert",
          "welcome",
          "password_reset"
        )
        .required(),
      subject: Joi.string().required().max(200),
      content: Joi.string().required().max(2000),
      htmlContent: Joi.string().max(5000).optional(),
      variables: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required(),
            description: Joi.string().optional(),
            required: Joi.boolean().default(false),
            defaultValue: Joi.string().optional(),
          })
        )
        .default([]),
      settings: Joi.object({
        priority: Joi.string()
          .valid("low", "normal", "high", "urgent")
          .default("normal"),
        maxAttempts: Joi.number().min(1).max(10).default(3),
        retryDelay: Joi.number().min(1000).max(3600000).default(300000),
        expiresIn: Joi.number().min(60000).max(2592000000).default(604800000),
      }).default({}),
      tags: Joi.array().items(Joi.string()).default([]),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      logger.warn("Template validation failed", {
        error: error.details[0].message,
        body: req.body,
      });
      return res.status(400).json({
        success: false,
        message: "Datos de validación inválidos",
        error: error.details[0].message,
      });
    }

    req.body = value;
    next();
  }

  // Validación para renderizar template
  validateRenderTemplate(req, res, next) {
    const schema = Joi.object({
      variables: Joi.object().default({}),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos de validación inválidos",
        error: error.details[0].message,
      });
    }

    req.body = value;
    next();
  }

  // Validación para duplicar template
  validateDuplicateTemplate(req, res, next) {
    const schema = Joi.object({
      newName: Joi.string().required().max(100).messages({
        "string.empty": "El nuevo nombre es requerido",
        "string.max": "El nuevo nombre no puede exceder 100 caracteres",
        "any.required": "El nuevo nombre es requerido",
      }),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos de validación inválidos",
        error: error.details[0].message,
      });
    }

    req.body = value;
    next();
  }

  // Validación para parámetros de consulta
  validateQueryParams(req, res, next) {
    const schema = Joi.object({
      status: Joi.string()
        .valid("pending", "sent", "delivered", "failed", "cancelled")
        .optional(),
      type: Joi.string().valid("email", "sms", "push", "in_app").optional(),
      category: Joi.string().optional(),
      isActive: Joi.boolean().optional(),
      limit: Joi.number().min(1).max(100).default(50),
      skip: Joi.number().min(0).default(0),
    });

    const { error, value } = schema.validate(req.query);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Parámetros de consulta inválidos",
        error: error.details[0].message,
      });
    }

    req.query = value;
    next();
  }
}

module.exports = new ValidationMiddleware();
