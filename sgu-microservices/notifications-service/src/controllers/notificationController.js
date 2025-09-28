const Notification = require("../models/Notification");
const NotificationTemplate = require("../models/NotificationTemplate");
const queueService = require("../services/queueService");
const emailService = require("../services/emailService");
const smsService = require("../services/smsService");
const pushService = require("../services/pushService");
const logger = require("../utils/logger");

class NotificationController {
  // Crear notificación
  async createNotification(req, res) {
    try {
      const {
        userId,
        type,
        subject,
        message,
        recipient,
        templateId,
        priority = "normal",
        scheduledAt,
        metadata = {},
        tags = [],
      } = req.body;

      // Validar datos requeridos
      if (!userId || !type || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: "Faltan datos requeridos",
        });
      }

      // Validar tipo de notificación
      const validTypes = ["email", "sms", "push", "in_app"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Tipo de notificación no válido",
        });
      }

      // Crear notificación
      const notification = new Notification({
        userId,
        type,
        subject,
        message,
        recipient,
        templateId,
        priority,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        metadata,
        tags,
      });

      await notification.save();

      // Agregar a la cola si no está programada
      if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
        await queueService.addNotificationJob(notification._id, {
          priority,
        });
      }

      logger.info("Notification created successfully", {
        notificationId: notification._id,
        userId,
        type,
      });

      res.status(201).json({
        success: true,
        data: notification,
        message: "Notificación creada exitosamente",
      });
    } catch (error) {
      logger.error("Failed to create notification:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Obtener notificaciones de un usuario
  async getUserNotifications(req, res) {
    try {
      const { userId } = req.params;
      const { status, type, limit = 50, skip = 0 } = req.query;

      const notifications = await Notification.findByUser(userId, {
        status,
        type,
        limit: parseInt(limit),
        skip: parseInt(skip),
      });

      const total = await Notification.countDocuments({ userId });

      res.json({
        success: true,
        data: notifications,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error("Failed to get user notifications:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Obtener notificación por ID
  async getNotificationById(req, res) {
    try {
      const { id } = req.params;
      const notification = await Notification.findById(id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notificación no encontrada",
        });
      }

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      logger.error("Failed to get notification:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Marcar notificación como leída
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const notification = await Notification.findById(id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notificación no encontrada",
        });
      }

      await notification.markAsRead();

      res.json({
        success: true,
        data: notification,
        message: "Notificación marcada como leída",
      });
    } catch (error) {
      logger.error("Failed to mark notification as read:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Cancelar notificación
  async cancelNotification(req, res) {
    try {
      const { id } = req.params;
      const notification = await Notification.findById(id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notificación no encontrada",
        });
      }

      if (
        notification.status === "sent" ||
        notification.status === "delivered"
      ) {
        return res.status(400).json({
          success: false,
          message: "No se puede cancelar una notificación ya enviada",
        });
      }

      notification.status = "cancelled";
      await notification.save();

      res.json({
        success: true,
        data: notification,
        message: "Notificación cancelada exitosamente",
      });
    } catch (error) {
      logger.error("Failed to cancel notification:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Reenviar notificación
  async resendNotification(req, res) {
    try {
      const { id } = req.params;
      const notification = await Notification.findById(id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notificación no encontrada",
        });
      }

      if (!notification.canRetry()) {
        return res.status(400).json({
          success: false,
          message: "No se puede reenviar esta notificación",
        });
      }

      // Resetear estado
      notification.status = "pending";
      notification.attempts = 0;
      notification.errorMessage = undefined;
      notification.errorCode = undefined;
      await notification.save();

      // Agregar a la cola
      await queueService.addNotificationJob(notification._id, {
        priority: notification.priority,
      });

      res.json({
        success: true,
        data: notification,
        message: "Notificación agregada a la cola para reenvío",
      });
    } catch (error) {
      logger.error("Failed to resend notification:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Obtener estadísticas
  async getStats(req, res) {
    try {
      const { userId } = req.query;
      const stats = await Notification.getStats(userId);

      const formattedStats = {
        total: 0,
        pending: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        cancelled: 0,
      };

      stats.forEach((stat) => {
        formattedStats[stat._id] = stat.count;
        formattedStats.total += stat.count;
      });

      res.json({
        success: true,
        data: formattedStats,
      });
    } catch (error) {
      logger.error("Failed to get notification stats:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Enviar notificación inmediata
  async sendImmediateNotification(req, res) {
    try {
      const {
        userId,
        type,
        subject,
        message,
        recipient,
        priority = "normal",
      } = req.body;

      // Validar datos requeridos
      if (!userId || !type || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: "Faltan datos requeridos",
        });
      }

      let result;

      switch (type) {
        case "email":
          result = await emailService.sendEmail({
            to: recipient.email,
            subject,
            text: message,
          });
          break;

        case "sms":
          result = await smsService.sendSMS({
            to: recipient.phone,
            message,
          });
          break;

        case "push":
          result = await pushService.sendPushNotification({
            token: recipient.deviceToken,
            title: subject,
            body: message,
          });
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Tipo de notificación no válido",
          });
      }

      res.json({
        success: true,
        data: result,
        message: "Notificación enviada exitosamente",
      });
    } catch (error) {
      logger.error("Failed to send immediate notification:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Procesar notificaciones pendientes
  async processPendingNotifications(req, res) {
    try {
      const pendingNotifications = await Notification.findPending();
      let processed = 0;
      let errors = 0;

      for (const notification of pendingNotifications) {
        try {
          await queueService.addNotificationJob(notification._id, {
            priority: notification.priority,
          });
          processed++;
        } catch (error) {
          logger.error("Failed to add notification to queue:", error);
          errors++;
        }
      }

      res.json({
        success: true,
        data: {
          processed,
          errors,
          total: pendingNotifications.length,
        },
        message: "Procesamiento de notificaciones pendientes completado",
      });
    } catch (error) {
      logger.error("Failed to process pending notifications:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }
}

module.exports = new NotificationController();
