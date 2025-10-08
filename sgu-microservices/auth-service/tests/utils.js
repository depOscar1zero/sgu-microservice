// Utilidades para tests del Auth Service
const bcrypt = require('bcryptjs');

const testUtils = {
  /**
   * Genera datos de usuario para tests
   */
  generateUser: (overrides = {}) => {
    const baseUser = {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'student',
    };

    return { ...baseUser, ...overrides };
  },

  /**
   * Crea un usuario de prueba en la base de datos
   */
  createTestUser: async UserModel => {
    const userData = testUtils.generateUser();

    // No hashear manualmente, el modelo lo hace automáticamente
    return await UserModel.create(userData);
  },

  /**
   * Genera un token JWT de prueba
   */
  generateTestToken: (payload = {}) => {
    const jwt = require('jsonwebtoken');
    const defaultPayload = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'student',
    };

    return jwt.sign(
      { ...defaultPayload, ...payload },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },

  /**
   * Limpia la base de datos
   */
  cleanupDatabase: async UserModel => {
    try {
      await UserModel.destroy({ where: {} });
    } catch (error) {
      console.warn('Error cleaning database:', error.message);
    }
  },
};

module.exports = { testUtils };
