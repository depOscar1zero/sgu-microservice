const Notification = require("../models/Notification");
const emailService = require("../services/emailService");

/**
 * Controlador de Notificaciones
 * Maneja las operaciones CRUD y envío de notificaciones
 */
class NotificationController {
  /**
   * Crear una nueva notificación
   */
  async createNotification(req, res) {
    try {
      const {
        recipient,
        subject,
        message,
        type = "email",
        channel = "email",
        priority = "normal",
        category,
        metadata = {},
        settings = {},
      } = req.body;

      // Validar datos requeridos
      if (!recipient || !subject || !message || !category) {
        return res.status(400).json({
          success: false,
          message:
            "Faltan campos requeridos: recipient, subject, message, category",
        });
      }

      // Crear notificación
      const notification = new Notification({
        recipient,
        subject,
        message,
        type,
        channel,
        priority,
        category,
        metadata,
        settings,
      });

      await notification.save();

      // Si es email, intentar enviarlo inmediatamente
      if (type === "email" && channel === "email") {
        try {
          const emailResult = await emailService.sendEmail({
            to: recipient.email,
            subject,
            html: message,
            text: message.replace(/<[^>]*>/g, ""), // Convertir HTML a texto plano
          });

          if (emailResult.success) {
            await notification.markAsSent("gmail");
          } else {
            await notification.markAsFailed(emailResult.error);
          }
        } catch (error) {
          await notification.markAsFailed(error.message);
        }
      }

      res.status(201).json({
        success: true,
        message: "Notificación creada exitosamente",
        data: notification,
      });
    } catch (error) {
      console.error("Error creando notificación:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  /**
   * Obtener notificaciones de un usuario
   */
  async getUserNotifications(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 50, page = 1 } = req.query;

      const notifications = await Notification.findByUser(
        userId,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: notifications.length,
        },
      });
    } catch (error) {
      console.error("Error obteniendo notificaciones:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  /**
   * Obtener notificaciones pendientes
   */
  async getPendingNotifications(req, res) {
    try {
      const notifications = await Notification.findPending();

      res.json({
        success: true,
        data: notifications,
        count: notifications.length,
      });
    } catch (error) {
      console.error("Error obteniendo notificaciones pendientes:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  /**
   * Reenviar notificación fallida
   */
  async retryNotification(req, res) {
    try {
      const { notificationId } = req.params;

      const notification = await Notification.findById(notificationId);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notificación no encontrada",
        });
      }

      if (!notification.canRetry) {
        return res.status(400).json({
          success: false,
          message: "La notificación no puede ser reintentada",
        });
      }

      // Intentar reenviar
      if (notification.type === "email") {
        try {
          const emailResult = await emailService.sendEmail({
            to: notification.recipient.email,
            subject: notification.subject,
            html: notification.message,
          });

          if (emailResult.success) {
            await notification.markAsSent("gmail");
          } else {
            await notification.markAsFailed(emailResult.error);
          }
        } catch (error) {
          await notification.markAsFailed(error.message);
        }
      }

      res.json({
        success: true,
        message: "Notificación reintentada",
        data: notification,
      });
    } catch (error) {
      console.error("Error reintentando notificación:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  async getNotificationStats(req, res) {
    try {
      const stats = await Notification.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const totalNotifications = await Notification.countDocuments();
      const pendingCount = await Notification.countDocuments({
        status: "pending",
      });
      const sentCount = await Notification.countDocuments({ status: "sent" });
      const failedCount = await Notification.countDocuments({
        status: "failed",
      });

      res.json({
        success: true,
        data: {
          total: totalNotifications,
          pending: pendingCount,
          sent: sentCount,
          failed: failedCount,
          byStatus: stats,
        },
      });
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  /**
   * Health check del servicio
   */
  async healthCheck(req, res) {
    try {
      const dbStatus = await Notification.db.readyState;
      const emailStatus = emailService.isConfigured;

      res.json({
        success: true,
        message: "Notifications Service funcionando",
        data: {
          database: dbStatus === 1 ? "connected" : "disconnected",
          email: emailStatus ? "configured" : "not_configured",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error en health check",
        error: error.message,
      });
    }
  }
}

module.exports = new NotificationController();
