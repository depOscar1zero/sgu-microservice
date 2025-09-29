// Script de prueba manual de integración para el sistema SGU
const axios = require("axios");

const API_BASE_URL = "http://localhost:3000"; // API Gateway

async function testManualIntegration() {
  console.log("🧪 PRUEBA MANUAL DE INTEGRACIÓN DEL SISTEMA SGU");
  console.log("==============================================\n");

  try {
    // 1. Verificar API Gateway
    console.log("🔍 PASO 1: Verificando API Gateway...");
    const gatewayResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log(`   ✅ API Gateway: ${gatewayResponse.data.status}\n`);

    // 2. Registrar un usuario
    console.log("👤 PASO 2: Registrando usuario...");
    const user = {
      firstName: "Test",
      lastName: "User",
      email: "test.user@example.com",
      password: "TestPassword123!",
      studentId: "STU999",
      department: "Computer Science",
    };

    let authToken = null;
    try {
      const registerResponse = await axios.post(
        `${API_BASE_URL}/api/auth/register`,
        user
      );
      console.log(
        `   ✅ Usuario registrado: ${user.firstName} ${user.lastName}`
      );
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log("   ⚠️  Usuario ya existe, continuando...");
      } else {
        console.log(`   ❌ Error registrando usuario: ${error.message}`);
      }
    }

    // 3. Iniciar sesión
    console.log("\n🔐 PASO 3: Iniciando sesión...");
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: user.email,
        password: user.password,
      });
      authToken = loginResponse.data.token;
      console.log(
        `   ✅ Sesión iniciada: ${
          loginResponse.data.user?.firstName || "Usuario"
        }`
      );
    } catch (error) {
      console.log(`   ❌ Error en login: ${error.message}`);
      return;
    }

    // 4. Listar cursos existentes
    console.log("\n📚 PASO 4: Listando cursos existentes...");
    try {
      const coursesResponse = await axios.get(`${API_BASE_URL}/api/courses`);
      console.log(
        `   ✅ Cursos disponibles: ${coursesResponse.data.total || 0}`
      );
      if (coursesResponse.data.data && coursesResponse.data.data.length > 0) {
        coursesResponse.data.data.forEach((course, index) => {
          console.log(
            `      ${index + 1}. ${course.name} (${course.code}) - $${
              course.price
            }`
          );
        });
      }
    } catch (error) {
      console.log(`   ❌ Error listando cursos: ${error.message}`);
    }

    // 5. Crear un nuevo curso
    console.log("\n📝 PASO 5: Creando nuevo curso...");
    const newCourse = {
      code: "TEST101",
      name: "Test Course",
      description: "A test course for integration testing",
      credits: 3,
      department: "Computer Science",
      professor: "Dr. Test Professor",
      capacity: 20,
      semester: "Fall",
      year: 2024,
      price: 300.0,
      schedule: [{ day: "Monday", time: "09:00-11:00", room: "Test Room" }],
    };

    let courseId = null;
    try {
      const courseResponse = await axios.post(
        `${API_BASE_URL}/api/courses`,
        newCourse,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      courseId = courseResponse.data.id;
      console.log(`   ✅ Curso creado: ${newCourse.name} (ID: ${courseId})`);
    } catch (error) {
      console.log(`   ❌ Error creando curso: ${error.message}`);
    }

    // 6. Inscribirse al curso
    console.log("\n📋 PASO 6: Inscribiéndose al curso...");
    let enrollmentId = null;
    try {
      const enrollmentResponse = await axios.post(
        `${API_BASE_URL}/api/enrollments`,
        {
          courseId: courseId,
          studentId: user.studentId,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      enrollmentId = enrollmentResponse.data.id;
      console.log(`   ✅ Inscripción creada: ${enrollmentId}`);
    } catch (error) {
      console.log(`   ❌ Error en inscripción: ${error.message}`);
    }

    // 7. Procesar pago
    console.log("\n💳 PASO 7: Procesando pago...");
    let paymentId = null;
    try {
      const paymentResponse = await axios.post(
        `${API_BASE_URL}/api/payments`,
        {
          enrollmentId: enrollmentId,
          amount: newCourse.price,
          currency: "USD",
          paymentMethod: "card",
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      paymentId = paymentResponse.data.id;
      console.log(`   ✅ Pago procesado: ${paymentId} - $${newCourse.price}`);
    } catch (error) {
      console.log(`   ❌ Error procesando pago: ${error.message}`);
    }

    // 8. Verificar notificaciones
    console.log("\n📧 PASO 8: Verificando notificaciones...");
    try {
      const notificationsResponse = await axios.get(
        `${API_BASE_URL}/api/notifications`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      console.log(
        `   ✅ Notificaciones encontradas: ${
          notificationsResponse.data.length || 0
        }`
      );
    } catch (error) {
      console.log(
        `   ⚠️  No se pudieron verificar notificaciones: ${error.message}`
      );
    }

    // 9. Generar reporte final
    console.log("\n📊 REPORTE FINAL:");
    console.log("=================");
    console.log(
      `   👤 Usuario: ${user.firstName} ${user.lastName} (${user.email})`
    );
    console.log(`   🔑 Token: ${authToken ? "Generado" : "No generado"}`);
    console.log(`   📚 Curso: ${newCourse.name} (${newCourse.code})`);
    console.log(`   📝 Inscripción: ${enrollmentId || "No creada"}`);
    console.log(`   💳 Pago: ${paymentId || "No procesado"}`);
    console.log(`   💰 Monto: $${newCourse.price}`);

    console.log("\n🎉 ¡PRUEBA MANUAL DE INTEGRACIÓN COMPLETADA!");
  } catch (error) {
    console.error("❌ Error en la prueba manual:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
  }
}

// Ejecutar prueba
testManualIntegration();
