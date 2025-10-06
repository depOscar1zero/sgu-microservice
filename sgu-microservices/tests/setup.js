// Setup global para tests de SGU Microservices
process.env.NODE_ENV = 'test';

// Configuración de base de datos para tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sgu_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/sgu_test';

// Configuración de servicios externos para tests
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-password';

// Configuración de JWT para tests
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Configuración de timeouts
jest.setTimeout(30000);

// Configuración de console para tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};