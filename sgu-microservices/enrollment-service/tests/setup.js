// Setup para tests de Enrollment Service
process.env.NODE_ENV = 'test';
// No configurar DATABASE_URL para forzar SQLite en tests
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-key';

// Configuración de timeouts
jest.setTimeout(30000);