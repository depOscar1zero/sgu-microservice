const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { logger } = require("../utils/logger");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/auth/register
 * Registro de nuevos usuarios
 */
router.post(
  "/register",
  [
    body("firstName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Nombre debe tener entre 2 y 50 caracteres"),
    body("lastName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Apellido debe tener entre 2 y 50 caracteres"),
    body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Contraseña debe tener al menos 6 caracteres"),
    body("role")
      .optional()
      .isIn(["student", "admin"])
      .withMessage("Rol inválido"),
    body("studentId")
      .optional()
      .isAlphanumeric()
      .withMessage("ID de estudiante debe ser alfanumérico"),
  ],
  async (req, res) => {
    try {
      // Validar datos de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Datos de entrada inválidos",
          details: errors.array(),
        });
      }

      const {
        firstName,
        lastName,
        email,
        password,
        role = "student",
        studentId,
      } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          error: "Usuario ya existe",
          message: "Ya existe un usuario con este email",
        });
      }

      // Verificar si el studentId ya existe (si se proporciona)
      if (studentId) {
        const existingStudent = await User.findOne({ where: { studentId } });
        if (existingStudent) {
          return res.status(409).json({
            error: "ID de estudiante ya existe",
            message: "Ya existe un usuario con este ID de estudiante",
          });
        }
      }

      // Crear nuevo usuario
      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        role,
        studentId: role === "student" ? studentId : null,
      });

      // Generar token JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );

      logger.info(`Usuario registrado: ${email}`);

      res.status(201).json({
        message: "Usuario registrado exitosamente",
        user: user.toPublicJSON(),
        token,
      });
    } catch (error) {
      logger.error("Error en registro:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "No se pudo registrar el usuario",
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Inicio de sesión
 */
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
    body("password").notEmpty().withMessage("Contraseña requerida"),
  ],
  async (req, res) => {
    try {
      // Validar datos de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Datos de entrada inválidos",
          details: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Buscar usuario
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          error: "Credenciales inválidas",
          message: "Email o contraseña incorrectos",
        });
      }

      // Verificar si el usuario está activo
      if (!user.isActive) {
        return res.status(401).json({
          error: "Cuenta desactivada",
          message: "Tu cuenta ha sido desactivada. Contacta al administrador.",
        });
      }

      // Verificar contraseña
      const isValidPassword = await user.checkPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: "Credenciales inválidas",
          message: "Email o contraseña incorrectos",
        });
      }

      // Actualizar último login
      await user.updateLastLogin();

      // Generar token JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );

      logger.info(`Usuario logueado: ${email}`);

      res.json({
        message: "Login exitoso",
        user: user.toPublicJSON(),
        token,
      });
    } catch (error) {
      logger.error("Error en login:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "No se pudo procesar el login",
      });
    }
  }
);

/**
 * POST /api/auth/refresh
 * Renovar token
 */
router.post("/refresh", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Usuario no válido",
        message: "No se puede renovar el token",
      });
    }

    // Generar nuevo token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.json({
      message: "Token renovado exitosamente",
      token,
    });
  } catch (error) {
    logger.error("Error renovando token:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      message: "No se pudo renovar el token",
    });
  }
});

/**
 * POST /api/auth/logout
 * Cerrar sesión (en este caso solo invalidamos el token del lado del cliente)
 */
router.post("/logout", authenticateToken, (req, res) => {
  logger.info(`Usuario deslogueado: ${req.user.email}`);
  res.json({
    message: "Logout exitoso",
  });
});

/**
 * GET /api/auth/validate
 * Validar token
 */
router.get("/validate", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Token inválido",
        message: "El token no es válido o el usuario está inactivo",
      });
    }

    res.json({
      valid: true,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    logger.error("Error validando token:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      message: "No se pudo validar el token",
    });
  }
});

module.exports = router;
