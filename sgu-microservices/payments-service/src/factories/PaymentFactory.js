/**
 * Factory Method Pattern - Payment Factory
 *
 * Este factory se encarga de crear diferentes tipos de pagos
 * según el método de pago y contexto especificado, siguiendo el patrón Factory Method.
 */

const Payment = require('../models/Payment');

/**
 * Clase base abstracta para factories de pagos
 */
class PaymentFactory {
  /**
   * Método factory abstracto - debe ser implementado por subclases
   * @param {Object} _data - Datos para crear el pago
   * @returns {Payment} - Instancia de pago
   */
  createPayment(_data) {
    throw new Error('createPayment debe ser implementado por subclases');
  }

  /**
   * Método template para el proceso de creación
   * @param {Object} data - Datos del pago
   * @returns {Payment} - Pago creado
   */
  buildPayment(data) {
    this.validateInputData(data);
    const payment = this.createPayment(data);
    this.validatePayment(payment);
    this.setDefaultValues(payment);
    this.calculateFees(payment);
    return payment;
  }

  /**
   * Validar datos de entrada
   * @param {Object} data - Datos de entrada
   */
  validateInputData(data) {
    if (!data.enrollmentId) {
      throw new Error('EnrollmentId es requerido');
    }
    if (!data.userId) {
      throw new Error('UserId es requerido');
    }
    if (!data.amount || data.amount <= 0) {
      throw new Error('Amount debe ser mayor a 0');
    }
  }

  /**
   * Validar el pago creado
   * @param {Payment} payment - Pago a validar
   */
  validatePayment(payment) {
    if (!payment.enrollmentId) {
      throw new Error('EnrollmentId es requerido');
    }
    if (!payment.userId) {
      throw new Error('UserId es requerido');
    }
    if (!payment.amount || payment.amount <= 0) {
      throw new Error('Amount debe ser mayor a 0');
    }
    if (!payment.paymentMethod) {
      throw new Error('PaymentMethod es requerido');
    }
  }

  /**
   * Establecer valores por defecto
   * @param {Payment} payment - Pago a configurar
   */
  setDefaultValues(payment) {
    payment.status = payment.status || 'pending';
    payment.currency = payment.currency || 'USD';
    payment.metadata = payment.metadata || {};
  }

  /**
   * Calcular fees según el método de pago
   * @param {Payment} payment - Pago a procesar
   */
  calculateFees(payment) {
    // Implementación base - las subclases pueden sobrescribir
    payment.processingFee = 0;
    payment.netAmount = payment.amount;
  }
}

/**
 * Factory para pagos con tarjeta de crédito
 */
class CreditCardPaymentFactory extends PaymentFactory {
  createPayment(data) {
    const { enrollmentId, userId, amount, currency, cardDetails } = data;

    return new Payment({
      enrollmentId,
      userId,
      amount,
      currency,
      paymentMethod: 'credit_card',
      status: 'pending',
      paymentMethodDetails: {
        cardType: cardDetails.cardType,
        last4: cardDetails.last4,
        brand: cardDetails.brand,
        expiryMonth: cardDetails.expiryMonth,
        expiryYear: cardDetails.expiryYear,
      },
      metadata: {
        paymentType: 'credit_card',
        cardDetails: {
          brand: cardDetails.brand,
          last4: cardDetails.last4,
        },
      },
    });
  }

  calculateFees(payment) {
    // Fee típico para tarjetas de crédito: 2.9% + $0.30
    const feePercentage = 0.029;
    const fixedFee = 0.3;

    payment.processingFee = payment.amount * feePercentage + fixedFee;
    payment.netAmount = payment.amount - payment.processingFee;
  }
}

/**
 * Factory para pagos con tarjeta de débito
 */
class DebitCardPaymentFactory extends PaymentFactory {
  createPayment(data) {
    const { enrollmentId, userId, amount, currency, cardDetails } = data;

    return new Payment({
      enrollmentId,
      userId,
      amount,
      currency,
      paymentMethod: 'debit_card',
      status: 'pending',
      paymentMethodDetails: {
        cardType: cardDetails.cardType,
        last4: cardDetails.last4,
        brand: cardDetails.brand,
        expiryMonth: cardDetails.expiryMonth,
        expiryYear: cardDetails.expiryYear,
      },
      metadata: {
        paymentType: 'debit_card',
        cardDetails: {
          brand: cardDetails.brand,
          last4: cardDetails.last4,
        },
      },
    });
  }

