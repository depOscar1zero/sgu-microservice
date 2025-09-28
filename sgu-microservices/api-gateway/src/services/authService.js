const axios = require("axios");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const gatewayConfig = require("../config/gateway");

class AuthService {
  constructor() {
    this.authServiceUrl = gatewayConfig.getServiceConfig("auth").url;
    this.jwtSecret = gatewayConfig.security.jwtSecret;
    this.tokenCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // Validar token JWT
  async validateToken(token) {
    try {
      // Verificar cache primero
      const cached = this.tokenCache.get(token);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.user;
      }

      // Validar token con el servicio de autenticación
      const response = await axios.get(
        `${this.authServiceUrl}/api/auth/validate`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        }
      );

      if (response.data.success && response.data.data) {
        const user = response.data.data;

        // Cachear resultado
        this.tokenCache.set(token, {
          user,
          timestamp: Date.now(),
        });

        logger.info("Token validated successfully", {
          userId: user.id,
          role: user.role,
        });

        return user;
      }

      throw new Error("Token validation failed");
    } catch (error) {
      logger.error("Token validation error:", {
        error: error.message,
        status: error.response?.status,
      });

      // Fallback: verificar token localmente
      try {
        const decoded = jwt.verify(token, this.jwtSecret);

        // Cachear resultado
        this.tokenCache.set(token, {
          user: decoded,
          timestamp: Date.now(),
        });

        return decoded;
      } catch (jwtError) {
        throw new Error("Invalid or expired token");
      }
    }
  }

  // Verificar permisos de usuario
  async checkPermissions(user, requiredPermissions) {
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Los administradores tienen todos los permisos
    if (user.role === "admin") {
      return true;
    }

    // Verificar permisos específicos
    const userPermissions = user.permissions || [];
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      logger.warn("Insufficient permissions", {
        userId: user.id,
        requiredPermissions,
        userPermissions,
      });
    }

    return hasPermission;
  }

  // Verificar rol de usuario
  checkRole(user, requiredRoles) {
    if (!user) {
      throw new Error("User not authenticated");
    }

    const roles = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];
    return roles.includes(user.role);
  }

  // Middleware de autenticación
  authenticate() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({
            success: false,
            message: "Token de acceso requerido",
          });
        }

        const user = await this.validateToken(token);
        req.user = user;
        next();
      } catch (error) {
        logger.error("Authentication middleware error:", {
          error: error.message,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });

        return res.status(401).json({
          success: false,
          message: "Token inválido o expirado",
        });
      }
    };
  }

  // Middleware de autorización por rol
  authorize(requiredRoles) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Usuario no autenticado",
          });
        }

        if (!this.checkRole(req.user, requiredRoles)) {
          return res.status(403).json({
            success: false,
            message: "Acceso denegado. Rol insuficiente",
            required: requiredRoles,
            current: req.user.role,
          });
        }

        next();
      } catch (error) {
        logger.error("Authorization middleware error:", {
          error: error.message,
          userId: req.user?.id,
        });

        return res.status(500).json({
          success: false,
          message: "Error interno de autorización",
        });
      }
    };
  }

  // Middleware de autorización por permisos
  requirePermissions(requiredPermissions) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Usuario no autenticado",
          });
        }

        const hasPermissions = await this.checkPermissions(
          req.user,
          requiredPermissions
        );

        if (!hasPermissions) {
          return res.status(403).json({
            success: false,
            message: "Permisos insuficientes",
            required: requiredPermissions,
          });
        }

        next();
      } catch (error) {
        logger.error("Permission middleware error:", {
          error: error.message,
          userId: req.user?.id,
        });

        return res.status(500).json({
          success: false,
          message: "Error interno de permisos",
        });
      }
    };
  }

  // Middleware opcional de autenticación
  optionalAuth() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          req.user = null;
          return next();
        }

        const user = await this.validateToken(token);
        req.user = user;
        next();
      } catch (error) {
        req.user = null;
        next();
      }
    };
  }

  // Verificar que el usuario sea el propietario del recurso
  requireOwnership(resourceUserIdField = "userId") {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Usuario no autenticado",
          });
        }

        const resourceUserId =
          req.params[resourceUserIdField] || req.body[resourceUserIdField];
        const currentUserId = req.user.id;

        if (resourceUserId !== currentUserId && req.user.role !== "admin") {
          return res.status(403).json({
            success: false,
            message: "Solo puedes acceder a tus propios recursos",
          });
        }

        next();
      } catch (error) {
        logger.error("Ownership middleware error:", {
          error: error.message,
          userId: req.user?.id,
        });

        return res.status(500).json({
          success: false,
          message: "Error interno de verificación de propiedad",
        });
      }
    };
  }

  // Limpiar cache de tokens
  clearTokenCache() {
    this.tokenCache.clear();
    logger.info("Token cache cleared");
  }

  // Obtener estadísticas de autenticación
  getAuthStats() {
    return {
      cachedTokens: this.tokenCache.size,
      cacheTimeout: this.cacheTimeout,
      authServiceUrl: this.authServiceUrl,
    };
  }

  // Verificar API Key
  validateApiKey(apiKey) {
    const validKeys = gatewayConfig.security.apiKeys;
    return validKeys.includes(apiKey);
  }

  // Middleware de API Key
  requireApiKey() {
    return (req, res, next) => {
      const apiKey =
        req.headers[gatewayConfig.security.apiKeyHeader.toLowerCase()];

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          message: "API Key requerida",
        });
      }

      if (!this.validateApiKey(apiKey)) {
        return res.status(401).json({
          success: false,
          message: "API Key inválida",
        });
      }

      next();
    };
  }
}

module.exports = new AuthService();
