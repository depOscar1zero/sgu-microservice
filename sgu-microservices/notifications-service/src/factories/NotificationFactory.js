/**
 * Factory Method Pattern - Notification Factory
 * 
 * Este factory se encarga de crear diferentes tipos de notificaciones
 * según el contexto y tipo especificado, siguiendo el patrón Factory Method.
 */

const Notification = require('../models/Notification');

/**
 * Clase base abstracta para factories de notificaciones
 */
class NotificationFactory {
  /**
   * Método factory abstracto - debe ser implementado por subclases
   * @param {Object} data - Datos para crear la notificación
   * @returns {Notification} - Instancia de notificación
   */
  createNotification(data) {
    throw new Error('createNotification debe ser implementado por subclases');
  }

  /**
   * Método template para el proceso de creación
   * @param {Object} data - Datos de la notificación
   * @returns {Notification} - Notificación creada
   */
  buildNotification(data) {
    const notification = this.createNotification(data);
    this.validateNotification(notification);
    this.setDefaultValues(notification);
    return notification;
  }

  /**
   * Validar la notificación creada
   * @param {Notification} notification - Notificación a validar
   */
  validateNotification(notification) {
    if (!notification.recipient || !notification.recipient.email) {
      throw new Error('Recipient email es requerido');
    }
    if (!notification.subject) {
      throw new Error('Subject es requerido');
    }
    if (!notification.message) {
      throw new Error('Message es requerido');
    }
  }

  /**
   * Establecer valores por defecto
   * @param {Notification} notification - Notificación a configurar
   */
  setDefaultValues(notification) {
    notification.status = notification.status || 'pending';
    notification.priority = notification.priority || 'normal';
    notification.delivery = notification.delivery || {};
    notification.settings = notification.settings || { isHtml: true };
  }
}

/**
 * Factory para notificaciones de bienvenida
 */
class WelcomeNotificationFactory extends NotificationFactory {
  createNotification(data) {
    const { user, studentId } = data;
    
    return new Notification({
      recipient: {
        userId: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      },
      subject: "¡Bienvenido al Sistema de Gestión Universitaria!",
      message: this.generateWelcomeMessage(user, studentId),
      type: "email",
      channel: "email",
      category: "welcome",
      priority: "normal",
      metadata: {
        templateId: "welcome_template",
        variables: {
          userName: `${user.firstName} ${user.lastName}`,
          studentId: studentId || "Pendiente"
        }
      }
    });
  }

  generateWelcomeMessage(user, studentId) {
    return `
      <h2>¡Bienvenido a SGU!</h2>
      <p>Hola <strong>${user.firstName}</strong>,</p>
      <p>Tu cuenta ha sido creada exitosamente en el Sistema de Gestión Universitaria.</p>
      <p><strong>ID de Estudiante:</strong> ${studentId || "Pendiente"}</p>
      <p>Ahora puedes acceder al sistema y comenzar a gestionar tus cursos y pagos.</p>
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        Este es un email automático del Sistema de Gestión Universitaria.
      </p>
    `;
  }
}

/**
 * Factory para notificaciones de inscripción
 */
class EnrollmentNotificationFactory extends NotificationFactory {
  createNotification(data) {
    const { user, enrollment, course } = data;
    
    return new Notification({
      recipient: {
        userId: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      },
      subject: `Confirmación de Inscripción - ${course.code}`,
      message: this.generateEnrollmentMessage(user, enrollment, course),
      type: "email",
      channel: "email",
      category: "enrollment",
      priority: "normal",
      metadata: {
        enrollmentId: enrollment.id,
        courseId: course.id,
        templateId: "enrollment_confirmation",
        variables: {
          userName: `${user.firstName} ${user.lastName}`,
          courseName: course.name,
          courseCode: course.code
        }
      }
    });
  }

  generateEnrollmentMessage(user, enrollment, course) {
    return `
      <h2>¡Inscripción Confirmada!</h2>
      <p>Hola <strong>${user.firstName}</strong>,</p>
      <p>Tu inscripción al curso ha sido confirmada exitosamente.</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3>Detalles del Curso:</h3>
        <p><strong>Curso:</strong> ${course.name}</p>
        <p><strong>Código:</strong> ${course.code}</p>
        <p><strong>Horario:</strong> ${course.schedule || "Por definir"}</p>
        <p><strong>Instructor:</strong> ${course.instructor || "Por asignar"}</p>
      </div>
      <p>¡Esperamos que tengas un excelente semestre!</p>
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        Este es un email automático del Sistema de Gestión Universitaria.
      </p>
    `;
  }
}

/**
 * Factory para notificaciones de pago
 */
class PaymentNotificationFactory extends NotificationFactory {
  createNotification(data) {
    const { user, payment, type = 'reminder' } = data;
    
    const notificationConfig = this.getNotificationConfig(type);
    
    return new Notification({
      recipient: {
        userId: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      },
      subject: notificationConfig.subject,
      message: this.generatePaymentMessage(user, payment, type),
      type: "email",
      channel: "email",
      category: "payment",
      priority: this.getPriorityByType(type),
      metadata: {
        paymentId: payment.id,
        enrollmentId: payment.enrollmentId,
        templateId: notificationConfig.templateId,
        variables: {
          userName: `${user.firstName} ${user.lastName}`,
          amount: payment.amount,
          dueDate: payment.dueDate
        }
      }
    });
  }

  getNotificationConfig(type) {
    const configs = {
      reminder: {
        subject: "Recordatorio de Pago Pendiente",
        templateId: "payment_reminder"
      },
      confirmation: {
        subject: "Confirmación de Pago Recibido",
        templateId: "payment_confirmation"
      },
      failed: {
        subject: "Pago Fallido - Acción Requerida",
        templateId: "payment_failed"
      }
    };
    return configs[type] || configs.reminder;
  }