  calculateFees(payment) {
    // Fee típico para tarjetas de débito: 1.5% + $0.15
    const feePercentage = 0.015;
    const fixedFee = 0.15;

    payment.processingFee = payment.amount * feePercentage + fixedFee;
    payment.netAmount = payment.amount - payment.processingFee;
  }
}

/**
 * Factory para transferencias bancarias
 */
class BankTransferPaymentFactory extends PaymentFactory {
  createPayment(data) {
    const { enrollmentId, userId, amount, currency, bankDetails } = data;

    return new Payment({
      enrollmentId,
      userId,
      amount,
      currency,
      paymentMethod: 'bank_transfer',
      status: 'pending',
      paymentMethodDetails: {
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        routingNumber: bankDetails.routingNumber,
        accountType: bankDetails.accountType,
      },
      metadata: {
        paymentType: 'bank_transfer',
        bankDetails: {
          bankName: bankDetails.bankName,
          accountType: bankDetails.accountType,
        },
      },
    });
  }

  calculateFees(payment) {
    // Fee típico para transferencias bancarias: 0.5% + $0.10
    const feePercentage = 0.005;
    const fixedFee = 0.1;

    payment.processingFee = payment.amount * feePercentage + fixedFee;
    payment.netAmount = payment.amount - payment.processingFee;
  }
}

/**
 * Factory para pagos en efectivo
 */
class CashPaymentFactory extends PaymentFactory {
  createPayment(data) {
    const { enrollmentId, userId, amount, currency, cashDetails } = data;

    return new Payment({
      enrollmentId,
      userId,
      amount,
      currency,
      paymentMethod: 'cash',
      status: 'pending',
      paymentMethodDetails: {
        location: cashDetails.location,
        reference: cashDetails.reference,
        collectedBy: cashDetails.collectedBy,
      },
      metadata: {
        paymentType: 'cash',
        cashDetails: {
          location: cashDetails.location,
          reference: cashDetails.reference,
        },
      },
    });
  }

  calculateFees(payment) {
    // No hay fees para pagos en efectivo
    payment.processingFee = 0;
    payment.netAmount = payment.amount;
  }
}

/**
 * Factory para pagos con Stripe
 */
class StripePaymentFactory extends PaymentFactory {
  createPayment(data) {
    const { enrollmentId, userId, amount, currency, stripeDetails } = data;

    return new Payment({
      enrollmentId,
      userId,
      amount,
      currency,
      paymentMethod: 'stripe',
      status: 'pending',
      stripePaymentIntentId: stripeDetails.paymentIntentId,
      paymentMethodDetails: {
        stripePaymentMethodId: stripeDetails.paymentMethodId,
        stripeCustomerId: stripeDetails.customerId,
      },
      metadata: {
        paymentType: 'stripe',
        stripeDetails: {
          paymentIntentId: stripeDetails.paymentIntentId,
          customerId: stripeDetails.customerId,
        },
      },
    });
  }

  calculateFees(payment) {
    // Fee de Stripe: 2.9% + $0.30 para tarjetas, 0.8% para ACH
    const feePercentage = 0.029;
    const fixedFee = 0.3;

    payment.processingFee = payment.amount * feePercentage + fixedFee;
    payment.netAmount = payment.amount - payment.processingFee;
  }
}

/**
 * Factory para pagos de matrícula
 */
class TuitionPaymentFactory extends PaymentFactory {
  createPayment(data) {
    const { enrollmentId, userId, amount, currency, semester, academicYear } =
      data;

    return new Payment({
      enrollmentId,
      userId,
      amount,
      currency,
      paymentMethod: data.paymentMethod || 'credit_card',
      status: 'pending',
      metadata: {
        paymentType: 'tuition',
        semester,
        academicYear,
        description: `Matrícula - ${semester} ${academicYear}`,
      },
    });
  }

  calculateFees(payment) {
    // Fee reducido para matrícula: 1.5% + $0.20
    const feePercentage = 0.015;
    const fixedFee = 0.2;

    payment.processingFee = payment.amount * feePercentage + fixedFee;
    payment.netAmount = payment.amount - payment.processingFee;
  }
}

/**
 * Factory para pagos de libros/materiales
 */
