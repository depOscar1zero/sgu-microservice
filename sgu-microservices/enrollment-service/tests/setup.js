/**
 * Configuración global para los tests de Jest
 */

// Configurar variables de entorno para testing
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "1h";
process.env.MAX_ENROLLMENTS_PER_STUDENT = "8";
process.env.COURSES_SERVICE_URL = "http://localhost:3002";
process.env.AUTH_SERVICE_URL = "http://localhost:3001";
process.env.NOTIFICATIONS_SERVICE_URL = "http://localhost:3005";

// Configurar timeout para tests
jest.setTimeout(10000);

// Mock de console para evitar logs en tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
