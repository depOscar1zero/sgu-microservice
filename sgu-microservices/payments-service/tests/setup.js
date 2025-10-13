// Setup para tests de Payments Service
const { sequelize, syncDatabase } = require('../src/config/database');

process.env.NODE_ENV = 'test';
// No configurar DATABASE_URL para forzar SQLite en tests
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';
process.env.JWT_SECRET = 'test-secret-key';

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
