const admin = require("firebase-admin");
const logger = require("../utils/logger");

class PushService {
  constructor() {
    this.app = null;
    this.initializeApp();
  }

  initializeApp() {
    try {
      if (admin.apps.length === 0) {
        const serviceAccount = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url:
            "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
        };

        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });

        logger.info("Firebase Admin SDK initialized successfully");
      } else {
        this.app = admin.app();
      }
    } catch (error) {
      logger.error("Failed to initialize Firebase Admin SDK:", error);
    }
  }

  async sendPushNotification(notificationData) {
    try {
      const {
        token,
        title,
        body,
        data = {},
        imageUrl,
        sound = "default",
        badge,
        clickAction,
        android = {},
        apns = {},
      } = notificationData;

      if (!this.app) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      const message = {
        token: token,
        notification: {
          title: title,
          body: body,
          imageUrl: imageUrl,
        },
        data: data,
        android: {
          notification: {
            sound: sound,
            clickAction: clickAction,
            ...android,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: sound,
              badge: badge,
              ...apns,
            },
          },
        },
      };

      const result = await admin.messaging().send(message);

      logger.info("Push notification sent successfully", {
        messageId: result,
        token: token,
        title: title,
      });

      return {
        success: true,
        messageId: result,
      };
    } catch (error) {
      logger.error("Failed to send push notification:", error);
      throw error;
    }
  }

  async sendToMultipleTokens(tokens, notificationData) {
    try {
      if (!this.app) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      const {
        title,
        body,
        data = {},
        imageUrl,
        sound = "default",
        badge,
        clickAction,
        android = {},
        apns = {},
      } = notificationData;

      const message = {
        tokens: tokens,
        notification: {
          title: title,
          body: body,
          imageUrl: imageUrl,
        },
        data: data,
        android: {
          notification: {
            sound: sound,
            clickAction: clickAction,
            ...android,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: sound,
              badge: badge,
              ...apns,
            },
          },
        },
      };

      const result = await admin.messaging().sendMulticast(message);

      logger.info("Multicast push notification sent", {
        successCount: result.successCount,
        failureCount: result.failureCount,
        totalTokens: tokens.length,
      });

      return {
        success: true,
        successCount: result.successCount,
        failureCount: result.failureCount,
        responses: result.responses,
      };
    } catch (error) {
      logger.error("Failed to send multicast push notification:", error);
      throw error;
    }
  }

  async sendToTopic(topic, notificationData) {
    try {
      if (!this.app) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      const {
        title,
        body,
        data = {},
        imageUrl,
        sound = "default",
        badge,
        clickAction,
        android = {},
        apns = {},
      } = notificationData;

      const message = {
        topic: topic,
        notification: {
          title: title,
          body: body,
          imageUrl: imageUrl,
        },
        data: data,
        android: {
          notification: {
            sound: sound,
            clickAction: clickAction,
            ...android,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: sound,
              badge: badge,
              ...apns,
            },
          },
        },
      };

      const result = await admin.messaging().send(message);

      logger.info("Topic push notification sent successfully", {
        messageId: result,
        topic: topic,
        title: title,
      });

      return {
        success: true,
        messageId: result,
      };
    } catch (error) {
      logger.error("Failed to send topic push notification:", error);
      throw error;
    }
  }

  async subscribeToTopic(tokens, topic) {
    try {
      if (!this.app) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      const result = await admin.messaging().subscribeToTopic(tokens, topic);

      logger.info("Tokens subscribed to topic", {
        topic: topic,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });

      return {
        success: true,
        successCount: result.successCount,
        failureCount: result.failureCount,
        errors: result.errors,
      };
    } catch (error) {
      logger.error("Failed to subscribe to topic:", error);
      throw error;
    }
  }

  async unsubscribeFromTopic(tokens, topic) {
    try {
      if (!this.app) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      const result = await admin
        .messaging()
        .unsubscribeFromTopic(tokens, topic);

      logger.info("Tokens unsubscribed from topic", {
        topic: topic,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });

      return {
        success: true,
        successCount: result.successCount,
        failureCount: result.failureCount,
        errors: result.errors,
      };
    } catch (error) {
      logger.error("Failed to unsubscribe from topic:", error);
      throw error;
    }
  }

  async sendEnrollmentPush(enrollment, course, user) {
    const notificationData = {
      token: user.deviceToken,
      title: "Inscripción Confirmada",
      body: `Tu inscripción al curso ${course.name} ha sido confirmada`,
      data: {
        type: "enrollment",
        enrollmentId: enrollment.id,
        courseId: course.id,
        courseName: course.name,
      },
      clickAction: "FLUTTER_NOTIFICATION_CLICK",
    };

    return await this.sendPushNotification(notificationData);
  }

  async sendPaymentPush(payment, user) {
    const notificationData = {
      token: user.deviceToken,
      title: "Pago Procesado",
      body: `Tu pago de $${payment.amount} ha sido procesado exitosamente`,
      data: {
        type: "payment",
        paymentId: payment.id,
        amount: payment.amount.toString(),
        status: payment.status,
      },
      clickAction: "FLUTTER_NOTIFICATION_CLICK",
    };

    return await this.sendPushNotification(notificationData);
  }

  async sendReminderPush(reminder, user) {
    const notificationData = {
      token: user.deviceToken,
      title: "Recordatorio",
      body: reminder.message,
      data: {
        type: "reminder",
        reminderId: reminder.id,
        scheduledAt: reminder.scheduledAt,
      },
      clickAction: "FLUTTER_NOTIFICATION_CLICK",
    };

    return await this.sendPushNotification(notificationData);
  }

  async validateToken(token) {
    try {
      if (!this.app) {
        return { valid: false, error: "Firebase Admin SDK not initialized" };
      }

      // Try to send a test message to validate the token
      const testMessage = {
        token: token,
        notification: {
          title: "Test",
          body: "Token validation",
        },
        data: {
          test: "true",
        },
      };

      await admin.messaging().send(testMessage);

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }
}

module.exports = new PushService();
