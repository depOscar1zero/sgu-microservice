const winston = require("winston");

// Configuración de formatos
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "HH:mm:ss",
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = "";
    if (Object.keys(meta).length > 0) {
      metaStr = `\n${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Configuración de transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || "info",
    format: consoleFormat,
  }),
];

// Agregar file transport en producción
if (process.env.NODE_ENV === "production") {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  transports,
  exitOnError: false,
});

// Métodos personalizados
logger.logNotification = (level, message, notificationData) => {
  logger.log(level, message, {
    service: "Notifications Service",
    notificationId: notificationData.id,
    userId: notificationData.userId,
    type: notificationData.type,
    status: notificationData.status,
  });
};

logger.logEmail = (level, message, emailData) => {
  logger.log(level, message, {
    service: "Email Service",
    to: emailData.to,
    subject: emailData.subject,
    messageId: emailData.messageId,
  });
};

logger.logSMS = (level, message, smsData) => {
  logger.log(level, message, {
    service: "SMS Service",
    to: smsData.to,
    messageSid: smsData.messageSid,
    status: smsData.status,
  });
};

logger.logPush = (level, message, pushData) => {
  logger.log(level, message, {
    service: "Push Service",
    token: pushData.token?.substring(0, 10) + "...", // Solo primeros 10 caracteres
    title: pushData.title,
    messageId: pushData.messageId,
  });
};

logger.logQueue = (level, message, queueData) => {
  logger.log(level, message, {
    service: "Queue Service",
    queueName: queueData.queueName,
    jobId: queueData.jobId,
    status: queueData.status,
  });
};

logger.logTemplate = (level, message, templateData) => {
  logger.log(level, message, {
    service: "Template Service",
    templateId: templateData.templateId,
    templateName: templateData.templateName,
    type: templateData.type,
    category: templateData.category,
  });
};

// Método para logging de errores con contexto
logger.logError = (error, context = {}) => {
  logger.error("Error occurred", {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    context,
    service: "Notifications Service",
    timestamp: new Date().toISOString(),
  });
};

// Método para logging de métricas
logger.logMetrics = (metrics) => {
  logger.info("Service metrics", {
    service: "Notifications Service",
    metrics,
    timestamp: new Date().toISOString(),
  });
};

// Método para logging de health checks
logger.logHealth = (status, details = {}) => {
  logger.info("Health check", {
    service: "Notifications Service",
    status,
    details,
    timestamp: new Date().toISOString(),
  });
};

module.exports = logger;
