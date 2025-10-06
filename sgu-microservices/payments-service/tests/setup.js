// Setup para tests de Payments Service
process.env.NODE_ENV = 'test';
// No configurar DATABASE_URL para forzar SQLite en tests
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';
process.env.JWT_SECRET = 'test-secret-key';

// Configuración de timeouts
jest.setTimeout(30000);