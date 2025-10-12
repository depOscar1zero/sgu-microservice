const mongoose = require('mongoose');
const Notification = require('../../src/models/Notification');

describe('Notification Model', () => {
  beforeAll(async () => {
    // Conectar a base de datos de prueba (URI configurada en setup.js)
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Limpiar y cerrar conexión
    try {
      await Notification.deleteMany({});
    } catch (error) {
      console.log('Error limpiando notificaciones:', error.message);
    }
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Limpiar base de datos antes de cada test
    try {
      await Notification.deleteMany({});
    } catch (error) {
      console.log('Error limpiando notificaciones:', error.message);
    }
  });

  describe('Model Creation', () => {
    test('should create notification with valid data', async () => {
      const notificationData = {
        recipient: {
          userId: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        subject: 'Test Notification',
        message: 'This is a test message',
        type: 'email',
        channel: 'email',
        category: 'system',
        priority: 'normal',
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      expect(savedNotification._id).toBeDefined();
      expect(savedNotification.recipient.userId).toBe('user-123');
      expect(savedNotification.recipient.email).toBe('test@example.com');
      expect(savedNotification.subject).toBe('Test Notification');
      expect(savedNotification.message).toBe('This is a test message');
      expect(savedNotification.type).toBe('email');
      expect(savedNotification.channel).toBe('email');
      expect(savedNotification.category).toBe('system');
      expect(savedNotification.status).toBe('pending'); // Default value
      expect(savedNotification.priority).toBe('normal');
    });

    test('should validate required fields', async () => {
      const incompleteNotification = new Notification({
        recipient: {
          userId: 'user-123',
          email: 'test@example.com',
          // Missing name
        },
        subject: 'Test Notification',
        // Missing message and category
      });

      await expect(incompleteNotification.save()).rejects.toThrow();
    });

    test('should validate email format', async () => {
      const notificationData = {
        recipient: {
          userId: 'user-123',
          email: 'invalid-email', // Invalid email format
          name: 'Test User',
        },
        subject: 'Test Notification',
        message: 'Test message',
        category: 'system',
      };

      const notification = new Notification(notificationData);
      await expect(notification.save()).rejects.toThrow();
    });

    test('should validate enum values', async () => {
      const notificationData = {
        recipient: {
          userId: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        subject: 'Test Notification',
        message: 'Test message',
        type: 'invalid_type', // Invalid enum value
        channel: 'invalid_channel', // Invalid enum value
        category: 'invalid_category', // Invalid enum value
      };

      const notification = new Notification(notificationData);
      await expect(notification.save()).rejects.toThrow();
    });
  });

  describe('Model Methods', () => {
    let notification;

    beforeEach(async () => {
      notification = new Notification({
        recipient: {
          userId: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        subject: 'Test Notification',
        message: 'Test message',
        category: 'system',
        type: 'email',
        channel: 'email',
      });
      await notification.save();
    });

    test('markAsSent should update status and delivery info', async () => {
      await notification.markAsSent('gmail');

      expect(notification.status).toBe('sent');
      expect(notification.delivery.sentAt).toBeDefined();
      expect(notification.delivery.provider).toBe('gmail');
    });

    test('markAsDelivered should update status and delivery info', async () => {
      await notification.markAsSent('gmail');
      await notification.markAsDelivered();

      expect(notification.status).toBe('delivered');
      expect(notification.delivery.deliveredAt).toBeDefined();
    });

    test('markAsFailed should update status and error info', async () => {
      const errorMessage = 'SMTP connection failed';
      await notification.markAsFailed(errorMessage);

      expect(notification.status).toBe('failed');
      expect(notification.delivery.failedAt).toBeDefined();
      expect(notification.delivery.errorMessage).toBe(errorMessage);
      expect(notification.delivery.retryCount).toBe(1);
    });

    test('incrementRetry should increase retry count', async () => {
      await notification.incrementRetry();

      expect(notification.delivery.retryCount).toBe(1);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Crear notificaciones de prueba
      const notifications = [
        {
          recipient: {
            userId: 'user-123',
            email: 'user123@example.com',
            name: 'User 123',
          },
          subject: 'Notification 1',
          message: 'Message 1',
          category: 'system',
          type: 'email',
          channel: 'email',
          status: 'pending',
        },
        {
          recipient: {
            userId: 'user-123',
            email: 'user123@example.com',
            name: 'User 123',
          },
          subject: 'Notification 2',
          message: 'Message 2',
          category: 'enrollment',
          type: 'email',
          channel: 'email',
          status: 'sent',
        },
        {
          recipient: {
            userId: 'user-456',
            email: 'user456@example.com',
            name: 'User 456',
          },
          subject: 'Notification 3',
          message: 'Message 3',
          category: 'payment',
          type: 'email',
          channel: 'email',
          status: 'pending',
        },
        {
          recipient: {
            userId: 'user-789',
            email: 'user789@example.com',
            name: 'User 789',
          },
          subject: 'Failed Notification',
          message: 'Failed message',
          category: 'system',
          type: 'email',
          channel: 'email',
          status: 'failed',
          'delivery.retryCount': 2,
        },
      ];

      await Notification.insertMany(notifications);
    });

    test('findByUser should return notifications for specific user', async () => {
      const userNotifications = await Notification.findByUser('user-123');

      expect(userNotifications).toHaveLength(2);
      expect(
        userNotifications.every(n => n.recipient.userId === 'user-123')
      ).toBe(true);
    });

    test('findByUser should respect limit parameter', async () => {
      const userNotifications = await Notification.findByUser('user-123', 1);

      expect(userNotifications).toHaveLength(1);
    });

    test('findPending should return only pending notifications', async () => {
      const pendingNotifications = await Notification.findPending();

      expect(pendingNotifications).toHaveLength(2);
      expect(pendingNotifications.every(n => n.status === 'pending')).toBe(
        true
      );
    });

    test('findFailed should return failed notifications with retry count < 3', async () => {
      const failedNotifications = await Notification.findFailed();

      expect(failedNotifications).toHaveLength(1);
      expect(failedNotifications[0].status).toBe('failed');
      expect(failedNotifications[0].delivery.retryCount).toBeLessThan(3);
    });
  });

  describe('Virtual Properties', () => {
    let notification;

    beforeEach(async () => {
      notification = new Notification({
        recipient: {
          userId: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        subject: 'Test Notification',
        message: 'Test message',
        category: 'system',
        type: 'email',
        channel: 'email',
        delivery: {
          sentAt: new Date('2024-01-01T10:00:00Z'),
          deliveredAt: new Date('2024-01-01T10:05:00Z'),
          retryCount: 1,
        },
      });
      await notification.save();
    });

    test('deliveryTime virtual should calculate delivery time', () => {
      expect(notification.deliveryTime).toBe(5 * 60 * 1000); // 5 minutes in milliseconds
    });

    test('canRetry virtual should return true for failed notifications with retry count < 3', () => {
      notification.status = 'failed';
      notification.delivery.retryCount = 2;

      expect(notification.canRetry).toBe(true);
    });

    test('canRetry virtual should return false for sent notifications', () => {
      notification.status = 'sent';

      expect(notification.canRetry).toBe(false);
    });

    test('canRetry virtual should return false for failed notifications with retry count >= 3', () => {
      notification.status = 'failed';
      notification.delivery.retryCount = 3;

      expect(notification.canRetry).toBe(false);
    });
  });

  describe('Indexes', () => {
    test('should have indexes for efficient queries', async () => {
      const indexes = await Notification.collection.getIndexes();

      // Verificar que existen los índices esperados
      const indexNames = Object.keys(indexes);
      expect(indexNames).toContain('recipient.userId_1_createdAt_-1');
      expect(indexNames).toContain('status_1_createdAt_-1');
      expect(indexNames).toContain('category_1_status_1');
      expect(indexNames).toContain('delivery.sentAt_-1');
    });
  });
});
