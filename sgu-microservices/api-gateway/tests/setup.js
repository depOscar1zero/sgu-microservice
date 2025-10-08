// Setup para tests de API Gateway
process.env.NODE_ENV = 'test';
process.env.AUTH_SERVICE_URL = 'http://localhost:3001';
process.env.COURSES_SERVICE_URL = 'http://localhost:3002';
process.env.ENROLLMENT_SERVICE_URL = 'http://localhost:3003';
process.env.NOTIFICATIONS_SERVICE_URL = 'http://localhost:3004';
process.env.PAYMENTS_SERVICE_URL = 'http://localhost:3005';

// Configuración de timeouts
jest.setTimeout(30000);
