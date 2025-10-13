// Setup para tests de Enrollment Service
const { sequelize, syncDatabase } = require('../src/config/database');

process.env.NODE_ENV = 'test';
// No configurar DATABASE_URL para forzar SQLite en tests
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-key';

// Mock de servicios externos
jest.mock('../src/services/externalServices', () =>
  require('./mocks/externalServices')
);

// Configuración de timeouts
jest.setTimeout(30000);

// Inicializar base de datos antes de todos los tests
beforeAll(async () => {
  await syncDatabase();
}, 30000);

// Cerrar conexión después de todos los tests
afterAll(async () => {
  await sequelize.close();
});
