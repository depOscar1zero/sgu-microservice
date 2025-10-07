const axios = require('axios');

class AuthServiceClient {
  constructor() {
    this.baseURL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    console.log('AuthServiceClient inicializado con URL:', this.baseURL);
  }

  async verifyToken(token) {
    try {
      console.log('=== DEBUG: verifyToken ===');
      console.log('Token presente:', token ? 'SÍ' : 'NO');

      if (!token) {
        console.error('ERROR: Token no proporcionado');
        return {
          success: false,
          error: 'Token de autorización requerido'
        };
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      };

      console.log('Verificando token con Auth Service...');

      const response = await axios.get(
        `${this.baseURL}/api/users/profile`,
        config
      );

      console.log('Token verificado exitosamente:', {
        status: response.status,
        userId: response.data?.data?.id || response.data?.id
      });

      return {
        success: true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      console.error('=== ERROR en verifyToken ===');
      console.error('Error completo:', error.message);
      
      if (error.response) {
        console.error('Status de respuesta:', error.response.status);
        console.error('Data de respuesta:', error.response.data);
      }

      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Token inválido'
      };
    }
  }
}

class EnrollmentServiceClient {
  constructor() {
    this.baseURL = process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3002';
    console.log('EnrollmentServiceClient inicializado con URL:', this.baseURL);
  }

  async getEnrollmentById(enrollmentId, token) {
    try {
      console.log('=== DEBUG: getEnrollmentById ===');
      console.log('EnrollmentId:', enrollmentId);
      console.log('Token presente:', token ? 'SÍ' : 'NO');
      console.log('URL completa:', `${this.baseURL}/api/enrollments/${enrollmentId}`);

      if (!token) {
        console.error('ERROR: Token no proporcionado');
        return {
          success: false,
          error: 'Token de autorización requerido'
        };
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      };

      console.log('Headers de la petición:', config.headers);

      const response = await axios.get(
        `${this.baseURL}/api/enrollments/${enrollmentId}`,
        config
      );

      console.log('Respuesta exitosa del Enrollment Service:', {
        status: response.status,
        enrollmentId: response.data?.id,
        paymentStatus: response.data?.paymentStatus
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('=== ERROR en getEnrollmentById ===');
      console.error('URL llamada:', `${this.baseURL}/api/enrollments/${enrollmentId}`);
      console.error('Error completo:', error.message);
      
      if (error.response) {
        console.error('Status de respuesta:', error.response.status);
        console.error('Data de respuesta:', error.response.data);
        console.error('Headers de respuesta:', error.response.headers);
      } else if (error.request) {
        console.error('Error de request (sin respuesta):', error.request);
      }

      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error desconocido'
      };
    }
  }

  static async checkPaymentRequired(enrollmentId, token) {
    try {
      console.log('=== DEBUG: checkPaymentRequired ===');
      console.log('EnrollmentId recibido:', enrollmentId);
      console.log('Token recibido:', token ? 'SÍ' : 'NO');

      const client = new EnrollmentServiceClient();
      const enrollmentResult = await client.getEnrollmentById(enrollmentId, token);
      
      if (!enrollmentResult.success) {
        console.error('Error obteniendo enrollment:', enrollmentResult.error);
        return enrollmentResult;
      }

      const enrollment = enrollmentResult.data;
      console.log('Enrollment obtenido:', {
        id: enrollment.id,
        status: enrollment.status,
        paymentStatus: enrollment.paymentStatus
      });

      const requiresPayment = enrollment.paymentStatus === 'Pending' && 
                            ['Confirmed', 'Pending'].includes(enrollment.status);
      
      const canProcessPayment = enrollment.paymentStatus === 'Pending';

      console.log('Resultado del análisis:', {
        requiresPayment,
        canProcessPayment
      });

      return {
        success: true,
        data: {
          ...enrollment,
          requiresPayment,
          canProcessPayment
        }
      };
    } catch (error) {
      console.error('=== ERROR en checkPaymentRequired ===');
      console.error('Error:', error.message);
      return {
        success: false,
        error: 'Error verificando si la inscripción requiere pago'
      };
    }
  }
}

module.exports = {
  AuthServiceClient,
  EnrollmentServiceClient
};