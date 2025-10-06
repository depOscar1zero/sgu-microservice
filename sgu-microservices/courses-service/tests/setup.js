// Setup para tests de Courses Service
process.env.NODE_ENV = 'test';
// No configurar DATABASE_URL para forzar SQLite en tests

// Configuración de timeouts
jest.setTimeout(30000);

// Cargar utilidades de test
const { testUtils } = require('./utils');
global.testUtils = testUtils;
