/**
 * Tests para NotificationFactory - Factory Method Pattern
 */

const {
  NotificationFactory,
  WelcomeNotificationFactory,
  EnrollmentNotificationFactory,
  PaymentNotificationFactory,
  SystemNotificationFactory,
  NotificationFactoryManager,
  notificationFactoryManager
} = require('../../src/factories/NotificationFactory');

describe('NotificationFactory Tests', () => {
  describe('WelcomeNotificationFactory', () => {
    let factory;
    let mockUser;

    beforeEach(() => {
      factory = new WelcomeNotificationFactory();
      mockUser = {
        id: 'user-123',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@example.com'
      };
    });

    test('debe crear notificación de bienvenida correctamente', () => {
      const data = { user: mockUser, studentId: 'STU-001' };
      const notification = factory.buildNotification(data);

      expect(notification.recipient.userId).toBe('user-123');
      expect(notification.recipient.email).toBe('juan.perez@example.com');
      expect(notification.recipient.name).toBe('Juan Pérez');
      expect(notification.subject).toBe('¡Bienvenido al Sistema de Gestión Universitaria!');
      expect(notification.type).toBe('email');
      expect(notification.channel).toBe('email');
      expect(notification.category).toBe('welcome');
      expect(notification.status).toBe('pending');
      expect(notification.priority).toBe('normal');
    });

    test('debe generar mensaje de bienvenida con datos del usuario', () => {
      const data = { user: mockUser, studentId: 'STU-001' };
      const notification = factory.buildNotification(data);

      expect(notification.message).toContain('Juan');
      expect(notification.message).toContain('STU-001');
      expect(notification.metadata.variables.userName).toBe('Juan Pérez');
      expect(notification.metadata.variables.studentId).toBe('STU-001');
    });

    test('debe manejar usuario sin studentId', () => {
      const data = { user: mockUser };
      const notification = factory.buildNotification(data);

      expect(notification.message).toContain('Pendiente');
      expect(notification.metadata.variables.studentId).toBe('Pendiente');
    });
  });

  describe('EnrollmentNotificationFactory', () => {
    let factory;
    let mockData;

    beforeEach(() => {
      factory = new EnrollmentNotificationFactory();
      mockData = {
        user: {
          id: 'user-123',
          firstName: 'María',
          lastName: 'González',
          email: 'maria.gonzalez@example.com'
        },
        enrollment: {
          id: 'enrollment-456'
        },
        course: {
          id: 'course-789',
          name: 'Matemáticas Avanzadas',
          code: 'MATH-301',
          schedule: 'Lunes y Miércoles 10:00-12:00',
          instructor: 'Dr. Smith'
        }
      };
    });

    test('debe crear notificación de inscripción correctamente', () => {
      const notification = factory.buildNotification(mockData);

      expect(notification.recipient.userId).toBe('user-123');
      expect(notification.subject).toBe('Confirmación de Inscripción - MATH-301');
      expect(notification.category).toBe('enrollment');
      expect(notification.metadata.enrollmentId).toBe('enrollment-456');
      expect(notification.metadata.courseId).toBe('course-789');
    });

    test('debe generar mensaje con detalles del curso', () => {
      const notification = factory.buildNotification(mockData);

      expect(notification.message).toContain('María');
      expect(notification.message).toContain('Matemáticas Avanzadas');
      expect(notification.message).toContain('MATH-301');
      expect(notification.message).toContain('Lunes y Miércoles 10:00-12:00');
      expect(notification.message).toContain('Dr. Smith');
    });
  });

  describe('PaymentNotificationFactory', () => {
    let factory;
    let mockData;

    beforeEach(() => {
      factory = new PaymentNotificationFactory();
      mockData = {
        user: {
          id: 'user-123',
          firstName: 'Carlos',
          lastName: 'López',
          email: 'carlos.lopez@example.com'
        },
        payment: {
          id: 'payment-789',
          amount: 150.00,
          dueDate: '2024-01-15',
          failureReason: 'Tarjeta expirada'
        }
      };
    });

    test('debe crear notificación de recordatorio de pago', () => {
      const notification = factory.buildNotification({ ...mockData, type: 'reminder' });

      expect(notification.subject).toBe('Recordatorio de Pago Pendiente');
      expect(notification.category).toBe('payment');
      expect(notification.priority).toBe('normal');
      expect(notification.metadata.paymentId).toBe('payment-789');
    });

    test('debe crear notificación de confirmación de pago', () => {
      const notification = factory.buildNotification({ ...mockData, type: 'confirmation' });

      expect(notification.subject).toBe('Confirmación de Pago Recibido');
      expect(notification.priority).toBe('normal');
    });

    test('debe crear notificación de pago fallido con prioridad alta', () => {
      const notification = factory.buildNotification({ ...mockData, type: 'failed' });

      expect(notification.subject).toBe('Pago Fallido - Acción Requerida');
      expect(notification.priority).toBe('high');
    });

    test('debe generar mensaje de recordatorio correctamente', () => {
      const notification = factory.buildNotification({ ...mockData, type: 'reminder' });

      expect(notification.message).toContain('Carlos');
      expect(notification.message).toContain('$150');
      expect(notification.message).toContain('2024-01-15');
    });
  });

  describe('SystemNotificationFactory', () => {
    let factory;
    let mockData;

    beforeEach(() => {
      factory = new SystemNotificationFactory();
      mockData = {
        user: {
          id: 'user-123',
          firstName: 'Ana',
          lastName: 'Martínez',
          email: 'ana.martinez@example.com'
        },
        systemEvent: 'maintenance',
        details: {
          message: 'El sistema estará en mantenimiento el domingo de 2:00 AM a 4:00 AM',
          additionalInfo: 'Durante este tiempo, el acceso estará limitado'
        }
      };
    });

    test('debe crear notificación del sistema correctamente', () => {
      const notification = factory.buildNotification(mockData);

      expect(notification.subject).toBe('Mantenimiento Programado del Sistema');
      expect(notification.type).toBe('system');
      expect(notification.channel).toBe('in_app');
      expect(notification.category).toBe('system');
      expect(notification.priority).toBe('normal');
    });

    test('debe manejar diferentes tipos de eventos del sistema', () => {
      const events = ['maintenance', 'update', 'security', 'outage'];
      const expectedSubjects = [
        'Mantenimiento Programado del Sistema',
        'Actualización del Sistema',
        'Notificación de Seguridad',
        'Interrupción del Servicio'
      ];
      const expectedPriorities = ['normal', 'normal', 'high', 'urgent'];

      events.forEach((event, index) => {
        const notification = factory.buildNotification({
          ...mockData,
          systemEvent: event
        });

        expect(notification.subject).toBe(expectedSubjects[index]);
        expect(notification.priority).toBe(expectedPriorities[index]);
      });
    });
  });

  describe('NotificationFactoryManager', () => {
    test('debe crear notificación usando el factory apropiado', () => {
      const data = {
        user: { id: 'user-123', firstName: 'Test', lastName: 'User', email: 'test@example.com' },
        studentId: 'STU-001'
      };

      const notification = notificationFactoryManager.createNotification('welcome', data);

      expect(notification.category).toBe('welcome');
      expect(notification.recipient.userId).toBe('user-123');
    });

    test('debe lanzar error para tipo de factory no encontrado', () => {
      const data = { user: { id: 'user-123' } };

      expect(() => {
        notificationFactoryManager.createNotification('invalid_type', data);
      }).toThrow("Factory para tipo 'invalid_type' no encontrado");
    });

    test('debe crear múltiples notificaciones del mismo tipo', () => {
      const dataArray = [
        { user: { id: 'user-1', firstName: 'User1', lastName: 'Test', email: 'user1@example.com' } },
        { user: { id: 'user-2', firstName: 'User2', lastName: 'Test', email: 'user2@example.com' } }
      ];

      const notifications = notificationFactoryManager.createMultipleNotifications('welcome', dataArray);

      expect(notifications).toHaveLength(2);
      expect(notifications[0].category).toBe('welcome');
      expect(notifications[1].category).toBe('welcome');
    });

    test('debe obtener tipos disponibles', () => {
      const types = notificationFactoryManager.getAvailableTypes();

      expect(types).toContain('welcome');
      expect(types).toContain('enrollment');
      expect(types).toContain('payment');
      expect(types).toContain('system');
    });

    test('debe registrar nuevo factory', () => {
      class CustomNotificationFactory extends NotificationFactory {
        createNotification(data) {
          return {
            category: 'custom',
            recipient: data.recipient,
            subject: 'Custom Notification',
            message: 'Custom message',
            type: 'email',
            channel: 'email',
            status: 'pending',
            priority: 'normal'
          };
        }
      }

      notificationFactoryManager.registerFactory('custom', new CustomNotificationFactory());

      const notification = notificationFactoryManager.createNotification('custom', {
        recipient: { userId: 'user-123', email: 'test@example.com', name: 'Test User' }
      });

      expect(notification.category).toBe('custom');
    });
  });

  describe('Validaciones de Factory Base', () => {
    test('debe validar datos requeridos', () => {
      const factory = new WelcomeNotificationFactory();

      expect(() => {
        factory.buildNotification({ user: null });
      }).toThrow('Recipient email es requerido');

      expect(() => {
        factory.buildNotification({ user: { email: null } });
      }).toThrow('Recipient email es requerido');
    });

    test('debe establecer valores por defecto', () => {
      const factory = new WelcomeNotificationFactory();
      const data = {
        user: { id: 'user-123', firstName: 'Test', lastName: 'User', email: 'test@example.com' }
      };

      const notification = factory.buildNotification(data);

      expect(notification.status).toBe('pending');
      expect(notification.priority).toBe('normal');
      expect(notification.delivery).toBeDefined();
      expect(notification.settings.isHtml).toBe(true);
    });
  });
});
