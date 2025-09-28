const Queue = require("bull");
const Redis = require("redis");
const logger = require("../utils/logger");
const Notification = require("../models/Notification");
const emailService = require("./emailService");
const smsService = require("./smsService");
const pushService = require("./pushService");

class QueueService {
  constructor() {
    this.queues = {};
    this.redis = null;
    this.initializeRedis();
    this.initializeQueues();
  }

  initializeRedis() {
    try {
      this.redis = Redis.createClient({
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
      });

      this.redis.on("error", (error) => {
        logger.error("Redis connection error:", error);
      });

      this.redis.on("connect", () => {
        logger.info("Redis connected successfully");
      });

      this.redis.connect();
    } catch (error) {
      logger.error("Failed to initialize Redis:", error);
    }
  }

  initializeQueues() {
    try {
      // Cola para emails
      this.queues.email = new Queue("email notifications", {
        redis: {
          host: process.env.REDIS_HOST || "localhost",
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
          db: process.env.REDIS_DB || 0,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        },
      });

      // Cola para SMS
      this.queues.sms = new Queue("sms notifications", {
        redis: {
          host: process.env.REDIS_HOST || "localhost",
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
          db: process.env.REDIS_DB || 0,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        },
      });

      // Cola para push notifications
      this.queues.push = new Queue("push notifications", {
        redis: {
          host: process.env.REDIS_HOST || "localhost",
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
          db: process.env.REDIS_DB || 0,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        },
      });

      // Cola para notificaciones generales
      this.queues.notifications = new Queue("general notifications", {
        redis: {
          host: process.env.REDIS_HOST || "localhost",
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
          db: process.env.REDIS_DB || 0,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        },
      });

      this.setupProcessors();
      logger.info("Notification queues initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize queues:", error);
    }
  }

  setupProcessors() {
    // Procesador para emails
    this.queues.email.process("send-email", async (job) => {
      try {
        const { notificationId, emailData } = job.data;
        const notification = await Notification.findById(notificationId);

        if (!notification) {
          throw new Error("Notification not found");
        }

        const result = await emailService.sendEmail(emailData);

        await notification.markAsSent();

        logger.info("Email notification processed successfully", {
          notificationId,
          messageId: result.messageId,
        });

        return result;
      } catch (error) {
        logger.error("Failed to process email notification:", error);
        throw error;
      }
    });

    // Procesador para SMS
    this.queues.sms.process("send-sms", async (job) => {
      try {
        const { notificationId, smsData } = job.data;
        const notification = await Notification.findById(notificationId);

        if (!notification) {
          throw new Error("Notification not found");
        }

        const result = await smsService.sendSMS(smsData);

        await notification.markAsSent();

        logger.info("SMS notification processed successfully", {
          notificationId,
          messageSid: result.messageSid,
        });

        return result;
      } catch (error) {
        logger.error("Failed to process SMS notification:", error);
        throw error;
      }
    });

    // Procesador para push notifications
    this.queues.push.process("send-push", async (job) => {
      try {
        const { notificationId, pushData } = job.data;
        const notification = await Notification.findById(notificationId);

        if (!notification) {
          throw new Error("Notification not found");
        }

        const result = await pushService.sendPushNotification(pushData);

        await notification.markAsSent();

        logger.info("Push notification processed successfully", {
          notificationId,
          messageId: result.messageId,
        });

        return result;
      } catch (error) {
        logger.error("Failed to process push notification:", error);
        throw error;
      }
    });

    // Procesador para notificaciones generales
    this.queues.notifications.process("process-notification", async (job) => {
      try {
        const { notificationId } = job.data;
        const notification = await Notification.findById(notificationId);

        if (!notification) {
          throw new Error("Notification not found");
        }

        let result;

        switch (notification.type) {
          case "email":
            result = await emailService.sendEmail({
              to: notification.recipient.email,
              subject: notification.subject,
              text: notification.message,
            });
            break;

          case "sms":
            result = await smsService.sendSMS({
              to: notification.recipient.phone,
              message: notification.message,
            });
            break;

          case "push":
            result = await pushService.sendPushNotification({
              token: notification.recipient.deviceToken,
              title: notification.subject,
              body: notification.message,
            });
            break;

          default:
            throw new Error(
              `Unsupported notification type: ${notification.type}`
            );
        }

        await notification.markAsSent();

        logger.info("Notification processed successfully", {
          notificationId,
          type: notification.type,
        });

        return result;
      } catch (error) {
        logger.error("Failed to process notification:", error);

        // Marcar como fallida si se agotaron los intentos
        if (job.attemptsMade >= job.opts.attempts) {
          const notification = await Notification.findById(
            job.data.notificationId
          );
          if (notification) {
            await notification.markAsFailed(error.message, error.code);
          }
        }

        throw error;
      }
    });

    // Event listeners para monitoreo
    Object.keys(this.queues).forEach((queueName) => {
      const queue = this.queues[queueName];

      queue.on("completed", (job, result) => {
        logger.info(`Job completed in ${queueName} queue`, {
          jobId: job.id,
          result: result,
        });
      });

      queue.on("failed", (job, error) => {
        logger.error(`Job failed in ${queueName} queue`, {
          jobId: job.id,
          error: error.message,
        });
      });

      queue.on("stalled", (job) => {
        logger.warn(`Job stalled in ${queueName} queue`, {
          jobId: job.id,
        });
      });
    });
  }

