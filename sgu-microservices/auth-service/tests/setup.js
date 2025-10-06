// Setup para tests de Auth Service
process.env.NODE_ENV = 'test';
// No configurar DATABASE_URL para forzar SQLite en tests
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Configuración de timeouts
jest.setTimeout(30000);

// Cargar utilidades de test
const { testUtils } = require('./utils');
global.testUtils = testUtils;
