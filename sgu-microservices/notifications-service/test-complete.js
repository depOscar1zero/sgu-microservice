// Script completo de prueba del Notifications Service
require("dotenv").config({ path: "./.env" });
const app = require("./src/app");
const http = require("http");

const PORT = process.env.PORT || 3006;

console.log("🧪 Iniciando prueba completa del Notifications Service...");
console.log(`📧 Puerto: ${PORT}`);

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log("✅ Servidor iniciado correctamente");
  console.log(`🌐 URL: http://localhost:${PORT}`);

  // Esperar un momento y hacer pruebas
  setTimeout(async () => {
    console.log("\n🧪 Iniciando pruebas de notificaciones...");

    try {
      // 1. Health Check
      console.log("\n🔍 1. Probando Health Check...");
      const healthResult = await makeRequest("/api/notifications/health");
      console.log("✅ Health Check:", healthResult.data);

      // 2. Estadísticas
      console.log("\n📊 2. Probando estadísticas...");
      const statsResult = await makeRequest("/api/notifications/stats");
      console.log("✅ Estadísticas:", statsResult.data);

      // 3. Crear notificación de bienvenida
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

      // 4. Crear notificación de inscripción
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

      // 5. Crear notificación de pago
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

      // 6. Obtener notificaciones del usuario
      console.log("\n📋 6. Obteniendo notificaciones del usuario...");
      const userNotifications = await makeRequest(
        "/api/notifications/user/user123"
      );
      console.log("✅ Notificaciones del usuario:", userNotifications.data);

      // 7. Verificar estadísticas finales
      console.log("\n📊 7. Verificando estadísticas finales...");
      const finalStats = await makeRequest("/api/notifications/stats");
      console.log("✅ Estadísticas finales:", finalStats.data);

      console.log(
        "\n🎉 ¡Todas las pruebas de notificaciones completadas exitosamente!"
      );
      console.log("📧 El Notifications Service está funcionando correctamente");

      // Cerrar servidor
      server.close(() => {
        console.log("🔌 Servidor cerrado");
        process.exit(0);
      });
    } catch (error) {
      console.error("❌ Error en las pruebas:", error.message);
      server.close(() => {
        process.exit(1);
      });
    }
  }, 2000);
});

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

server.on("error", (err) => {
  console.error("❌ Error del servidor:", err.message);
  process.exit(1);
});