  getPriorityByType(type) {
    const priorities = {
      reminder: "normal",
      confirmation: "normal",
      failed: "high"
    };
    return priorities[type] || "normal";
  }

  generatePaymentMessage(user, payment, type) {
    const baseMessage = `
      <p>Hola <strong>${user.firstName}</strong>,</p>
    `;

    switch (type) {
      case 'reminder':
        return `
          <h2 style="color: #dc2626;">Recordatorio de Pago</h2>
          ${baseMessage}
          <p>Tienes un pago pendiente que requiere tu atención.</p>
          <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc2626;">
            <h3>Detalles del Pago:</h3>
            <p><strong>Monto:</strong> $${payment.amount}</p>
            <p><strong>Fecha de Vencimiento:</strong> ${payment.dueDate}</p>
          </div>
          <p>Por favor, realiza el pago antes de la fecha de vencimiento para evitar inconvenientes.</p>
        `;
      
      case 'confirmation':
        return `
          <h2 style="color: #16a34a;">Pago Confirmado</h2>
          ${baseMessage}
          <p>Tu pago ha sido procesado exitosamente.</p>
          <div style="background: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #16a34a;">
            <h3>Detalles del Pago:</h3>
            <p><strong>Monto:</strong> $${payment.amount}</p>
            <p><strong>Fecha de Procesamiento:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <p>¡Gracias por tu pago puntual!</p>
        `;
      
      case 'failed':
        return `
          <h2 style="color: #dc2626;">Pago Fallido</h2>
          ${baseMessage}
          <p>Tu pago no pudo ser procesado. Por favor, verifica la información y vuelve a intentar.</p>
          <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc2626;">
            <h3>Detalles del Pago:</h3>
            <p><strong>Monto:</strong> $${payment.amount}</p>
            <p><strong>Razón del Fallo:</strong> ${payment.failureReason || "No especificada"}</p>
          </div>
          <p>Por favor, contacta con soporte si el problema persiste.</p>
        `;
      
      default:
        return baseMessage;
    }
  }
}

/**
 * Factory para notificaciones del sistema
 */
class SystemNotificationFactory extends NotificationFactory {
  createNotification(data) {
    const { user, systemEvent, details } = data;
    
    return new Notification({
      recipient: {
        userId: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      },
      subject: this.getSystemSubject(systemEvent),
      message: this.generateSystemMessage(user, systemEvent, details),
      type: "system",
      channel: "in_app",
      category: "system",
      priority: this.getSystemPriority(systemEvent),
      metadata: {
        systemEvent,
        details,
        templateId: `system_${systemEvent}`
      }
    });
  }

  getSystemSubject(event) {
    const subjects = {
      maintenance: "Mantenimiento Programado del Sistema",
      update: "Actualización del Sistema",
      security: "Notificación de Seguridad",
      outage: "Interrupción del Servicio"
    };
    return subjects[event] || "Notificación del Sistema";
  }

  getSystemPriority(event) {
    const priorities = {
      maintenance: "normal",
      update: "normal", 
      security: "high",
      outage: "urgent"
    };
    return priorities[event] || "normal";
  }

  generateSystemMessage(user, event, details) {
    return `
      <h2>Notificación del Sistema</h2>
      <p>Hola <strong>${user.firstName}</strong>,</p>
      <p>${details.message || "Se ha generado una notificación del sistema."}</p>
      ${details.additionalInfo ? `<p>${details.additionalInfo}</p>` : ''}
      <p>Fecha: ${new Date().toLocaleString()}</p>
    `;
  }
}

/**
 * Factory principal que maneja la creación de notificaciones
 * Implementa el patrón Factory Method
 */
class NotificationFactoryManager {
  constructor() {
    this.factories = {
      welcome: new WelcomeNotificationFactory(),
      enrollment: new EnrollmentNotificationFactory(),
      payment: new PaymentNotificationFactory(),
      system: new SystemNotificationFactory()
    };
  }

  /**
   * Crear notificación usando el factory apropiado
   * @param {string} type - Tipo de notificación
   * @param {Object} data - Datos para crear la notificación
   * @returns {Notification} - Notificación creada
   */
  createNotification(type, data) {
    const factory = this.factories[type];
    
    if (!factory) {
      throw new Error(`Factory para tipo '${type}' no encontrado`);
    }

    return factory.buildNotification(data);
  }

  /**
   * Crear múltiples notificaciones del mismo tipo
   * @param {string} type - Tipo de notificación
   * @param {Array} dataArray - Array de datos para crear notificaciones
   * @returns {Array<Notification>} - Array de notificaciones creadas
   */
  createMultipleNotifications(type, dataArray) {
    return dataArray.map(data => this.createNotification(type, data));
  }

  /**
   * Obtener tipos de notificaciones disponibles
   * @returns {Array<string>} - Tipos disponibles
   */
  getAvailableTypes() {
    return Object.keys(this.factories);
  }

  /**
   * Registrar un nuevo factory
   * @param {string} type - Tipo de notificación
   * @param {NotificationFactory} factory - Factory a registrar
   */
  registerFactory(type, factory) {
    if (!(factory instanceof NotificationFactory)) {
      throw new Error('Factory debe extender de NotificationFactory');
    }
    this.factories[type] = factory;
  }
}

// Instancia singleton del manager
const notificationFactoryManager = new NotificationFactoryManager();

module.exports = {
  NotificationFactory,
  WelcomeNotificationFactory,
  EnrollmentNotificationFactory,
  PaymentNotificationFactory,
  SystemNotificationFactory,
  NotificationFactoryManager,
  notificationFactoryManager
};
