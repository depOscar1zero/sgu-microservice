const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * Servicio de Email para Notifications Service
 * Maneja el envío de emails usando SMTP
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Inicializar el transporter de Nodemailer
   */
  initializeTransporter() {
    try {
      const smtpConfig = {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      };

      this.transporter = nodemailer.createTransport(smtpConfig);
      this.isConfigured = true;

      console.log("✅ Email Service configurado correctamente");
      console.log(`📧 SMTP Host: ${smtpConfig.host}:${smtpConfig.port}`);
    } catch (error) {
      console.error("❌ Error configurando Email Service:", error.message);
      this.isConfigured = false;
    }
  }

  /**
   * Verificar la conexión SMTP
   */
  async verifyConnection() {
    if (!this.isConfigured) {
      throw new Error("Email Service no está configurado");
    }

    try {
      await this.transporter.verify();
      console.log("✅ Conexión SMTP verificada correctamente");
      return true;
    } catch (error) {
      console.error("❌ Error verificando conexión SMTP:", error.message);
      return false;
    }
  }

  /**
   * Enviar email simple
   */
  async sendEmail(emailData) {
    if (!this.isConfigured) {
      throw new Error("Email Service no está configurado");
    }

    const {
      to,
      subject,
      text,
      html,
      from = process.env.EMAIL_FROM || "noreply@sgu.edu",
      fromName = process.env.EMAIL_FROM_NAME || "SGU Sistema",
      attachments = [],
    } = emailData;

    const mailOptions = {
      from: `"${fromName}" <${from}>`,
      to,
      subject,
      text,
      html,
      attachments,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email enviado a ${to}: ${result.messageId}`);
      return {
        success: true,
        messageId: result.messageId,
        response: result.response,
      };
    } catch (error) {
      console.error("❌ Error enviando email:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Enviar email de bienvenida
   */
  async sendWelcomeEmail(userData) {
    const { email, name, studentId } = userData;

    const subject = "¡Bienvenido al Sistema de Gestión Universitaria!";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">¡Bienvenido a SGU!</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Tu cuenta ha sido creada exitosamente en el Sistema de Gestión Universitaria.</p>
        <p><strong>ID de Estudiante:</strong> ${studentId}</p>
        <p>Ahora puedes acceder al sistema y comenzar a gestionar tus cursos y pagos.</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un email automático del Sistema de Gestión Universitaria.
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Enviar email de confirmación de inscripción
   */
  async sendEnrollmentConfirmation(userData, courseData) {
    const { email, name } = userData;
    const { courseName, courseCode, schedule, instructor } = courseData;

    const subject = `Confirmación de Inscripción - ${courseCode}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">¡Inscripción Confirmada!</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Tu inscripción al curso ha sido confirmada exitosamente.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Detalles del Curso:</h3>
          <p><strong>Curso:</strong> ${courseName}</p>
          <p><strong>Código:</strong> ${courseCode}</p>
          <p><strong>Horario:</strong> ${schedule}</p>
          <p><strong>Instructor:</strong> ${instructor}</p>
        </div>
        <p>¡Esperamos que tengas un excelente semestre!</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un email automático del Sistema de Gestión Universitaria.
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Enviar email de recordatorio de pago
   */
  async sendPaymentReminder(userData, paymentData) {
    const { email, name } = userData;
    const { amount, dueDate, description } = paymentData;

    const subject = "Recordatorio de Pago Pendiente";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Recordatorio de Pago</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Tienes un pago pendiente que requiere tu atención.</p>
        <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc2626;">
          <h3>Detalles del Pago:</h3>
          <p><strong>Descripción:</strong> ${description}</p>
          <p><strong>Monto:</strong> $${amount}</p>
          <p><strong>Fecha de Vencimiento:</strong> ${dueDate}</p>
        </div>
        <p>Por favor, realiza el pago antes de la fecha de vencimiento para evitar inconvenientes.</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un email automático del Sistema de Gestión Universitaria.
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }
}

module.exports = new EmailService();
