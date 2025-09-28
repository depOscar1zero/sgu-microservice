const fs = require("fs");
const path = require("path");

/**
 * Logger personalizado para el Payments Service
 */
class Logger {
  constructor() {
    this.logDir = path.join(__dirname, "../../logs");
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: "payments-service",
      message,
      ...meta,
    };
    return JSON.stringify(logEntry);
  }

  writeToFile(filename, message) {
    const logFile = path.join(this.logDir, filename);
    fs.appendFileSync(logFile, message + "\n");
  }

  info(message, meta = {}) {
    const formattedMessage = this.formatMessage("INFO", message, meta);
    console.log(formattedMessage);
    this.writeToFile("payments.log", formattedMessage);
  }

  error(message, meta = {}) {
    const formattedMessage = this.formatMessage("ERROR", message, meta);
    console.error(formattedMessage);
    this.writeToFile("payments-error.log", formattedMessage);
  }

  warn(message, meta = {}) {
    const formattedMessage = this.formatMessage("WARN", message, meta);
    console.warn(formattedMessage);
    this.writeToFile("payments.log", formattedMessage);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === "development") {
      const formattedMessage = this.formatMessage("DEBUG", message, meta);
      console.debug(formattedMessage);
      this.writeToFile("payments-debug.log", formattedMessage);
    }
  }

  // Métodos específicos para pagos
  logPaymentCreated(paymentId, userId, amount, currency) {
    this.info("Payment created", {
      paymentId,
      userId,
      amount,
      currency,
      action: "payment_created",
    });
  }

  logPaymentCompleted(paymentId, userId, amount, currency, processingTime) {
    this.info("Payment completed", {
      paymentId,
      userId,
      amount,
      currency,
      processingTime,
      action: "payment_completed",
    });
  }

  logPaymentFailed(paymentId, userId, amount, currency, error) {
    this.error("Payment failed", {
      paymentId,
      userId,
      amount,
      currency,
      error: error.message || error,
      action: "payment_failed",
    });
  }

  logRefundProcessed(paymentId, userId, refundAmount, reason) {
    this.info("Refund processed", {
      paymentId,
      userId,
      refundAmount,
      reason,
      action: "refund_processed",
    });
  }

  logStripeWebhook(eventType, eventId, success) {
    this.info("Stripe webhook received", {
      eventType,
      eventId,
      success,
      action: "stripe_webhook",
    });
  }

  logServiceError(serviceName, error, context = {}) {
    this.error("Service communication error", {
      serviceName,
      error: error.message || error,
      context,
      action: "service_error",
    });
  }

  logSecurityEvent(event, userId, ip, userAgent) {
    this.warn("Security event", {
      event,
      userId,
      ip,
      userAgent,
      action: "security_event",
    });
  }
}

module.exports = new Logger();
