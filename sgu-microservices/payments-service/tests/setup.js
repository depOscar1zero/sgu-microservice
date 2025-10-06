/**
 * Setup para tests de PaymentFactory
 */

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/sgu_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key_for_development';

// Mock de Sequelize para tests
jest.mock('../src/config/database', () => ({
  sequelize: {
    define: jest.fn(() => ({
      prototype: {
        toPublicJSON: jest.fn(),
        canBeProcessed: jest.fn(),
        canBeRefunded: jest.fn(),
        markAsCompleted: jest.fn(),
        markAsFailed: jest.fn(),
        processRefund: jest.fn(),
        save: jest.fn()
      }
    })),
    Op: {
      between: Symbol('between')
    },
    fn: jest.fn(),
    col: jest.fn()
  }
}));

// Mock del modelo Payment
jest.mock('../src/models/Payment', () => {
  return jest.fn().mockImplementation((data) => ({
    ...data,
    toPublicJSON: jest.fn(() => ({
      id: data.id || 'payment-123',
      enrollmentId: data.enrollmentId,
      amount: data.amount,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    canBeProcessed: jest.fn(() => true),
    canBeRefunded: jest.fn(() => false),
    markAsCompleted: jest.fn(),
    markAsFailed: jest.fn(),
    processRefund: jest.fn(),
    save: jest.fn()
  }));
});
