const express = require('express');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

/**
 * Rutas del Notifications Service
 * Todas las rutas están prefijadas con /api/notifications
 */

// Health check
router.get('/health', notificationController.healthCheck);

// Obtener estadísticas
router.get('/stats', notificationController.getNotificationStats);

// Obtener notificaciones pendientes
router.get('/pending', notificationController.getPendingNotifications);

// Obtener notificaciones de un usuario específico
router.get('/user/:userId', notificationController.getUserNotifications);

// Crear nueva notificación
router.post('/', notificationController.createNotification);

// Reenviar notificación fallida
router.post('/:notificationId/retry', notificationController.retryNotification);

module.exports = router;
