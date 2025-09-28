// test-service-communication.js
// Script para probar la comunicación entre Payments Service y Enrollment Service

const axios = require('axios');

// URLs de los servicios
const AUTH_SERVICE_URL = 'http://localhost:3001';
const ENROLLMENT_SERVICE_URL = 'http://localhost:3002';
const PAYMENTS_SERVICE_URL = 'http://localhost:3003';

async function testServiceCommunication() {
  console.log('=== PRUEBA DE COMUNICACIÓN ENTRE SERVICIOS ===\n');

  try {
    // Paso 1: Obtener token de autenticación
    console.log('1. Obteniendo token de autenticación...');
    
    const loginResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
      email: 'student@university.edu',
      password: 'password123'
    });

    if (!loginResponse.data.success || !loginResponse.data.token) {
      throw new Error('No se pudo obtener el token de autenticación');
    }

    const token = loginResponse.data.token;
    console.log('✅ Token obtenido exitosamente');
    console.log('Token (primeros 20 chars):', token.substring(0, 20) + '...\n');

    // Paso 2: Probar acceso directo al Enrollment Service
    console.log('2. Probando acceso directo al Enrollment Service...');
    
    const enrollmentId = 'enrollment-123';
    const directEnrollmentResponse = await axios.get(
      `${ENROLLMENT_SERVICE_URL}/api/enrollments/${enrollmentId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Acceso directo al Enrollment Service exitoso');
    console.log('Datos del enrollment:', {
      id: directEnrollmentResponse.data.id,
      status: directEnrollmentResponse.data.status,
      paymentStatus: directEnrollmentResponse.data.paymentStatus
    });
    console.log();

    // Paso 3: Probar la creación de pago (que internamente llama al Enrollment Service)
    console.log('3. Probando creación de pago a través del Payments Service...');
    
    const paymentData = {
      enrollmentId: enrollmentId,
      amount: 1500.00,
      paymentMethod: 'credit_card'
    };

    console.log('Datos del pago a crear:', paymentData);
    console.log('Token que se enviará:', token ? 'SÍ' : 'NO');

    const paymentResponse = await axios.post(
      `${PAYMENTS_SERVICE_URL}/api/payments`,
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Pago creado exitosamente a través del Payments Service');
    console.log('Respuesta del pago:', {
      success: paymentResponse.data.success,
      paymentId: paymentResponse.data.data?.id,
      status: paymentResponse.data.data?.status
    });

    console.log('\n🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE');

  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:');
    console.error('Mensaje:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('URL llamada:', error.config?.url);
      console.error('Headers enviados:', error.config?.headers);
    } else if (error.request) {
      console.error('Error de request (sin respuesta)');
      console.error('URL:', error.config?.url);
    }

    console.log('\n🔍 SUGERENCIAS DE DEBUGGING:');
    console.log('1. Verificar que todos los servicios estén ejecutándose');
    console.log('2. Verificar las URLs de los servicios');
    console.log('3. Verificar que el token se esté pasando correctamente');
    console.log('4. Revisar los logs de cada servicio para más detalles');
  }
}

// Función auxiliar para verificar que los servicios estén disponibles
async function checkServiceHealth() {
  console.log('=== VERIFICACIÓN DE SALUD DE SERVICIOS ===\n');
  
  const services = [
    { name: 'Auth Service', url: `${AUTH_SERVICE_URL}/health` },
    { name: 'Enrollment Service', url: `${ENROLLMENT_SERVICE_URL}/health` },
    { name: 'Payments Service', url: `${PAYMENTS_SERVICE_URL}/health` }
  ];

  for (const service of services) {
    try {
      await axios.get(service.url, { timeout: 3000 });
      console.log(`✅ ${service.name} - DISPONIBLE`);
    } catch (error) {
      console.log(`❌ ${service.name} - NO DISPONIBLE (${service.url})`);
    }
  }
  console.log();
}

// Ejecutar las pruebas
async function runTests() {
  await checkServiceHealth();
  await testServiceCommunication();
}

// Si el script se ejecuta directamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testServiceCommunication,
  checkServiceHealth
};