  async addEmailJob(notificationId, emailData, options = {}) {
    try {
      const job = await this.queues.email.add(
        "send-email",
        {
          notificationId,
          emailData,
        },
        {
          delay: options.delay || 0,
          priority: this.getPriority(options.priority),
          ...options,
        }
      );

      logger.info("Email job added to queue", {
        jobId: job.id,
        notificationId,
      });

      return job;
    } catch (error) {
      logger.error("Failed to add email job:", error);
      throw error;
    }
  }

  async addSMSJob(notificationId, smsData, options = {}) {
    try {
      const job = await this.queues.sms.add(
        "send-sms",
        {
          notificationId,
          smsData,
        },
        {
          delay: options.delay || 0,
          priority: this.getPriority(options.priority),
          ...options,
        }
      );

      logger.info("SMS job added to queue", {
        jobId: job.id,
        notificationId,
      });

      return job;
    } catch (error) {
      logger.error("Failed to add SMS job:", error);
      throw error;
    }
  }

  async addPushJob(notificationId, pushData, options = {}) {
    try {
      const job = await this.queues.push.add(
        "send-push",
        {
          notificationId,
          pushData,
        },
        {
          delay: options.delay || 0,
          priority: this.getPriority(options.priority),
          ...options,
        }
      );

      logger.info("Push job added to queue", {
        jobId: job.id,
        notificationId,
      });

      return job;
    } catch (error) {
      logger.error("Failed to add push job:", error);
      throw error;
    }
  }

  async addNotificationJob(notificationId, options = {}) {
    try {
      const job = await this.queues.notifications.add(
        "process-notification",
        {
          notificationId,
        },
        {
          delay: options.delay || 0,
          priority: this.getPriority(options.priority),
          ...options,
        }
      );

      logger.info("Notification job added to queue", {
        jobId: job.id,
        notificationId,
      });

      return job;
    } catch (error) {
      logger.error("Failed to add notification job:", error);
      throw error;
    }
  }

  getPriority(priority) {
    const priorityMap = {
      low: 1,
      normal: 5,
      high: 10,
      urgent: 20,
    };
    return priorityMap[priority] || 5;
  }

  async getQueueStats() {
    try {
      const stats = {};

      for (const [queueName, queue] of Object.entries(this.queues)) {
        const waiting = await queue.getWaiting();
        const active = await queue.getActive();
        const completed = await queue.getCompleted();
        const failed = await queue.getFailed();

        stats[queueName] = {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
        };
      }

      return stats;
    } catch (error) {
      logger.error("Failed to get queue stats:", error);
      throw error;
    }
  }

  async pauseQueue(queueName) {
    try {
      if (this.queues[queueName]) {
        await this.queues[queueName].pause();
        logger.info(`Queue ${queueName} paused`);
      }
    } catch (error) {
      logger.error(`Failed to pause queue ${queueName}:`, error);
      throw error;
    }
  }

  async resumeQueue(queueName) {
    try {
      if (this.queues[queueName]) {
        await this.queues[queueName].resume();
        logger.info(`Queue ${queueName} resumed`);
      }
    } catch (error) {
      logger.error(`Failed to resume queue ${queueName}:`, error);
      throw error;
    }
  }

  async close() {
    try {
      for (const queue of Object.values(this.queues)) {
        await queue.close();
      }

      if (this.redis) {
        await this.redis.quit();
      }

      logger.info("Queue service closed successfully");
    } catch (error) {
      logger.error("Failed to close queue service:", error);
      throw error;
    }
  }
}

module.exports = new QueueService();
