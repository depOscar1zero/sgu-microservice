const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Notification = require('../src/models/Notification');
const emailService = require('../src/services/emailService');

describe('Notifications Service API', () => {
  afterAll(async () => {
    // Limpiar notificaciones después de todos los tests
    try {
      await Notification.deleteMany({});
    } catch (error) {
      console.log('Error limpiando notificaciones:', error.message);
    }
  });

  beforeEach(async () => {
    // Limpiar base de datos antes de cada test
    try {
      await Notification.deleteMany({});
    } catch (error) {
      console.log('Error limpiando notificaciones:', error.message);
    }
  });

  describe('Health Check', () => {
    test('GET /api/notifications/health should return service status', async () => {
      const response = await request(app)
        .get('/api/notifications/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notifications Service funcionando');
      expect(response.body.data).toHaveProperty('database');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('timestamp');
    });
  });

  describe('Create Notification', () => {
    test('POST /api/notifications should create a new notification', async () => {
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
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notificación creada exitosamente');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.recipient.email).toBe('test@example.com');
      expect(response.body.data.subject).toBe('Test Notification');
      expect(response.body.data.category).toBe('system');
    });

    test('POST /api/notifications should return 400 for missing required fields', async () => {
      const incompleteData = {
        recipient: {
          userId: 'user-123',
          email: 'test@example.com',
        },
        subject: 'Test Notification',
        // Missing message and category
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Faltan campos requeridos');
    });

    test('POST /api/notifications should handle email sending for email type', async () => {
      // Mock email service
      const mockSendEmail = jest.spyOn(emailService, 'sendEmail');
      mockSendEmail.mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
      });

      const notificationData = {
        recipient: {
          userId: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        subject: 'Test Email',
        message: '<p>Test HTML message</p>',
        type: 'email',
        channel: 'email',
        category: 'system',
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test HTML message</p>',
        text: 'Test HTML message',
      });

      mockSendEmail.mockRestore();
    });
  });

  describe('Get User Notifications', () => {
    test('GET /api/notifications/user/:userId should return user notifications', async () => {
      // Crear notificaciones de prueba
      const notifications = [
        {
          recipient: {
            userId: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          subject: 'Notification 1',
          message: 'Message 1',
          category: 'system',
          type: 'email',
          channel: 'email',
        },
        {
          recipient: {
            userId: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          subject: 'Notification 2',
          message: 'Message 2',
          category: 'enrollment',
          type: 'email',
          channel: 'email',
        },
      ];

      await Notification.insertMany(notifications);

      const response = await request(app)
        .get('/api/notifications/user/user-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
    });

    test('GET /api/notifications/user/:userId should return empty array for non-existent user', async () => {
      const response = await request(app)
        .get('/api/notifications/user/non-existent-user')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('Get Pending Notifications', () => {
    test('GET /api/notifications/pending should return pending notifications', async () => {
      // Crear notificaciones con diferentes estados
      const notifications = [
        {
          recipient: {
            userId: 'user-1',
            email: 'test1@example.com',
            name: 'User 1',
          },
          subject: 'Pending 1',
          message: 'Message 1',
          category: 'system',
          type: 'email',
          channel: 'email',
          status: 'pending',
        },
        {
          recipient: {
            userId: 'user-2',
            email: 'test2@example.com',
            name: 'User 2',
          },
          subject: 'Sent 1',
          message: 'Message 2',
          category: 'system',
          type: 'email',
          channel: 'email',
          status: 'sent',
        },
        {
          recipient: {
            userId: 'user-3',
            email: 'test3@example.com',
            name: 'User 3',
          },
          subject: 'Pending 2',
          message: 'Message 3',
          category: 'enrollment',
          type: 'email',
          channel: 'email',
          status: 'pending',
        },
      ];

      await Notification.insertMany(notifications);

      const response = await request(app)
        .get('/api/notifications/pending')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // Solo las pendientes
      expect(response.body.count).toBe(2);
      expect(response.body.data.every(n => n.status === 'pending')).toBe(true);
    });
  });

  describe('Retry Notification', () => {
    test('POST /api/notifications/:id/retry should retry a failed notification', async () => {
      // Crear notificación fallida
      const notification = new Notification({
        recipient: {
          userId: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        subject: 'Failed Notification',
        message: 'Test message',
        category: 'system',
        type: 'email',
        channel: 'email',
        status: 'failed',
        'delivery.retryCount': 1,
      });
      await notification.save();

      // Mock email service
      const mockSendEmail = jest.spyOn(emailService, 'sendEmail');
      mockSendEmail.mockResolvedValue({
        success: true,
        messageId: 'retry-message-id',
      });

      const response = await request(app)
        .post(`/api/notifications/${notification._id}/retry`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notificación reintentada');
      expect(mockSendEmail).toHaveBeenCalled();

      mockSendEmail.mockRestore();
    });

    test('POST /api/notifications/:id/retry should return 404 for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/notifications/${fakeId}/retry`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Notificación no encontrada');
    });

    test('POST /api/notifications/:id/retry should return 400 for notification that cannot be retried', async () => {
      // Crear notificación que no puede ser reintentada
      const notification = new Notification({
        recipient: {
          userId: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        subject: 'Sent Notification',
        message: 'Test message',
        category: 'system',
        type: 'email',
        channel: 'email',
        status: 'sent',
      });
      await notification.save();

      const response = await request(app)
        .post(`/api/notifications/${notification._id}/retry`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'La notificación no puede ser reintentada'
      );
    });
  });

  describe('Get Notification Stats', () => {
    test('GET /api/notifications/stats should return notification statistics', async () => {
      // Crear notificaciones con diferentes estados
      const notifications = [
        {
          recipient: {
            userId: 'user-1',
            email: 'test1@example.com',
            name: 'User 1',
          },
          subject: 'Test 1',
          message: 'Message 1',
          category: 'system',
          type: 'email',
          channel: 'email',
          status: 'pending',
        },
        {
          recipient: {
            userId: 'user-2',
            email: 'test2@example.com',
            name: 'User 2',
          },
          subject: 'Test 2',
          message: 'Message 2',
          category: 'system',
          type: 'email',
          channel: 'email',
          status: 'sent',
        },
        {
          recipient: {
            userId: 'user-3',
            email: 'test3@example.com',
            name: 'User 3',
          },
          subject: 'Test 3',
          message: 'Message 3',
          category: 'system',
          type: 'email',
          channel: 'email',
          status: 'failed',
        },
        {
          recipient: {
            userId: 'user-4',
            email: 'test4@example.com',
            name: 'User 4',
          },
          subject: 'Test 4',
          message: 'Message 4',
          category: 'system',
          type: 'email',
          channel: 'email',
          status: 'sent',
        },
      ];

      await Notification.insertMany(notifications);

      const response = await request(app)
        .get('/api/notifications/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('pending');
      expect(response.body.data).toHaveProperty('sent');
      expect(response.body.data).toHaveProperty('failed');
      expect(response.body.data).toHaveProperty('byStatus');

      expect(response.body.data.total).toBe(4);
      expect(response.body.data.pending).toBe(1);
      expect(response.body.data.sent).toBe(2);
      expect(response.body.data.failed).toBe(1);
    });
  });

  describe('Root Endpoint', () => {
    test('GET / should return service information', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Notifications Service');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.endpoints).toHaveProperty('health');
      expect(response.body.endpoints).toHaveProperty('stats');
      expect(response.body.endpoints).toHaveProperty('create');
    });
  });
});
