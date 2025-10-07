const emailService = require('../../src/services/emailService');

describe('Email Service', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    test('should initialize with correct configuration', () => {
      expect(emailService).toBeDefined();
      expect(emailService.transporter).toBeDefined();
      expect(typeof emailService.isConfigured).toBe('boolean');
    });

    test('should be configured when SMTP credentials are available', () => {
      // En el setup de pruebas, las credenciales SMTP están configuradas
      expect(emailService.isConfigured).toBe(true);
    });
  });

  describe('Email Sending', () => {
    test('should send simple email successfully', async () => {
      // Mock del transporter
      const mockSendMail = jest.fn().mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 OK'
      });
      
      emailService.transporter = {
        sendMail: mockSendMail
      };

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        text: 'Test text content'
      };

      const result = await emailService.sendEmail(emailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(result.response).toBe('250 OK');
      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"SGU Sistema" <noreply@sgu.edu>',
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test text content',
        html: '<p>Test HTML content</p>',
        attachments: []
      });
    });

    test('should handle email sending errors', async () => {
      // Mock del transporter para simular error
      const mockSendMail = jest.fn().mockRejectedValue(new Error('SMTP connection failed'));
      
      emailService.transporter = {
        sendMail: mockSendMail
      };

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>'
      };

      const result = await emailService.sendEmail(emailData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP connection failed');
    });

    test('should throw error when service is not configured', async () => {
      // Simular servicio no configurado
      const originalIsConfigured = emailService.isConfigured;
      emailService.isConfigured = false;

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>'
      };

      await expect(emailService.sendEmail(emailData)).rejects.toThrow('Email Service no está configurado');

      // Restaurar estado original
      emailService.isConfigured = originalIsConfigured;
    });

    test('should use custom from address when provided', async () => {
      const mockSendMail = jest.fn().mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 OK'
      });
      
      emailService.transporter = {
        sendMail: mockSendMail
      };

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        from: 'custom@example.com',
        fromName: 'Custom Name'
      };

      await emailService.sendEmail(emailData);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Custom Name" <custom@example.com>',
        to: 'test@example.com',
        subject: 'Test Subject',
        text: undefined,
        html: '<p>Test HTML content</p>',
        attachments: []
      });
    });
  });

  describe('Welcome Email', () => {
    test('should send welcome email with correct content', async () => {
      const mockSendMail = jest.fn().mockResolvedValue({
        messageId: 'welcome-message-id',
        response: '250 OK'
      });
      
      emailService.transporter = {
        sendMail: mockSendMail
      };

      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        studentId: 'STU-001'
      };

      const result = await emailService.sendWelcomeEmail(userData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('welcome-message-id');
      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"SGU Sistema" <noreply@sgu.edu>',
        to: 'newuser@example.com',
        subject: '¡Bienvenido al Sistema de Gestión Universitaria!',
        text: undefined,
        html: expect.stringContaining('New User'),
        attachments: []
      });
    });

    test('should include student ID in welcome email', async () => {
      const mockSendMail = jest.fn().mockResolvedValue({
        messageId: 'welcome-message-id',
        response: '250 OK'
      });
      
      emailService.transporter = {
        sendMail: mockSendMail
      };

      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        studentId: 'STU-001'
      };

      await emailService.sendWelcomeEmail(userData);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('STU-001');
    });
  });

  describe('Enrollment Confirmation Email', () => {
    test('should send enrollment confirmation email', async () => {
      const mockSendMail = jest.fn().mockResolvedValue({
        messageId: 'enrollment-message-id',
        response: '250 OK'
      });
      
      emailService.transporter = {
        sendMail: mockSendMail
      };

      const userData = {
        email: 'student@example.com',
        name: 'John Doe'
      };

      const courseData = {
        courseName: 'Advanced Mathematics',
        courseCode: 'MATH-301',
        schedule: 'Monday and Wednesday 10:00-12:00',
        instructor: 'Dr. Smith'
      };

      const result = await emailService.sendEnrollmentConfirmation(userData, courseData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('enrollment-message-id');
      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"SGU Sistema" <noreply@sgu.edu>',
        to: 'student@example.com',
        subject: 'Confirmación de Inscripción - MATH-301',
        text: undefined,
        html: expect.stringContaining('Advanced Mathematics'),
        attachments: []
      });
    });

    test('should include course details in enrollment email', async () => {
      const mockSendMail = jest.fn().mockResolvedValue({
        messageId: 'enrollment-message-id',
        response: '250 OK'
      });
      
      emailService.transporter = {
        sendMail: mockSendMail
      };

      const userData = {
        email: 'student@example.com',
        name: 'John Doe'
      };

      const courseData = {
        courseName: 'Advanced Mathematics',
        courseCode: 'MATH-301',
        schedule: 'Monday and Wednesday 10:00-12:00',
        instructor: 'Dr. Smith'
      };

      await emailService.sendEnrollmentConfirmation(userData, courseData);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Advanced Mathematics');
      expect(callArgs.html).toContain('MATH-301');
      expect(callArgs.html).toContain('Monday and Wednesday 10:00-12:00');
      expect(callArgs.html).toContain('Dr. Smith');
    });
  });

  describe('Payment Reminder Email', () => {
    test('should send payment reminder email', async () => {
      const mockSendMail = jest.fn().mockResolvedValue({
        messageId: 'payment-message-id',
        response: '250 OK'
      });
      
      emailService.transporter = {
        sendMail: mockSendMail
      };

      const userData = {
        email: 'student@example.com',
        name: 'John Doe'
      };

      const paymentData = {
        amount: 150.00,
        dueDate: '2024-01-15',
        description: 'Tuition Payment'
      };

      const result = await emailService.sendPaymentReminder(userData, paymentData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('payment-message-id');
      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"SGU Sistema" <noreply@sgu.edu>',
        to: 'student@example.com',
        subject: 'Recordatorio de Pago Pendiente',
        text: undefined,
        html: expect.stringContaining('$150'),
        attachments: []
      });
    });

    test('should include payment details in reminder email', async () => {
      const mockSendMail = jest.fn().mockResolvedValue({
        messageId: 'payment-message-id',
        response: '250 OK'
      });
      
      emailService.transporter = {
        sendMail: mockSendMail
      };

      const userData = {
        email: 'student@example.com',
        name: 'John Doe'
      };

      const paymentData = {
        amount: 150.00,
        dueDate: '2024-01-15',
        description: 'Tuition Payment'
      };

      await emailService.sendPaymentReminder(userData, paymentData);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Tuition Payment');
      expect(callArgs.html).toContain('$150');
      expect(callArgs.html).toContain('2024-01-15');
    });
  });

  describe('Connection Verification', () => {
    test('should verify SMTP connection successfully', async () => {
      // Mock del transporter
      const mockVerify = jest.fn().mockResolvedValue(true);
      
      emailService.transporter = {
        verify: mockVerify
      };

      const result = await emailService.verifyConnection();

      expect(result).toBe(true);
      expect(mockVerify).toHaveBeenCalled();
    });

    test('should handle SMTP connection verification errors', async () => {
      // Mock del transporter para simular error
      const mockVerify = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      emailService.transporter = {
        verify: mockVerify
      };

      const result = await emailService.verifyConnection();

      expect(result).toBe(false);
    });

    test('should throw error when service is not configured for verification', async () => {
      // Simular servicio no configurado
      const originalIsConfigured = emailService.isConfigured;
      emailService.isConfigured = false;

      await expect(emailService.verifyConnection()).rejects.toThrow('Email Service no está configurado');

      // Restaurar estado original
      emailService.isConfigured = originalIsConfigured;
    });
  });
});
