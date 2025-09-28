const twilio = require("twilio");
const logger = require("../utils/logger");

class SMSService {
  constructor() {
    this.client = null;
    this.initializeClient();
  }

  initializeClient() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken) {
        logger.warn("Twilio credentials not provided, SMS service disabled");
        return;
      }

      this.client = twilio(accountSid, authToken);
      logger.info("SMS service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize SMS service:", error);
    }
  }

  async sendSMS(smsData) {
    try {
      const { to, message, from = process.env.TWILIO_PHONE_NUMBER } = smsData;

      if (!this.client) {
        throw new Error("SMS service not initialized");
      }

      if (!from) {
        throw new Error("Twilio phone number not configured");
      }

      const result = await this.client.messages.create({
        body: message,
        from: from,
        to: to,
      });

      logger.info("SMS sent successfully", {
        messageSid: result.sid,
        to: to,
        status: result.status,
      });

      return {
        success: true,
        messageSid: result.sid,
        status: result.status,
        price: result.price,
        priceUnit: result.priceUnit,
      };
    } catch (error) {
      logger.error("Failed to send SMS:", error);
      throw error;
    }
  }

  async sendBulkSMS(smsDataArray) {
    const results = [];
    const errors = [];

    for (const smsData of smsDataArray) {
      try {
        const result = await this.sendSMS(smsData);
        results.push(result);
      } catch (error) {
        errors.push({
          smsData,
          error: error.message,
        });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  async sendTemplateSMS(template, variables, recipient) {
    try {
      const rendered = template.render(variables);

      const smsData = {
        to: recipient.phone,
        message: rendered.content,
      };

      return await this.sendSMS(smsData);
    } catch (error) {
      logger.error("Failed to send template SMS:", error);
      throw error;
    }
  }

  async sendEnrollmentSMS(enrollment, course, user) {
    const message = `Hola ${user.firstName}, tu inscripción al curso ${course.name} ha sido confirmada. Código: ${course.code}. SGU`;

    const smsData = {
      to: user.phone || user.email, // Fallback to email if phone not available
      message: message,
    };

    return await this.sendSMS(smsData);
  }

  async sendPaymentSMS(payment, user) {
    const message = `Hola ${user.firstName}, tu pago de $${payment.amount} ha sido procesado exitosamente. Estado: ${payment.status}. SGU`;

    const smsData = {
      to: user.phone || user.email,
      message: message,
    };

    return await this.sendSMS(smsData);
  }

  async sendReminderSMS(reminder, user) {
    const message = `Recordatorio: ${reminder.message}. Fecha: ${new Date(
      reminder.scheduledAt
    ).toLocaleDateString()}. SGU`;

    const smsData = {
      to: user.phone || user.email,
      message: message,
    };

    return await this.sendSMS(smsData);
  }

  async validatePhoneNumber(phoneNumber) {
    try {
      if (!this.client) {
        return { valid: false, error: "SMS service not initialized" };
      }

      const result = await this.client.lookups.v1
        .phoneNumbers(phoneNumber)
        .fetch();

      return {
        valid: true,
        phoneNumber: result.phoneNumber,
        countryCode: result.countryCode,
        nationalFormat: result.nationalFormat,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  async getMessageStatus(messageSid) {
    try {
      if (!this.client) {
        throw new Error("SMS service not initialized");
      }

      const message = await this.client.messages(messageSid).fetch();

      return {
        sid: message.sid,
        status: message.status,
        direction: message.direction,
        from: message.from,
        to: message.to,
        body: message.body,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated,
        price: message.price,
        priceUnit: message.priceUnit,
      };
    } catch (error) {
      logger.error("Failed to get message status:", error);
      throw error;
    }
  }
}

module.exports = new SMSService();
