// Setup para tests de integración de Auth Service
const { sequelize, syncDatabase } = require('../../src/config/database');

// Inicializar base de datos antes de todos los tests
beforeAll(async () => {
  // Sincronizar modelos (crear tablas)
  await syncDatabase();
}, 30000);

// Limpiar base de datos después de todos los tests
afterAll(async () => {
  await sequelize.close();
});
