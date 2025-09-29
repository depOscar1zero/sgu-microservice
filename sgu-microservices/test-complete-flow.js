// Script de prueba del flujo completo del sistema SGU
const axios = require("axios");

const API_BASE_URL = "http://localhost:3000"; // API Gateway

async function testCompleteFlow() {
  console.log("🧪 PRUEBA DEL FLUJO COMPLETO DEL SISTEMA SGU");
  console.log("==========================================\n");

  try {
    // 1. Verificar que todos los servicios estén funcionando
    console.log("🔍 PASO 1: Verificando servicios...");
    await verifyAllServices();
    console.log("✅ Todos los servicios están funcionando\n");

    // 2. Usar usuario existente para login
    console.log("👤 PASO 2: Usando usuario existente...");
    const existingUser = {
      email: "juan.perez@test.com",
      password: "TestPassword123!",
    };

    let authToken = null;
    try {
      const loginResponse = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        existingUser
      );
      authToken = loginResponse.data.token;
      console.log(
        `   ✅ Login exitoso: ${
          loginResponse.data.user?.firstName || "Usuario"
        }`
      );
      console.log(`   🔑 Token generado: ${authToken ? "Sí" : "No"}\n`);
    } catch (error) {
      console.log(`   ❌ Error en login: ${error.message}`);
      return;
    }

    // 3. Listar cursos disponibles
    console.log("📚 PASO 3: Listando cursos disponibles...");
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
      console.log(`   ❌ Error obteniendo cursos: ${error.message}`);
    }

    // 4. Crear un nuevo curso
    console.log("\n📝 PASO 4: Creando nuevo curso...");
    const newCourse = {
      code: "FLOW101",
      name: "Complete Flow Test Course",
      description: "A course for testing the complete flow",
      credits: 3,
      department: "Computer Science",
      professor: "Dr. Flow Test",
      capacity: 20,
      semester: "Fall",
      year: 2024,
      price: 300.0,
      schedule: [{ day: "Monday", time: "10:00-12:00", room: "Flow Lab" }],
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

    if (!courseId) {
      console.log("   ❌ No se pudo crear el curso, terminando prueba");
      return;
    }

    // 5. Inscribirse al curso
    console.log("\n📋 PASO 5: Inscribiéndose al curso...");
    let enrollmentId = null;
    try {
      const enrollmentResponse = await axios.post(
        `${API_BASE_URL}/api/enrollments`,
        {
          courseId: courseId,
          studentId: "STU001",
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      enrollmentId = enrollmentResponse.data.id;
      console.log(`   ✅ Inscripción creada: ${enrollmentId}`);
    } catch (error) {
      console.log(`   ❌ Error en inscripción: ${error.message}`);
      if (error.response) {
        console.log(`   📊 Status: ${error.response.status}`);
        console.log(
          `   📄 Data: ${JSON.stringify(error.response.data, null, 2)}`
        );
      }
    }

    if (!enrollmentId) {
      console.log("   ❌ No se pudo crear la inscripción, terminando prueba");
      return;
    }

    // 6. Procesar pago
    console.log("\n💳 PASO 6: Procesando pago...");
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
      if (error.response) {
        console.log(`   📊 Status: ${error.response.status}`);
        console.log(
          `   📄 Data: ${JSON.stringify(error.response.data, null, 2)}`
        );
      }
    }

    // 7. Verificar notificaciones
    console.log("\n📧 PASO 7: Verificando notificaciones...");
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

    // 8. Generar reporte final
    console.log("\n📊 REPORTE FINAL:");
    console.log("=================");
    console.log(`   👤 Usuario: ${existingUser.email}`);
    console.log(`   🔑 Token: ${authToken ? "Generado" : "No generado"}`);
    console.log(`   📚 Curso: ${newCourse.name} (${newCourse.code})`);
    console.log(`   📝 Inscripción: ${enrollmentId || "No creada"}`);
    console.log(`   💳 Pago: ${paymentId || "No procesado"}`);
    console.log(`   💰 Monto: $${newCourse.price}`);

    console.log("\n🎉 ¡PRUEBA DEL FLUJO COMPLETO COMPLETADA!");
  } catch (error) {
    console.error("❌ Error en la prueba del flujo completo:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
  }
}

async function verifyAllServices() {
  const services = [
    { name: "API Gateway", url: "http://localhost:3000/health" },
    { name: "Auth Service", url: "http://localhost:3001/health" },
    { name: "Courses Service", url: "http://localhost:3002/health" },
    { name: "Enrollment Service", url: "http://localhost:3003/health" },
    { name: "Payments Service", url: "http://localhost:3004/health" },
    {
      name: "Notifications Service",
      url: "http://localhost:3006/api/notifications/health",
    },
    { name: "Frontend SPA", url: "http://localhost:3005/" },
    { name: "Prometheus", url: "http://localhost:9090/" },
    { name: "Grafana", url: "http://localhost:3007/" },
  ];

  for (const service of services) {
    try {
      const response = await axios.get(service.url);
      if (response.status !== 200) {
        throw new Error(`${service.name} no está funcionando`);
      }
      console.log(`   ✅ ${service.name}: OK`);
    } catch (error) {
      throw new Error(`Error verificando ${service.name}: ${error.message}`);
    }
  }
}

// Ejecutar prueba
testCompleteFlow();
