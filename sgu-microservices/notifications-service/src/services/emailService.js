const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Verificar conexión
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error("SMTP connection failed:", error);
        } else {
          logger.info("SMTP connection established successfully");
        }
      });
    } catch (error) {
      logger.error("Failed to initialize email transporter:", error);
    }
  }

  async sendEmail(emailData) {
    try {
      const {
        to,
        subject,
        text,
        html,
        from = process.env.SMTP_FROM || "SGU <noreply@sgu.edu>",
        attachments = [],
        replyTo,
        cc,
        bcc,
      } = emailData;

      if (!this.transporter) {
        throw new Error("Email transporter not initialized");
      }

      const mailOptions = {
        from,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        text,
        html,
        attachments,
        replyTo,
        cc: cc ? (Array.isArray(cc) ? cc.join(", ") : cc) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc.join(", ") : bcc) : undefined,
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info("Email sent successfully", {
        messageId: result.messageId,
        to: mailOptions.to,
        subject: mailOptions.subject,
      });

      return {
        success: true,
        messageId: result.messageId,
        response: result.response,
      };
    } catch (error) {
      logger.error("Failed to send email:", error);
      throw error;
    }
  }

  async sendBulkEmails(emailsData) {
    const results = [];
    const errors = [];

    for (const emailData of emailsData) {
      try {
        const result = await this.sendEmail(emailData);
        results.push(result);
      } catch (error) {
        errors.push({
          emailData,
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

  async sendTemplateEmail(template, variables, recipient) {
    try {
      const rendered = template.render(variables);

      const emailData = {
        to: recipient.email,
        subject: rendered.subject,
        text: rendered.content,
        html: rendered.htmlContent,
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      logger.error("Failed to send template email:", error);
      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    const emailData = {
      to: user.email,
      subject: "¡Bienvenido al Sistema de Gestión Universitaria!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">¡Bienvenido a SGU!</h2>
          <p>Hola ${user.firstName} ${user.lastName},</p>
          <p>Te damos la bienvenida al Sistema de Gestión Universitaria. Tu cuenta ha sido creada exitosamente.</p>
          <p>Puedes acceder al sistema con las siguientes credenciales:</p>
          <ul>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>ID de Estudiante:</strong> ${
              user.studentId || "N/A"
            }</li>
          </ul>
          <p>Te recomendamos cambiar tu contraseña en tu primer acceso.</p>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <br>
          <p>Saludos,<br>Equipo SGU</p>
        </div>
      `,
    };

    return await this.sendEmail(emailData);
  }

  async sendEnrollmentConfirmation(enrollment, course, user) {
    const emailData = {
      to: user.email,
      subject: `Confirmación de Inscripción - ${course.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Inscripción Confirmada</h2>
          <p>Hola ${user.firstName},</p>
          <p>Tu inscripción al curso ha sido confirmada exitosamente.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Detalles del Curso:</h3>
            <ul>
              <li><strong>Curso:</strong> ${course.name}</li>
              <li><strong>Código:</strong> ${course.code}</li>
              <li><strong>Profesor:</strong> ${course.teacherName}</li>
              <li><strong>Créditos:</strong> ${course.credits}</li>
            </ul>
          </div>
          <p>Puedes ver más detalles en tu panel de estudiante.</p>
          <br>
          <p>Saludos,<br>Equipo SGU</p>
        </div>
      `,
    };

    return await this.sendEmail(emailData);
  }

  async sendPaymentConfirmation(payment, user) {
    const emailData = {
      to: user.email,
      subject: "Confirmación de Pago",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Pago Procesado Exitosamente</h2>
          <p>Hola ${user.firstName},</p>
          <p>Tu pago ha sido procesado exitosamente.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Detalles del Pago:</h3>
            <ul>
              <li><strong>Monto:</strong> $${payment.amount}</li>
              <li><strong>Método:</strong> ${payment.paymentMethod}</li>
              <li><strong>Fecha:</strong> ${new Date(
                payment.createdAt
              ).toLocaleDateString()}</li>
              <li><strong>Estado:</strong> ${payment.status}</li>
            </ul>
          </div>
          <p>Gracias por tu pago.</p>
          <br>
          <p>Saludos,<br>Equipo SGU</p>
        </div>
      `,
    };

    return await this.sendEmail(emailData);
  }
}

module.exports = new EmailService();
