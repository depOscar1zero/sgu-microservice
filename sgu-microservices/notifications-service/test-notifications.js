// Script de prueba para envío de notificaciones
const http = require("http");

const PORT = 3006;
const BASE_URL = `http://localhost:${PORT}`;

console.log("🧪 Probando envío de notificaciones...");
console.log(`📧 Servidor: ${BASE_URL}`);

// Función para hacer requests HTTP
function makeRequest(path, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: PORT,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (err) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Función principal de pruebas
async function testNotifications() {
  try {
    console.log("\n🔍 1. Probando Health Check...");
    const healthResult = await makeRequest("/api/notifications/health");
    console.log("✅ Health Check:", healthResult.data);

    console.log("\n📊 2. Probando estadísticas...");
    const statsResult = await makeRequest("/api/notifications/stats");
    console.log("✅ Estadísticas:", statsResult.data);

    console.log("\n📧 3. Creando notificación de bienvenida...");
    const welcomeNotification = {
      recipient: {
        userId: "user123",
        email: "test@example.com",
        name: "Usuario de Prueba",
      },
      subject: "¡Bienvenido al SGU!",
      message:
        "<h2>¡Bienvenido!</h2><p>Gracias por registrarte en el Sistema de Gestión Universitaria.</p>",
      type: "email",
      channel: "email",
      priority: "normal",
      category: "welcome",
      metadata: {
        templateId: "welcome_template",
        variables: {
          userName: "Usuario de Prueba",
          studentId: "STU123456",
        },
      },
    };

    const createResult = await makeRequest(
      "/api/notifications/",
      "POST",
      welcomeNotification
    );
    console.log("✅ Notificación creada:", createResult.data);

    console.log("\n📧 4. Creando notificación de inscripción...");
    const enrollmentNotification = {
      recipient: {
        userId: "user123",
        email: "test@example.com",
        name: "Usuario de Prueba",
      },
      subject: "Confirmación de Inscripción - MAT101",
      message:
        "<h2>Inscripción Confirmada</h2><p>Tu inscripción al curso MAT101 ha sido confirmada.</p>",
      type: "email",
      channel: "email",
      priority: "high",
      category: "enrollment",
      metadata: {
        courseId: "MAT101",
        courseName: "Matemáticas I",
        enrollmentId: "ENR123456",
      },
    };

    const enrollmentResult = await makeRequest(
      "/api/notifications/",
      "POST",
      enrollmentNotification
    );
    console.log("✅ Notificación de inscripción:", enrollmentResult.data);

    console.log("\n📧 5. Creando notificación de pago...");
    const paymentNotification = {
      recipient: {
        userId: "user123",
        email: "test@example.com",
        name: "Usuario de Prueba",
      },
      subject: "Recordatorio de Pago Pendiente",
      message:
        "<h2>Pago Pendiente</h2><p>Tienes un pago de $150.00 pendiente.</p>",
      type: "email",
      channel: "email",
      priority: "urgent",
      category: "payment",
      metadata: {
        paymentId: "PAY123456",
        amount: 150.0,
        dueDate: "2025-10-15",
      },
    };

    const paymentResult = await makeRequest(
      "/api/notifications/",
      "POST",
      paymentNotification
    );
    console.log("✅ Notificación de pago:", paymentResult.data);

    console.log("\n📋 6. Obteniendo notificaciones del usuario...");
    const userNotifications = await makeRequest(
      "/api/notifications/user/user123"
    );
    console.log("✅ Notificaciones del usuario:", userNotifications.data);

    console.log("\n📊 7. Verificando estadísticas finales...");
    const finalStats = await makeRequest("/api/notifications/stats");
    console.log("✅ Estadísticas finales:", finalStats.data);

    console.log(
      "\n🎉 ¡Todas las pruebas de notificaciones completadas exitosamente!"
    );
  } catch (error) {
    console.error("❌ Error en las pruebas:", error.message);
  }
}

// Ejecutar pruebas
testNotifications();
