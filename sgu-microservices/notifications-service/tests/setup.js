// Setup para tests de Notifications Service
process.env.NODE_ENV = 'test';
// MongoDB con autenticación (usando credenciales del docker-compose)
process.env.MONGODB_URI = 'mongodb://sgu_admin:sgu_mongo_password@localhost:27017/sgu_notifications_test?authSource=admin';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-password';

// Configuración de timeouts
jest.setTimeout(30000);



