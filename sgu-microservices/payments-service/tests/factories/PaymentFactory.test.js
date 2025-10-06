/**
 * Tests para PaymentFactory - Factory Method Pattern
 */

const {
  PaymentFactory,
  CreditCardPaymentFactory,
  DebitCardPaymentFactory,
  BankTransferPaymentFactory,
  CashPaymentFactory,
  StripePaymentFactory,
  TuitionPaymentFactory,
  MaterialsPaymentFactory,
  PaymentFactoryManager,
  paymentFactoryManager
} = require('../../src/factories/PaymentFactory');

describe('PaymentFactory Tests', () => {
  describe('CreditCardPaymentFactory', () => {
    let factory;
    let mockData;

    beforeEach(() => {
      factory = new CreditCardPaymentFactory();
      mockData = {
        enrollmentId: 'enrollment-123',
        userId: 'user-456',
        amount: 100.00,
        currency: 'USD',
        cardDetails: {
          cardType: 'Visa',
          last4: '4242',
          brand: 'visa',
          expiryMonth: 12,
          expiryYear: 2025
        }
      };
    });

    test('debe crear pago con tarjeta de crédito correctamente', () => {
      const payment = factory.buildPayment(mockData);

      expect(payment.enrollmentId).toBe('enrollment-123');
      expect(payment.userId).toBe('user-456');
      expect(payment.amount).toBe(100.00);
      expect(payment.currency).toBe('USD');
      expect(payment.paymentMethod).toBe('credit_card');
      expect(payment.status).toBe('pending');
      expect(payment.paymentMethodDetails.cardType).toBe('Visa');
      expect(payment.paymentMethodDetails.last4).toBe('4242');
    });

    test('debe calcular fees correctamente para tarjeta de crédito', () => {
      const payment = factory.buildPayment(mockData);

      // Fee esperado: 2.9% + $0.30 = $3.20
      expect(payment.processingFee).toBeCloseTo(3.20, 2);
      expect(payment.netAmount).toBeCloseTo(96.80, 2);
    });
  });

  describe('DebitCardPaymentFactory', () => {
    let factory;
    let mockData;

    beforeEach(() => {
      factory = new DebitCardPaymentFactory();
      mockData = {
        enrollmentId: 'enrollment-123',
        userId: 'user-456',
        amount: 100.00,
        currency: 'USD',
        cardDetails: {
          cardType: 'Debit',
          last4: '1234',
          brand: 'mastercard',
          expiryMonth: 10,
          expiryYear: 2026
        }
      };
    });

    test('debe crear pago con tarjeta de débito correctamente', () => {
      const payment = factory.buildPayment(mockData);

      expect(payment.paymentMethod).toBe('debit_card');
      expect(payment.paymentMethodDetails.cardType).toBe('Debit');
      expect(payment.paymentMethodDetails.brand).toBe('mastercard');
    });

    test('debe calcular fees correctamente para tarjeta de débito', () => {
      const payment = factory.buildPayment(mockData);

      // Fee esperado: 1.5% + $0.15 = $1.65
      expect(payment.processingFee).toBeCloseTo(1.65, 2);
      expect(payment.netAmount).toBeCloseTo(98.35, 2);
    });
  });

  describe('BankTransferPaymentFactory', () => {
    let factory;
    let mockData;

    beforeEach(() => {
      factory = new BankTransferPaymentFactory();
      mockData = {
        enrollmentId: 'enrollment-123',
        userId: 'user-456',
        amount: 100.00,
        currency: 'USD',
        bankDetails: {
          bankName: 'Bank of America',
          accountNumber: '1234567890',
          routingNumber: '021000021',
          accountType: 'checking'
        }
      };
    });

    test('debe crear pago con transferencia bancaria correctamente', () => {
      const payment = factory.buildPayment(mockData);

      expect(payment.paymentMethod).toBe('bank_transfer');
      expect(payment.paymentMethodDetails.bankName).toBe('Bank of America');
      expect(payment.paymentMethodDetails.accountType).toBe('checking');
    });

    test('debe calcular fees correctamente para transferencia bancaria', () => {
      const payment = factory.buildPayment(mockData);

      // Fee esperado: 0.5% + $0.10 = $0.60
      expect(payment.processingFee).toBeCloseTo(0.60, 2);
      expect(payment.netAmount).toBeCloseTo(99.40, 2);
    });
  });

  describe('CashPaymentFactory', () => {
    let factory;
    let mockData;

    beforeEach(() => {
      factory = new CashPaymentFactory();
      mockData = {
        enrollmentId: 'enrollment-123',
        userId: 'user-456',
        amount: 100.00,
        currency: 'USD',
        cashDetails: {
          location: 'Oficina Principal',
          reference: 'CASH-001',
          collectedBy: 'admin-001'
        }
      };
    });

    test('debe crear pago en efectivo correctamente', () => {
      const payment = factory.buildPayment(mockData);

      expect(payment.paymentMethod).toBe('cash');
      expect(payment.paymentMethodDetails.location).toBe('Oficina Principal');
      expect(payment.paymentMethodDetails.reference).toBe('CASH-001');
    });

    test('debe calcular fees correctamente para pago en efectivo', () => {
      const payment = factory.buildPayment(mockData);

      // No hay fees para pagos en efectivo
      expect(payment.processingFee).toBe(0);
      expect(payment.netAmount).toBe(100.00);
    });
  });

  describe('StripePaymentFactory', () => {
    let factory;
    let mockData;

    beforeEach(() => {
      factory = new StripePaymentFactory();
      mockData = {
        enrollmentId: 'enrollment-123',
        userId: 'user-456',
        amount: 100.00,
        currency: 'USD',
        stripeDetails: {
          paymentIntentId: 'pi_1234567890',
          paymentMethodId: 'pm_1234567890',
          customerId: 'cus_1234567890'
        }
      };
    });

    test('debe crear pago con Stripe correctamente', () => {
      const payment = factory.buildPayment(mockData);

      expect(payment.paymentMethod).toBe('stripe');
      expect(payment.stripePaymentIntentId).toBe('pi_1234567890');
      expect(payment.paymentMethodDetails.stripePaymentMethodId).toBe('pm_1234567890');
    });

    test('debe calcular fees correctamente para Stripe', () => {
      const payment = factory.buildPayment(mockData);

      // Fee esperado: 2.9% + $0.30 = $3.20
      expect(payment.processingFee).toBeCloseTo(3.20, 2);
      expect(payment.netAmount).toBeCloseTo(96.80, 2);
    });
  });

  describe('TuitionPaymentFactory', () => {
    let factory;
    let mockData;

    beforeEach(() => {
      factory = new TuitionPaymentFactory();
      mockData = {
        enrollmentId: 'enrollment-123',
        userId: 'user-456',
        amount: 500.00,
        currency: 'USD',
        semester: 'Fall 2024',
        academicYear: '2024-2025',
        paymentMethod: 'credit_card'
      };
    });

    test('debe crear pago de matrícula correctamente', () => {
      const payment = factory.buildPayment(mockData);

      expect(payment.paymentMethod).toBe('credit_card');
      expect(payment.metadata.paymentType).toBe('tuition');
      expect(payment.metadata.semester).toBe('Fall 2024');
      expect(payment.metadata.academicYear).toBe('2024-2025');
      expect(payment.metadata.description).toBe('Matrícula - Fall 2024 2024-2025');
    });

    test('debe calcular fees reducidos para matrícula', () => {
      const payment = factory.buildPayment(mockData);

      // Fee reducido: 1.5% + $0.20 = $7.70
      expect(payment.processingFee).toBeCloseTo(7.70, 2);
      expect(payment.netAmount).toBeCloseTo(492.30, 2);
    });
  });

  describe('MaterialsPaymentFactory', () => {
    let factory;
    let mockData;

    beforeEach(() => {
      factory = new MaterialsPaymentFactory();
      mockData = {
        enrollmentId: 'enrollment-123',
        userId: 'user-456',
        amount: 75.00,
        currency: 'USD',
        materials: ['Libro de Matemáticas', 'Calculadora', 'Cuadernos'],
        paymentMethod: 'debit_card'
      };
    });

    test('debe crear pago de materiales correctamente', () => {
      const payment = factory.buildPayment(mockData);

      expect(payment.paymentMethod).toBe('debit_card');
      expect(payment.metadata.paymentType).toBe('materials');
      expect(payment.metadata.materials).toEqual(['Libro de Matemáticas', 'Calculadora', 'Cuadernos']);
      expect(payment.metadata.description).toContain('Materiales académicos');
    });

    test('debe calcular fees estándar para materiales', () => {
      const payment = factory.buildPayment(mockData);

      // Fee estándar: 2.5% + $0.25 = $2.125
      expect(payment.processingFee).toBeCloseTo(2.125, 2);
      expect(payment.netAmount).toBeCloseTo(72.875, 2);
    });
  });

  describe('PaymentFactoryManager', () => {
    test('debe crear pago usando el factory apropiado', () => {
      const data = {
        enrollmentId: 'enrollment-123',
        userId: 'user-456',
        amount: 100.00,
        currency: 'USD',
        cardDetails: { cardType: 'Visa', last4: '4242', brand: 'visa', expiryMonth: 12, expiryYear: 2025 }
      };

      const payment = paymentFactoryManager.createPayment('credit_card', data);

      expect(payment.paymentMethod).toBe('credit_card');
      expect(payment.amount).toBe(100.00);
    });

    test('debe crear pago por método de pago', () => {
      const data = {
        enrollmentId: 'enrollment-123',
        userId: 'user-456',
        amount: 100.00,
        currency: 'USD',
        cardDetails: { cardType: 'Visa', last4: '4242', brand: 'visa', expiryMonth: 12, expiryYear: 2025 }
      };

      const payment = paymentFactoryManager.createPaymentByMethod('credit_card', data);

      expect(payment.paymentMethod).toBe('credit_card');
    });

    test('debe lanzar error para tipo de factory no encontrado', () => {
      const data = { enrollmentId: 'enrollment-123', userId: 'user-456', amount: 100.00 };

      expect(() => {
        paymentFactoryManager.createPayment('invalid_type', data);
      }).toThrow("Factory para tipo 'invalid_type' no encontrado");
    });

    test('debe lanzar error para método de pago no soportado', () => {
      const data = { enrollmentId: 'enrollment-123', userId: 'user-456', amount: 100.00 };

      expect(() => {
        paymentFactoryManager.createPaymentByMethod('invalid_method', data);
      }).toThrow("Método de pago 'invalid_method' no soportado");
    });

    test('debe crear pago de matrícula', () => {
      const data = {
        enrollmentId: 'enrollment-123',
        userId: 'user-456',
        amount: 500.00,
        currency: 'USD',
        semester: 'Fall 2024',
        academicYear: '2024-2025'
      };

      const payment = paymentFactoryManager.createTuitionPayment(data);

      expect(payment.metadata.paymentType).toBe('tuition');
      expect(payment.metadata.semester).toBe('Fall 2024');
    });

    test('debe crear pago de materiales', () => {
      const data = {
        enrollmentId: 'enrollment-123',
        userId: 'user-456',
        amount: 75.00,
        currency: 'USD',
        materials: ['Libro', 'Calculadora']
      };

      const payment = paymentFactoryManager.createMaterialsPayment(data);

      expect(payment.metadata.paymentType).toBe('materials');
      expect(payment.metadata.materials).toEqual(['Libro', 'Calculadora']);
    });

    test('debe obtener tipos disponibles', () => {
      const types = paymentFactoryManager.getAvailableTypes();

      expect(types).toContain('credit_card');
      expect(types).toContain('debit_card');
      expect(types).toContain('bank_transfer');
      expect(types).toContain('cash');
      expect(types).toContain('stripe');
      expect(types).toContain('tuition');
      expect(types).toContain('materials');
    });

    test('debe obtener información de fees', () => {
      const feeInfo = paymentFactoryManager.getFeeInfo('credit_card', 100.00);

      expect(feeInfo.amount).toBe(100.00);
      expect(feeInfo.processingFee).toBeCloseTo(3.20, 2);
      expect(feeInfo.netAmount).toBeCloseTo(96.80, 2);
      expect(feeInfo.feePercentage).toBeCloseTo(3.20, 2);
    });

    test('debe registrar nuevo factory', () => {
      class CustomPaymentFactory extends PaymentFactory {
        createPayment(data) {
          return {
            enrollmentId: data.enrollmentId,
            userId: data.userId,
            amount: data.amount,
            currency: data.currency,
            paymentMethod: 'custom',
            status: 'pending',
            processingFee: 0,
            netAmount: data.amount
          };
        }
      }

      paymentFactoryManager.registerFactory('custom', new CustomPaymentFactory());

      const payment = paymentFactoryManager.createPayment('custom', {
        enrollmentId: 'enrollment-123',
        userId: 'user-456',
        amount: 100.00,
        currency: 'USD'
      });

      expect(payment.paymentMethod).toBe('custom');
    });
  });

  describe('Validaciones de Factory Base', () => {
    test('debe validar datos requeridos', () => {
      const factory = new CreditCardPaymentFactory();

      expect(() => {
        factory.buildPayment({ userId: 'user-456', amount: 100.00 });
      }).toThrow('EnrollmentId es requerido');

      expect(() => {
        factory.buildPayment({ enrollmentId: 'enrollment-123', amount: 100.00 });
      }).toThrow('UserId es requerido');

      expect(() => {
        factory.buildPayment({ enrollmentId: 'enrollment-123', userId: 'user-456' });
      }).toThrow('Amount debe ser mayor a 0');

      expect(() => {
        factory.buildPayment({ enrollmentId: 'enrollment-123', userId: 'user-456', amount: -10 });
      }).toThrow('Amount debe ser mayor a 0');
    });

    test('debe establecer valores por defecto', () => {
      const factory = new CreditCardPaymentFactory();
      const data = {
        enrollmentId: 'enrollment-123',
        userId: 'user-456',
        amount: 100.00,
        cardDetails: { cardType: 'Visa', last4: '4242', brand: 'visa', expiryMonth: 12, expiryYear: 2025 }
      };

      const payment = factory.buildPayment(data);

      expect(payment.status).toBe('pending');
      expect(payment.currency).toBe('USD');
      expect(payment.metadata).toBeDefined();
    });
  });
});
