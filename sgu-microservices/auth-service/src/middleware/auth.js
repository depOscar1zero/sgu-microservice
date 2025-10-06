const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { logger } = require("../utils/logger");

/**
 * Middleware para autenticar tokens JWT
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: "Token de acceso requerido",
        message: "Debes proporcionar un token de autenticación",
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el usuario existe y está activo
    const userId = decoded.userId || decoded.id; // Compatibilidad con ambos formatos
    const user = await User.findByPk(userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Token inválido",
        message: "El token no es válido o el usuario está inactivo",
      });
    }

    // Agregar información del usuario al request
    req.user = {
      userId: userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Token inválido",
        message: "El token proporcionado no es válido",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expirado",
        message: "El token ha expirado, por favor inicia sesión nuevamente",
      });
    }

    logger.error("Error en autenticación:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      message: "Error procesando autenticación",
    });
  }
};

/**
 * Middleware para verificar roles específicos
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "No autenticado",
        message: "Debes estar autenticado para acceder a este recurso",
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        error: "Acceso denegado",
        message: `Se requiere rol de ${requiredRole} para acceder a este recurso`,
      });
    }

    next();
  };
};

/**
 * Middleware para verificar múltiples roles
 */
const requireAnyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "No autenticado",
        message: "Debes estar autenticado para acceder a este recurso",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Acceso denegado",
        message: `Se requiere uno de los siguientes roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId || decoded.id; // Compatibilidad con ambos formatos
      const user = await User.findByPk(userId);

      if (user && user.isActive) {
        req.user = {
          userId: userId,
          email: decoded.email,
          role: decoded.role,
        };
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
