// Setup para tests de Notifications Service
process.env.NODE_ENV = 'test';
process.env.MONGODB_URL = 'mongodb://localhost:27017/sgu_test';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-password';

// Configuración de timeouts
jest.setTimeout(30000);