class MaterialsPaymentFactory extends PaymentFactory {
  createPayment(data) {
    const { enrollmentId, userId, amount, currency, materials } = data;

    return new Payment({
      enrollmentId,
      userId,
      amount,
      currency,
      paymentMethod: data.paymentMethod || 'credit_card',
      status: 'pending',
      metadata: {
        paymentType: 'materials',
        materials: materials,
        description: `Materiales académicos - ${materials.join(', ')}`,
      },
    });
  }

  calculateFees(payment) {
    // Fee estándar para materiales: 2.5% + $0.25
    const feePercentage = 0.025;
    const fixedFee = 0.25;

    payment.processingFee = payment.amount * feePercentage + fixedFee;
    payment.netAmount = payment.amount - payment.processingFee;
  }
}

/**
 * Factory principal que maneja la creación de pagos
 * Implementa el patrón Factory Method
 */
class PaymentFactoryManager {
  constructor() {
    this.factories = {
      credit_card: new CreditCardPaymentFactory(),
      debit_card: new DebitCardPaymentFactory(),
      bank_transfer: new BankTransferPaymentFactory(),
      cash: new CashPaymentFactory(),
      stripe: new StripePaymentFactory(),
      tuition: new TuitionPaymentFactory(),
      materials: new MaterialsPaymentFactory(),
    };
  }

  /**
   * Crear pago usando el factory apropiado
   * @param {string} type - Tipo de pago
   * @param {Object} data - Datos para crear el pago
   * @returns {Payment} - Pago creado
   */
  createPayment(type, data) {
    const factory = this.factories[type];

    if (!factory) {
      throw new Error(`Factory para tipo '${type}' no encontrado`);
    }

    return factory.buildPayment(data);
  }

  /**
   * Crear pago basado en el método de pago
   * @param {string} paymentMethod - Método de pago
   * @param {Object} data - Datos para crear el pago
   * @returns {Payment} - Pago creado
   */
  createPaymentByMethod(paymentMethod, data) {
    const methodFactoryMap = {
      credit_card: 'credit_card',
      debit_card: 'debit_card',
      bank_transfer: 'bank_transfer',
      cash: 'cash',
      stripe: 'stripe',
    };

    const factoryType = methodFactoryMap[paymentMethod];
    if (!factoryType) {
      throw new Error(`Método de pago '${paymentMethod}' no soportado`);
    }

    return this.createPayment(factoryType, data);
  }

  /**
   * Crear pago de matrícula con método específico
   * @param {Object} data - Datos del pago de matrícula
   * @returns {Payment} - Pago de matrícula creado
   */
  createTuitionPayment(data) {
    return this.createPayment('tuition', data);
  }

  /**
   * Crear pago de materiales con método específico
   * @param {Object} data - Datos del pago de materiales
   * @returns {Payment} - Pago de materiales creado
   */
  createMaterialsPayment(data) {
    return this.createPayment('materials', data);
  }

  /**
   * Obtener tipos de pagos disponibles
   * @returns {Array<string>} - Tipos disponibles
   */
  getAvailableTypes() {
    return Object.keys(this.factories);
  }

  /**
   * Registrar un nuevo factory
   * @param {string} type - Tipo de pago
   * @param {PaymentFactory} factory - Factory a registrar
   */
  registerFactory(type, factory) {
    if (!(factory instanceof PaymentFactory)) {
      throw new Error('Factory debe extender de PaymentFactory');
    }
    this.factories[type] = factory;
  }

  /**
   * Obtener información de fees para un tipo de pago
   * @param {string} type - Tipo de pago
   * @param {number} amount - Monto del pago
   * @returns {Object} - Información de fees
   */
  getFeeInfo(type, amount) {
    const factory = this.factories[type];
    if (!factory) {
      throw new Error(`Factory para tipo '${type}' no encontrado`);
    }

    // Crear un pago temporal para calcular fees
    const tempPayment = { amount, currency: 'USD' };
    factory.calculateFees(tempPayment);

    return {
      amount,
      processingFee: tempPayment.processingFee,
      netAmount: tempPayment.netAmount,
      feePercentage: (tempPayment.processingFee / amount) * 100,
    };
  }
}

// Instancia singleton del manager
const paymentFactoryManager = new PaymentFactoryManager();

module.exports = {
  PaymentFactory,
  CreditCardPaymentFactory,
  DebitCardPaymentFactory,
  BankTransferPaymentFactory,
  CashPaymentFactory,
  StripePaymentFactory,
  TuitionPaymentFactory,
  MaterialsPaymentFactory,
  PaymentFactoryManager,
  paymentFactoryManager,
};
