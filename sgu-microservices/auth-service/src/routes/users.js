const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/users/profile
 * Obtener perfil del usuario autenticado
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      user: user.toPublicJSON()
    });

  } catch (error) {
    logger.error('Error obteniendo perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el perfil'
    });
  }
});

/**
 * PUT /api/users/profile
 * Actualizar perfil del usuario autenticado
 */
router.put('/profile', [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Nombre debe tener entre 2 y 50 caracteres'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Apellido debe tener entre 2 y 50 caracteres'),
  body('studentId').optional().isAlphanumeric().withMessage('ID de estudiante debe ser alfanumérico')
], authenticateToken, async (req, res) => {
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: errors.array()
      });
    }

    const { firstName, lastName, studentId } = req.body;
    const user = await User.findByPk(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Verificar si el studentId ya existe (si se proporciona y es diferente al actual)
    if (studentId && studentId !== user.studentId) {
      const existingStudent = await User.findOne({ 
        where: { 
          studentId,
          id: { [require('sequelize').Op.ne]: user.id }
        } 
      });
      if (existingStudent) {
        return res.status(409).json({
          error: 'ID de estudiante ya existe',
          message: 'Ya existe otro usuario con este ID de estudiante'
        });
      }
    }

    // Actualizar campos
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (studentId !== undefined) user.studentId = studentId;

    await user.save();

    logger.info(`Perfil actualizado: ${user.email}`);

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: user.toPublicJSON()
    });

  } catch (error) {
    logger.error('Error actualizando perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el perfil'
    });
  }
});

/**
 * PUT /api/users/change-password
 * Cambiar contraseña del usuario autenticado
 */
router.put('/change-password', [
  body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nueva contraseña debe tener al menos 6 caracteres')
], authenticateToken, async (req, res) => {
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isValidPassword = await user.checkPassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Contraseña actual incorrecta',
        message: 'La contraseña actual no es correcta'
      });
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    logger.info(`Contraseña cambiada: ${user.email}`);

    res.json({
      message: 'Contraseña cambiada exitosamente'
    });

  } catch (error) {
    logger.error('Error cambiando contraseña:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo cambiar la contraseña'
    });
  }
});

/**
 * GET /api/users
 * Obtener lista de usuarios (solo administradores)
 */
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isActive } = req.query;
    const offset = (page - 1) * limit;

    // Construir filtros
    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users: users.map(user => user.toPublicJSON()),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la lista de usuarios'
    });
  }
});

/**
 * PUT /api/users/:id/status
 * Activar/desactivar usuario (solo administradores)
 */
router.put('/:id/status', [
  body('isActive').isBoolean().withMessage('isActive debe ser un booleano')
], authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // No permitir desactivar el propio usuario
    if (id === req.user.userId) {
      return res.status(400).json({
        error: 'No puedes desactivar tu propia cuenta'
      });
    }

    user.isActive = isActive;
    await user.save();

    logger.info(`Estado de usuario cambiado: ${user.email} -> ${isActive ? 'activo' : 'inactivo'}`);

    res.json({
      message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      user: user.toPublicJSON()
    });

  } catch (error) {
    logger.error('Error cambiando estado de usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo cambiar el estado del usuario'
    });
  }
});

module.exports = router;
