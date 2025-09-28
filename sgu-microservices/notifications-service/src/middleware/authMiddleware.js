const jwt = require("jsonwebtoken");
const axios = require("axios");
const logger = require("../utils/logger");

class AuthMiddleware {
  constructor() {
    this.authServiceUrl =
      process.env.AUTH_SERVICE_URL || "http://localhost:3001";
    this.jwtSecret = process.env.JWT_SECRET || "your-secret-key";
  }

  // Autenticar token
  async authenticateToken(req, res, next) {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Token de acceso requerido",
        });
      }

      // Verificar token con el servicio de autenticación
      try {
        const response = await axios.get(
          `${this.authServiceUrl}/api/auth/validate`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 5000,
          }
        );

        if (response.data.success) {
          req.user = response.data.data;
          next();
        } else {
          return res.status(401).json({
            success: false,
            message: "Token inválido",
          });
        }
      } catch (error) {
        logger.error("Auth service validation failed:", error.message);

        // Fallback: verificar token localmente
        try {
          const decoded = jwt.verify(token, this.jwtSecret);
          req.user = decoded;
          next();
        } catch (jwtError) {
          return res.status(401).json({
            success: false,
            message: "Token inválido o expirado",
          });
        }
      }
    } catch (error) {
      logger.error("Authentication error:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno de autenticación",
      });
    }
  }

  // Verificar roles
  requireRole(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Acceso denegado. Rol insuficiente",
        });
      }

      next();
    };
  }

  // Verificar permisos específicos
  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const userPermissions = req.user.permissions || [];

      if (!userPermissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          message: "Permiso insuficiente",
        });
      }

      next();
    };
  }

  // Middleware opcional de autenticación
  optionalAuth(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      req.user = null;
      return next();
    }

    // Intentar autenticar, pero no fallar si no funciona
    this.authenticateToken(req, res, (err) => {
      if (err) {
        req.user = null;
      }
      next();
    });
  }

  // Verificar que el usuario sea el propietario del recurso
  requireOwnership(req, res, next) {
    const resourceUserId = req.params.userId || req.body.userId;
    const currentUserId = req.user.id;

    if (resourceUserId !== currentUserId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Solo puedes acceder a tus propios recursos",
      });
    }

    next();
  }

  // Rate limiting por usuario
  createUserRateLimit(windowMs = 60000, maxRequests = 100) {
    const userRequests = new Map();

    return (req, res, next) => {
      if (!req.user) {
        return next();
      }

      const userId = req.user.id;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Limpiar requests antiguos
      if (userRequests.has(userId)) {
        const requests = userRequests.get(userId);
        const validRequests = requests.filter((time) => time > windowStart);
        userRequests.set(userId, validRequests);
      } else {
        userRequests.set(userId, []);
      }

      const currentRequests = userRequests.get(userId);

      if (currentRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          message: "Demasiadas solicitudes. Intenta más tarde",
        });
      }

      currentRequests.push(now);
      next();
    };
  }
}

module.exports = new AuthMiddleware();
