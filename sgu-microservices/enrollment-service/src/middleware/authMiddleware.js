const jwt = require('jsonwebtoken');
const { AuthServiceClient } = require('../services/externalServices');

/**
 * Middleware de autenticación para el enrollment service
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

      // Agregar información básica del usuario al request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        studentId: decoded.studentId,
      };

      // Opcionalmente, verificar con el auth service para obtener datos actualizados
      if (process.env.VERIFY_WITH_AUTH_SERVICE === 'true') {
        const authResult = await AuthServiceClient.verifyToken(token);
        if (!authResult.success) {
          return res.status(401).json({
            success: false,
            message: 'Token inválido según el servicio de autenticación',
            timestamp: new Date().toISOString(),
          });
        }

        // Actualizar información del usuario con datos frescos
        req.user = {
          ...req.user,
          firstName: authResult.data.firstName,
          lastName: authResult.data.lastName,
          studentId: authResult.data.studentId,
          isActive: authResult.data.isActive,
        };
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
    console.error('Error en autenticación del enrollment service:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno de autenticación',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Middleware para verificar que el usuario es estudiante
 */
const requireStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Solo los estudiantes pueden realizar esta acción',
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

/**
 * Middleware para verificar que el usuario es administrador
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Se requieren permisos de administrador',
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

/**
 * Middleware que permite tanto estudiantes como administradores
 */
const requireStudentOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida',
      timestamp: new Date().toISOString(),
    });
  }

  if (!['student', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Se requieren permisos de estudiante o administrador',
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireStudent,
  requireAdmin,
  requireStudentOrAdmin,
};
