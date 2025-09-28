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
      filename: "logs/gateway-error.log",
      level: "error",
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/gateway-combined.log",
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
logger.logRequest = (level, message, requestData) => {
  logger.log(level, message, {
    service: "API Gateway",
    requestId: requestData.id,
    method: requestData.method,
    url: requestData.url,
    ip: requestData.ip,
    userAgent: requestData.userAgent,
  });
};

logger.logProxy = (level, message, proxyData) => {
  logger.log(level, message, {
    service: "Proxy Service",
    targetService: proxyData.service,
    targetUrl: proxyData.url,
    method: proxyData.method,
    statusCode: proxyData.statusCode,
    responseTime: proxyData.responseTime,
  });
};

logger.logAuth = (level, message, authData) => {
  logger.log(level, message, {
    service: "Auth Service",
    userId: authData.userId,
    action: authData.action,
    result: authData.result,
    ip: authData.ip,
  });
};

logger.logRateLimit = (level, message, rateLimitData) => {
  logger.log(level, message, {
    service: "Rate Limit",
    limiter: rateLimitData.limiter,
    key: rateLimitData.key,
    limit: rateLimitData.limit,
    remaining: rateLimitData.remaining,
    resetTime: rateLimitData.resetTime,
  });
};

logger.logCircuitBreaker = (level, message, circuitData) => {
  logger.log(level, message, {
    service: "Circuit Breaker",
    targetService: circuitData.service,
    state: circuitData.state,
    failures: circuitData.failures,
    threshold: circuitData.threshold,
  });
};

logger.logHealthCheck = (level, message, healthData) => {
  logger.log(level, message, {
    service: "Health Check",
    targetService: healthData.service,
    healthy: healthData.healthy,
    responseTime: healthData.responseTime,
    statusCode: healthData.statusCode,
  });
};

logger.logMetrics = (level, message, metricsData) => {
  logger.log(level, message, {
    service: "Metrics",
    metricName: metricsData.name,
    value: metricsData.value,
    labels: metricsData.labels,
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
    service: "API Gateway",
    timestamp: new Date().toISOString(),
  });
};

// Método para logging de métricas
logger.logMetrics = (metrics) => {
  logger.info("Gateway metrics", {
    service: "API Gateway",
    metrics,
    timestamp: new Date().toISOString(),
  });
};

// Método para logging de health checks
logger.logHealth = (status, details = {}) => {
  logger.info("Gateway health check", {
    service: "API Gateway",
    status,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Método para logging de rate limiting
logger.logRateLimit = (limiter, key, limit, remaining, resetTime) => {
  logger.warn("Rate limit hit", {
    service: "API Gateway",
    limiter,
    key,
    limit,
    remaining,
    resetTime,
    timestamp: new Date().toISOString(),
  });
};

// Método para logging de circuit breaker
logger.logCircuitBreaker = (service, state, failures, threshold) => {
  logger.warn("Circuit breaker state changed", {
    service: "API Gateway",
    targetService: service,
    state,
    failures,
    threshold,
    timestamp: new Date().toISOString(),
  });
};

module.exports = logger;
