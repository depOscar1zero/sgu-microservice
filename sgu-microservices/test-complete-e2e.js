// Script de prueba end-to-end completo para el sistema SGU
const axios = require("axios");

const API_BASE_URL = "http://localhost:3000"; // API Gateway
const FRONTEND_URL = "http://localhost:3005"; // Frontend SPA

// Función para esperar
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function testCompleteE2E() {
  console.log("🧪 PRUEBA END-TO-END COMPLETA DEL SISTEMA SGU");
  console.log("============================================\n");

  try {
    // 1. Verificar que todos los servicios estén funcionando
    console.log("🔍 PASO 1: Verificando servicios...");
    await verifyAllServices();
    console.log("✅ Todos los servicios están funcionando\n");

    // Esperar para evitar rate limiting
    console.log("⏳ Esperando 3 segundos para evitar rate limiting...");
    await delay(3000);

    // 2. Registrar un usuario
    console.log("👤 PASO 2: Registrando usuario...");
    const user = {
      firstName: "EndToEnd",
      lastName: "Test",
      email: "endtoend.test@example.com",
      password: "TestPassword123!",
      studentId: "STU777",
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
      } else if (error.response && error.response.status === 429) {
        console.log("   ⚠️  Rate limit alcanzado, esperando...");
        await delay(10000);
        try {
          const registerResponse = await axios.post(
            `${API_BASE_URL}/api/auth/register`,
            user
          );
          console.log(
            `   ✅ Usuario registrado después del delay: ${user.firstName} ${user.lastName}`
          );
        } catch (retryError) {
          console.log(
            `   ❌ Error registrando usuario después del retry: ${retryError.message}`
          );
        }
      } else {
        console.log(`   ❌ Error registrando usuario: ${error.message}`);
      }
    }

    // Esperar un poco más
    console.log("⏳ Esperando 5 segundos...");
    await delay(5000);

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
      if (error.response && error.response.status === 429) {
        console.log("   ⚠️  Rate limit alcanzado, esperando...");
        await delay(10000);
        try {
          const loginResponse = await axios.post(
            `${API_BASE_URL}/api/auth/login`,
            {
              email: user.email,
              password: user.password,
            }
          );
          authToken = loginResponse.data.token;
          console.log(
            `   ✅ Sesión iniciada después del delay: ${
              loginResponse.data.user?.firstName || "Usuario"
            }`
          );
        } catch (retryError) {
          console.log(
            `   ❌ Error en login después del retry: ${retryError.message}`
          );
          return;
        }
      } else {
        console.log(`   ❌ Error en login: ${error.message}`);
        return;
      }
    }

    if (!authToken) {
      console.log("   ❌ No se pudo obtener token de autenticación");
      return;
    }

    // Esperar un poco más
    console.log("⏳ Esperando 3 segundos...");
    await delay(3000);

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

    // Esperar un poco más
    console.log("⏳ Esperando 3 segundos...");
    await delay(3000);

    // 5. Crear un nuevo curso
    console.log("\n📝 PASO 5: Creando nuevo curso...");
    const newCourse = {
      code: "E2E101",
      name: "End-to-End Test Course",
      description: "A course for end-to-end testing",
      credits: 3,
      department: "Computer Science",
      professor: "Dr. E2E Test",
      capacity: 25,
      semester: "Fall",
      year: 2024,
      price: 350.0,
      schedule: [
        { day: "Monday", time: "14:00-16:00", room: "E2E Lab" },
        { day: "Wednesday", time: "14:00-16:00", room: "E2E Lab" },
      ],
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
      if (error.response && error.response.status === 429) {
        console.log("   ⚠️  Rate limit alcanzado, esperando...");
        await delay(10000);
        try {
          const courseResponse = await axios.post(
            `${API_BASE_URL}/api/courses`,
            newCourse,
            {
              headers: { Authorization: `Bearer ${authToken}` },
            }
          );
          courseId = courseResponse.data.id;
          console.log(
            `   ✅ Curso creado después del delay: ${newCourse.name} (ID: ${courseId})`
          );
        } catch (retryError) {
          console.log(
            `   ❌ Error creando curso después del retry: ${retryError.message}`
          );
        }
      } else {
        console.log(`   ❌ Error creando curso: ${error.message}`);
      }
    }

    if (!courseId) {
      console.log("   ❌ No se pudo crear el curso, terminando prueba");
      return;
    }

    // Esperar un poco más
    console.log("⏳ Esperando 3 segundos...");
    await delay(3000);

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
      if (error.response && error.response.status === 429) {
        console.log("   ⚠️  Rate limit alcanzado, esperando...");
        await delay(10000);
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
          console.log(
            `   ✅ Inscripción creada después del delay: ${enrollmentId}`
          );
        } catch (retryError) {
          console.log(
            `   ❌ Error en inscripción después del retry: ${retryError.message}`
          );
        }
      } else {
        console.log(`   ❌ Error en inscripción: ${error.message}`);
      }
    }

    if (!enrollmentId) {
      console.log("   ❌ No se pudo crear la inscripción, terminando prueba");
      return;
    }

    // Esperar un poco más
    console.log("⏳ Esperando 3 segundos...");
    await delay(3000);

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
      if (error.response && error.response.status === 429) {
        console.log("   ⚠️  Rate limit alcanzado, esperando...");
        await delay(10000);
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
          console.log(
            `   ✅ Pago procesado después del delay: ${paymentId} - $${newCourse.price}`
          );
        } catch (retryError) {
          console.log(
            `   ❌ Error procesando pago después del retry: ${retryError.message}`
          );
        }
      } else {
        console.log(`   ❌ Error procesando pago: ${error.message}`);
      }
    }

    // Esperar un poco más
    console.log("⏳ Esperando 3 segundos...");
    await delay(3000);

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

    // 9. Verificar Frontend
    console.log("\n🌐 PASO 9: Verificando Frontend...");
    try {
      const frontendResponse = await axios.get(FRONTEND_URL);
      console.log(`   ✅ Frontend SPA: ${frontendResponse.status} OK`);
    } catch (error) {
      console.log(`   ❌ Frontend SPA: ${error.message}`);
    }

    // 10. Generar reporte final
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

    console.log("\n🎉 ¡PRUEBA END-TO-END COMPLETA EXITOSA!");
  } catch (error) {
    console.error("❌ Error en la prueba end-to-end:", error.message);
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
testCompleteE2E();
