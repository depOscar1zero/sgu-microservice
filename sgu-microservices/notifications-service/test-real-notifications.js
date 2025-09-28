// Script para probar notificaciones reales del sistema SGU
const axios = require("axios");
require("dotenv").config({ path: "./.env" });

const NOTIFICATIONS_URL = `http://localhost:${
  process.env.PORT || 3006
}/api/notifications`;

console.log("🧪 Probando notificaciones reales del SGU...");
console.log(`📧 Servidor: ${NOTIFICATIONS_URL}`);

// Función para hacer requests HTTP
async function makeRequest(path, method = "GET", data = null) {
  try {
    const response = await axios({
      method,
      url: `${NOTIFICATIONS_URL}${path}`,
      data,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response ? error.response.data : error.message,
      status: error.response ? error.response.status : 500,
    };
  }
}

// Función para probar notificación de bienvenida
async function testWelcomeNotification() {
  console.log("\n🔍 1. Probando notificación de bienvenida...");

  const notificationData = {
    recipient: {
      userId: "user123",
      email: process.env.SMTP_USER, // Usar el email configurado
      name: "Usuario de Prueba SGU",
    },
    subject: "🎉 ¡Bienvenido al Sistema de Gestión Universitaria!",
    message: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🎉 ¡Bienvenido a SGU!</h2>
        <p>Hola <strong>Usuario de Prueba SGU</strong>,</p>
        <p>Tu cuenta ha sido creada exitosamente en el <strong>Sistema de Gestión Universitaria</strong>.</p>
        
        <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <h3>📋 Información de tu cuenta:</h3>
          <ul>
            <li><strong>ID de Estudiante:</strong> STU123456</li>
            <li><strong>Email:</strong> ${process.env.SMTP_USER}</li>
            <li><strong>Fecha de registro:</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
        </div>
        
        <p>Ahora puedes acceder al sistema y comenzar a gestionar tus cursos y pagos.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:3005" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            🚀 Acceder al Sistema
          </a>
        </div>
        
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un email automático del Sistema de Gestión Universitaria.
        </p>
      </div>
    `,
    type: "email",
    channel: "email",
    priority: "normal",
    category: "welcome",
    metadata: {
      templateId: "welcome_template",
      variables: {
        userName: "Usuario de Prueba SGU",
        studentId: "STU123456",
      },
    },
  };

  const result = await makeRequest("/", "POST", notificationData);

  if (result.success) {
    console.log("✅ Notificación de bienvenida enviada");
    console.log(`📧 ID: ${result.data.data._id}`);
    return result.data.data._id;
  } else {
    console.error("❌ Error enviando notificación:", result.error);
    return null;
  }
}

// Función para probar notificación de inscripción
async function testEnrollmentNotification() {
  console.log("\n🔍 2. Probando notificación de inscripción...");

  const notificationData = {
    recipient: {
      userId: "user123",
      email: process.env.SMTP_USER,
      name: "Usuario de Prueba SGU",
    },
    subject: "📚 Confirmación de Inscripción - MAT101",
    message: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">📚 ¡Inscripción Confirmada!</h2>
        <p>Hola <strong>Usuario de Prueba SGU</strong>,</p>
        <p>Tu inscripción al curso ha sido confirmada exitosamente.</p>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3>📖 Detalles del Curso:</h3>
          <ul>
            <li><strong>Curso:</strong> Matemáticas I</li>
            <li><strong>Código:</strong> MAT101</li>
            <li><strong>Horario:</strong> Lunes y Miércoles, 8:00 AM - 10:00 AM</li>
            <li><strong>Instructor:</strong> Dr. Juan Pérez</li>
            <li><strong>Créditos:</strong> 3</li>
            <li><strong>Semestre:</strong> 2025-1</li>
          </ul>
        </div>
        
        <p>¡Esperamos que tengas un excelente semestre!</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:3005/courses" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            📚 Ver Mis Cursos
          </a>
        </div>
        
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un email automático del Sistema de Gestión Universitaria.
        </p>
      </div>
    `,
    type: "email",
    channel: "email",
    priority: "high",
    category: "enrollment",
    metadata: {
      courseId: "MAT101",
      courseName: "Matemáticas I",
      courseCode: "MAT101",
      enrollmentId: "ENR123456",
      instructorName: "Dr. Juan Pérez",
      schedule: "Lunes y Miércoles, 8:00 AM - 10:00 AM",
    },
  };

  const result = await makeRequest("/", "POST", notificationData);

  if (result.success) {
    console.log("✅ Notificación de inscripción enviada");
    console.log(`📧 ID: ${result.data.data._id}`);
    return result.data.data._id;
  } else {
    console.error("❌ Error enviando notificación:", result.error);
    return null;
  }
}

// Función para probar notificación de pago
async function testPaymentNotification() {
  console.log("\n🔍 3. Probando notificación de pago...");

  const notificationData = {
    recipient: {
      userId: "user123",
      email: process.env.SMTP_USER,
      name: "Usuario de Prueba SGU",
    },
    subject: "💳 Confirmación de Pago Exitoso",
    message: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">💳 ¡Pago Confirmado!</h2>
        <p>Hola <strong>Usuario de Prueba SGU</strong>,</p>
        <p>Tu pago ha sido procesado exitosamente.</p>
        
        <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <h3>💰 Detalles del Pago:</h3>
          <ul>
            <li><strong>Monto:</strong> $150.00</li>
            <li><strong>Método:</strong> Tarjeta de Crédito</li>
            <li><strong>Referencia:</strong> PAY_123456789</li>
            <li><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</li>
            <li><strong>Estado:</strong> Completado</li>
          </ul>
        </div>
        
        <p>Gracias por tu pago. Tu inscripción está ahora completamente confirmada.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:3005/payments" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            💳 Ver Mis Pagos
          </a>
        </div>
        
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un email automático del Sistema de Gestión Universitaria.
        </p>
      </div>
    `,
    type: "email",
    channel: "email",
    priority: "normal",
    category: "payment",
    metadata: {
      paymentId: "PAY123456",
      amount: 150.0,
      paymentMethod: "Tarjeta de Crédito",
      stripePaymentIntentId: "PAY_123456789",
      dueDate: new Date().toISOString(),
      description: "Pago de inscripción MAT101",
    },
  };

  const result = await makeRequest("/", "POST", notificationData);

  if (result.success) {
    console.log("✅ Notificación de pago enviada");
    console.log(`📧 ID: ${result.data.data._id}`);
    return result.data.data._id;
  } else {
    console.error("❌ Error enviando notificación:", result.error);
    return null;
  }
}

// Función para obtener estadísticas
async function getStats() {
  console.log("\n🔍 4. Obteniendo estadísticas...");

  const result = await makeRequest("/stats");

  if (result.success) {
    console.log("✅ Estadísticas obtenidas:");
    console.log(`📊 Total notificaciones: ${result.data.data.total}`);
    console.log(`📊 Pendientes: ${result.data.data.pending}`);
    console.log(`📊 Enviadas: ${result.data.data.sent}`);
    console.log(`📊 Fallidas: ${result.data.data.failed}`);
  } else {
    console.error("❌ Error obteniendo estadísticas:", result.error);
  }
}

// Función principal
async function main() {
  try {
    console.log("🚀 Iniciando pruebas de notificaciones reales...\n");

    // Verificar que el servicio esté funcionando
    const healthResult = await makeRequest("/health");
    if (!healthResult.success) {
      console.error("❌ Notifications Service no está funcionando");
      console.error(
        "📝 Asegúrate de que el servicio esté ejecutándose en el puerto 3006"
      );
      process.exit(1);
    }

    console.log("✅ Notifications Service funcionando correctamente");

    // Probar notificaciones
    const welcomeId = await testWelcomeNotification();
    const enrollmentId = await testEnrollmentNotification();
    const paymentId = await testPaymentNotification();

    // Obtener estadísticas
    await getStats();

    console.log("\n🎉 ¡Pruebas de notificaciones completadas!");
    console.log("📧 Revisa tu bandeja de entrada para ver los emails");
    console.log("🔔 Las notificaciones están funcionando correctamente");

    if (welcomeId && enrollmentId && paymentId) {
      console.log("\n📋 IDs de notificaciones creadas:");
      console.log(`   - Bienvenida: ${welcomeId}`);
      console.log(`   - Inscripción: ${enrollmentId}`);
      console.log(`   - Pago: ${paymentId}`);
    }
  } catch (error) {
    console.error("❌ Error durante las pruebas:", error.message);
    process.exit(1);
  }
}

// Ejecutar pruebas
main();
