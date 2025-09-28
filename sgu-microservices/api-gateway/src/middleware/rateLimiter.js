const rateLimit = require('express-rate-limit');

/**
 * Rate limiter general
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // máximo 100 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true, // Retornar info del rate limit en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilitar headers `X-RateLimit-*`
});

/**
 * Rate limiter estricto para autenticación
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máximo 20 intentos de login por IP cada 15 minutos
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos',
    timestamp: new Date().toISOString()
  },
  skipSuccessfulRequests: true, // No contar requests exitosos
});

/**
 * Rate limiter muy estricto para registro
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // máximo 5 registros por IP cada hora
  message: {
    success: false,
    message: 'Demasiados registros desde esta IP, intenta de nuevo en 1 hora',
    timestamp: new Date().toISOString()
  }
});

/**
 * Rate limiter para operaciones de escritura
 */
const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 50, // máximo 50 operaciones de escritura cada 10 minutos
  message: {
    success: false,
    message: 'Demasiadas operaciones de escritura, intenta de nuevo en 10 minutos',
    timestamp: new Date().toISOString()
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  registerLimiter,
  writeLimiter
};