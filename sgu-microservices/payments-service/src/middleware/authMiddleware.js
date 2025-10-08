const jwt = require('jsonwebtoken');
const { AuthServiceClient } = require('../services/externalServices');

/**
 * Middleware para verificar autenticación
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acceso requerido',
        code: 'MISSING_TOKEN',
      });
    }

    // Verificar token con el servicio de autenticación
    const authResult = await AuthServiceClient.verifyToken(token);
    if (!authResult.success) {
      return res.status(401).json({
        success: false,
        error: authResult.error,
        code: 'INVALID_TOKEN',
      });
    }

    // Agregar información del usuario a la request
    req.user = authResult.data;
    req.token = token;
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(401).json({
      success: false,
      error: 'Error verificando autenticación',
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Middleware para verificar roles de administrador
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Se requieren permisos de administrador',
      code: 'INSUFFICIENT_PERMISSIONS',
    });
  }
  next();
};

/**
 * Middleware para verificar que el usuario es propietario del recurso
 */
const requireOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    const resourceUserId =
      req.params[resourceUserIdField] || req.body[resourceUserIdField];
    const currentUserId = req.user.id;

    if (resourceUserId !== currentUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a este recurso',
        code: 'ACCESS_DENIED',
      });
    }
    next();
  };
};

/**
 * Middleware para rate limiting básico
 */
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Limpiar requests antiguos
    if (requests.has(clientId)) {
      const clientRequests = requests.get(clientId);
      const validRequests = clientRequests.filter(time => time > windowStart);
      requests.set(clientId, validRequests);
    } else {
      requests.set(clientId, []);
    }

    const clientRequests = requests.get(clientId);

    if (clientRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Demasiadas peticiones, intenta más tarde',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    // Agregar esta request
    clientRequests.push(now);
    requests.set(clientId, clientRequests);

    next();
  };
};

/**
 * Middleware para validar entrada de pagos
 */
const validatePaymentInput = (req, res, next) => {
  const { amount, paymentMethod } = req.body;

  // Validar monto
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Monto inválido',
      code: 'INVALID_AMOUNT',
    });
  }

  // Validar método de pago
  const validPaymentMethods = [
    'credit_card',
    'debit_card',
    'bank_transfer',
    'cash',
    'stripe',
  ];
  if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      error: 'Método de pago inválido',
      code: 'INVALID_PAYMENT_METHOD',
    });
  }

  // Validar límites de pago
  const maxAmount = parseFloat(process.env.MAX_PAYMENT_AMOUNT) || 10000;
  const minAmount = parseFloat(process.env.MIN_PAYMENT_AMOUNT) || 0.01;

  if (parseFloat(amount) > maxAmount) {
    return res.status(400).json({
      success: false,
      error: `El monto excede el límite máximo de $${maxAmount}`,
      code: 'AMOUNT_EXCEEDED',
    });
  }

  if (parseFloat(amount) < minAmount) {
    return res.status(400).json({
      success: false,
      error: `El monto debe ser al menos $${minAmount}`,
      code: 'AMOUNT_TOO_LOW',
    });
  }

  next();
};

/**
 * Middleware para logging de pagos
 */
const logPaymentActivity = action => {
  return (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      // Log de la actividad de pago
      console.log(`💳 Payment Activity: ${action}`, {
        userId: req.user?.id,
        userEmail: req.user?.email,
        action,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: res.statusCode < 400,
      });

      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Middleware para validar tokens JWT localmente (fallback)
 */
const verifyJWT = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acceso requerido',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    );
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        code: 'INVALID_TOKEN',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Error verificando token',
      code: 'TOKEN_ERROR',
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnership,
  rateLimit,
  validatePaymentInput,
  logPaymentActivity,
  verifyJWT,
};
