const jwt = require('jsonwebtoken');
const axios = require('axios');
const { services } = require('../config/services');

/**
 * Middleware de autenticación centralizada
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido',
        timestamp: new Date().toISOString(),
      });
    }

    // Verificar token localmente
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Agregar información del usuario al request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      // Opcional: Verificar con el auth service que el usuario sigue siendo válido
      // Esto es útil para invalidación de tokens en tiempo real
      if (process.env.VERIFY_WITH_AUTH_SERVICE === 'true') {
        await verifyWithAuthService(token);
      }

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado',
          code: 'TOKEN_EXPIRED',
          timestamp: new Date().toISOString(),
        });
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido',
          code: 'TOKEN_INVALID',
          timestamp: new Date().toISOString(),
        });
      }

      throw jwtError;
    }
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno de autenticación',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Verificar token con el servicio de autenticación
 */
const verifyWithAuthService = async token => {
  try {
    const response = await axios.get(`${services.auth.url}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: services.auth.timeout,
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      throw new Error('Token inválido según el servicio de autenticación');
    }

    // Si el servicio de auth no está disponible, continuar con validación local
    console.warn('Auth service no disponible, usando validación local');
    return null;
  }
};

/**
 * Middleware para verificar roles específicos
 */
const requireRole = requiredRole => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida',
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere rol: ${requiredRole}`,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

/**
 * Middleware para verificar múltiples roles
 */
const requireAnyRole = roles => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida',
        timestamp: new Date().toISOString(),
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Roles permitidos: ${roles.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

/**
 * Middleware opcional de autenticación
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      } catch (error) {
        // En autenticación opcional, ignoramos errores de token
        console.log('Token opcional inválido:', error.message);
      }
    }

    next();
  } catch (error) {
    // En autenticación opcional, no fallamos si hay error
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAnyRole,
  optionalAuth,
};
