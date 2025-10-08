const { EnrollmentServiceClient } = require('../services/externalServices');

const extractTokenFromHeader = authHeader => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
};

const createPayment = async (req, res) => {
  try {
    console.log('=== DEBUG: createPayment iniciado ===');

    const { enrollmentId, amount, paymentMethod } = req.body;
    console.log('Datos recibidos:', { enrollmentId, amount, paymentMethod });

    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    console.log('Authorization header:', authHeader);
    console.log('Token extraído:', token ? 'SÍ' : 'NO');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de autorización requerido',
      });
    }

    if (!enrollmentId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos: enrollmentId, amount, paymentMethod',
      });
    }

    console.log('Verificando si la inscripción requiere pago...');

    const enrollmentCheck = await EnrollmentServiceClient.checkPaymentRequired(
      enrollmentId,
      token
    );

    console.log('Resultado de la verificación:', enrollmentCheck);

    if (!enrollmentCheck.success) {
      console.error('Error verificando enrollment:', enrollmentCheck.error);
      return res.status(400).json({
        success: false,
        error: enrollmentCheck.error,
      });
    }

    const enrollment = enrollmentCheck.data;

    if (!enrollment.requiresPayment) {
      return res.status(400).json({
        success: false,
        error: 'La inscripción no requiere pago o ya ha sido pagada',
      });
    }

    if (!enrollment.canProcessPayment) {
      return res.status(400).json({
        success: false,
        error:
          'No se puede procesar el pago para esta inscripción en su estado actual',
      });
    }

    console.log('Creando nuevo pago...');

    const payment = {
      id: Math.random().toString(36).substr(2, 9),
      enrollmentId,
      amount: parseFloat(amount),
      paymentMethod,
      status: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Pago creado:', payment);

    console.log('Procesando pago...');

    const paymentProcessed = true;

    if (paymentProcessed) {
      payment.status = 'Completed';
      payment.processedAt = new Date();
      payment.updatedAt = new Date();

      console.log('Pago procesado exitosamente:', {
        paymentId: payment.id,
        status: payment.status,
      });

      res.status(201).json({
        success: true,
        message: 'Pago procesado exitosamente',
        data: payment,
      });
    } else {
      payment.status = 'Failed';
      payment.updatedAt = new Date();

      console.log('Pago falló');

      res.status(400).json({
        success: false,
        error: 'Error procesando el pago',
        data: payment,
      });
    }
  } catch (error) {
    console.error('=== ERROR en createPayment ===');
    console.error('Error completo:', error);

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Buscando pago con ID:', id);

    const mockPayment = {
      id,
      enrollmentId: 'enrollment-123',
      amount: 1500.0,
      paymentMethod: 'credit_card',
      status: 'Completed',
      createdAt: new Date('2024-01-15'),
      processedAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    };

    res.json({
      success: true,
      data: mockPayment,
    });
  } catch (error) {
    console.error('Error obteniendo pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

const getPaymentsByEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    console.log('Buscando pagos para enrollment:', enrollmentId);

    const mockPayments = [
      {
        id: 'payment-1',
        enrollmentId,
        amount: 1500.0,
        paymentMethod: 'credit_card',
        status: 'Completed',
        createdAt: new Date('2024-01-15'),
        processedAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
    ];

    res.json({
      success: true,
      data: mockPayments,
    });
  } catch (error) {
    console.error('Error obteniendo pagos por enrollment:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

module.exports = {
  createPayment,
  getPaymentById,
  getPaymentsByEnrollment,
};
