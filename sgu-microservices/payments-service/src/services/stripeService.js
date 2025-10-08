const Stripe = require('stripe');
require('dotenv').config();

// Inicializar Stripe (usaremos claves de test por defecto)
const stripe = Stripe(
  process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development'
);

/**
 * Servicio para interactuar con Stripe
 */
class StripeService {
  /**
   * Crear un Payment Intent
   */
  static async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe usa centavos
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        data: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
        },
      };
    } catch (error) {
      console.error('Error creando Payment Intent:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  /**
   * Confirmar un Payment Intent
   */
  static async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
        }
      );

      return {
        success: true,
        data: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          charges: paymentIntent.charges?.data || [],
        },
      };
    } catch (error) {
      console.error('Error confirmando Payment Intent:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  /**
   * Obtener información de un Payment Intent
   */
  static async getPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId,
        {
          expand: ['charges'],
        }
      );

      return {
        success: true,
        data: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          charges: paymentIntent.charges?.data || [],
          metadata: paymentIntent.metadata || {},
        },
      };
    } catch (error) {
      console.error('Error obteniendo Payment Intent:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  /**
   * Cancelar un Payment Intent
   */
  static async cancelPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

      return {
        success: true,
        data: {
          id: paymentIntent.id,
          status: paymentIntent.status,
        },
      };
    } catch (error) {
      console.error('Error cancelando Payment Intent:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  /**
   * Crear un reembolso
   */
  static async createRefund(chargeId, amount = null, reason = null) {
    try {
      const refundData = { charge: chargeId };

      if (amount) refundData.amount = Math.round(amount * 100);
      if (reason) refundData.reason = reason;

      const refund = await stripe.refunds.create(refundData);

      return {
        success: true,
        data: {
          id: refund.id,
          amount: refund.amount / 100,
          currency: refund.currency,
          status: refund.status,
          reason: refund.reason,
        },
      };
    } catch (error) {
      console.error('Error creando reembolso:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  /**
   * Crear cliente en Stripe
   */
  static async createCustomer(email, name, metadata = {}) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata,
      });

      return {
        success: true,
        data: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
        },
      };
    } catch (error) {
      console.error('Error creando cliente:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  /**
   * Verificar webhook de Stripe
   */
  static verifyWebhookSignature(payload, signature, secret) {
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, secret);
      return {
        success: true,
        event,
      };
    } catch (error) {
      console.error('Error verificando webhook:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Simular un pago exitoso (para desarrollo sin Stripe real)
   */
  static async simulateSuccessfulPayment(
    amount,
    currency = 'usd',
    metadata = {}
  ) {
    // Para desarrollo cuando no tenemos claves reales de Stripe
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.STRIPE_SECRET_KEY === 'sk_test_dummy_key_for_development'
    ) {
      return {
        success: true,
        data: {
          id: `pi_simulated_${Date.now()}`,
          clientSecret: `pi_simulated_${Date.now()}_secret`,
          amount,
          currency,
          status: 'succeeded',
          charges: [
            {
              id: `ch_simulated_${Date.now()}`,
              amount: amount * 100,
              currency,
              payment_method_details: {
                card: {
                  brand: 'visa',
                  last4: '4242',
                },
              },
              balance_transaction: {
                fee: Math.round(amount * 0.029 * 100), // 2.9% fee simulado
                net: Math.round(amount * 0.971 * 100),
              },
            },
          ],
        },
      };
    }

    // Si hay claves reales, usar el método normal
    return this.createPaymentIntent(amount, currency, metadata);
  }

  /**
   * Obtener tarifas de Stripe para un país
   */
  static getStripeFees(country = 'US') {
    const fees = {
      US: { percentage: 2.9, fixed: 0.3 },
      MX: { percentage: 3.6, fixed: 3.0 },
      EU: { percentage: 1.4, fixed: 0.25 },
    };

    return fees[country] || fees.US;
  }

  /**
   * Calcular fee de Stripe
   */
  static calculateStripeFee(amount, country = 'US') {
    const { percentage, fixed } = this.getStripeFees(country);
    return (amount * percentage) / 100 + fixed;
  }

  /**
   * Formatear errores de Stripe para el usuario
   */
  static formatStripeError(error) {
    const errorMessages = {
      card_declined: 'Tu tarjeta fue rechazada. Intenta con otra tarjeta.',
      expired_card: 'Tu tarjeta ha expirado. Usa una tarjeta válida.',
      insufficient_funds: 'No tienes fondos suficientes. Verifica tu saldo.',
      incorrect_cvc: 'El código CVC es incorrecto.',
      incorrect_number: 'El número de tarjeta es incorrecto.',
      invalid_expiry_month: 'El mes de expiración es inválido.',
      invalid_expiry_year: 'El año de expiración es inválido.',
      processing_error: 'Error procesando el pago. Intenta de nuevo.',
      rate_limit: 'Demasiadas peticiones. Espera un momento.',
    };

    return (
      errorMessages[error.code] || error.message || 'Error procesando el pago'
    );
  }
}

module.exports = StripeService;
