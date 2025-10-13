// Setup para tests de integración de Auth Service
const { sequelize, syncDatabase } = require('../../src/config/database');

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-integration';
process.env.JWT_EXPIRES_IN = '1h';

// Inicializar base de datos antes de todos los tests
beforeAll(async () => {
  // Sincronizar modelos (crear tablas)
  await syncDatabase();
}, 30000);

// Limpiar base de datos después de todos los tests
afterAll(async () => {
  await sequelize.close();
});
