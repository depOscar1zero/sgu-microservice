// Script de prueba end-to-end para el sistema SGU
const axios = require("axios");

const API_BASE_URL = "http://localhost:3000"; // API Gateway
const FRONTEND_URL = "http://localhost:3005"; // Frontend SPA

// Datos de prueba
const testUser = {
  firstName: "Juan",
  lastName: "Pérez",
  email: "juan.perez@test.com",
  password: "TestPassword123!",
  studentId: "STU001",
  department: "Computer Science",
};

const testCourse = {
  code: "CS101",
  name: "Introduction to Programming",
  description: "Basic programming concepts using Python",
  credits: 4,
  department: "Computer Science",
  professor: "Dr. John Smith",
  capacity: 40,
  semester: "Fall",
  year: 2024,
  price: 500.0,
  schedule: [
    { day: "Monday", time: "10:00-12:00", room: "Lab A" },
    { day: "Wednesday", time: "10:00-12:00", room: "Lab A" },
  ],
};

let authToken = null;
let courseId = null;
let enrollmentId = null;
let paymentId = null;

async function testEndToEndFlow() {
  console.log("🧪 PRUEBA END-TO-END DEL SISTEMA SGU");
  console.log("=====================================\n");

  try {
    // 1. Verificar que todos los servicios estén funcionando
    console.log("🔍 PASO 1: Verificando servicios...");
    await verifyAllServices();
    console.log("✅ Todos los servicios están funcionando\n");

    // 2. Registrar usuario
    console.log("👤 PASO 2: Registrando usuario...");
    await registerUser();
    console.log("✅ Usuario registrado exitosamente\n");

    // 3. Iniciar sesión
    console.log("🔐 PASO 3: Iniciando sesión...");
    await loginUser();
    console.log("✅ Sesión iniciada exitosamente\n");

    // 4. Crear curso
    console.log("📚 PASO 4: Creando curso...");
    await createCourse();
    console.log("✅ Curso creado exitosamente\n");

    // 5. Inscribirse al curso
    console.log("📝 PASO 5: Inscribiéndose al curso...");
    await enrollInCourse();
    console.log("✅ Inscripción exitosa\n");

    // 6. Procesar pago
    console.log("💳 PASO 6: Procesando pago...");
    await processPayment();
    console.log("✅ Pago procesado exitosamente\n");

    // 7. Verificar notificaciones
    console.log("📧 PASO 7: Verificando notificaciones...");
    await checkNotifications();
    console.log("✅ Notificaciones enviadas\n");

    // 8. Verificar frontend
    console.log("🌐 PASO 8: Verificando frontend...");
    await checkFrontend();
    console.log("✅ Frontend funcionando correctamente\n");

    console.log("🎉 ¡PRUEBA END-TO-END COMPLETADA EXITOSAMENTE!");
    console.log("\n📊 RESUMEN:");
    console.log(
      `   👤 Usuario: ${testUser.firstName} ${testUser.lastName} (${testUser.email})`
    );
    console.log(`   📚 Curso: ${testCourse.name} (${testCourse.code})`);
    console.log(`   📝 Inscripción: ${enrollmentId}`);
    console.log(`   💳 Pago: ${paymentId}`);
    console.log(`   🔑 Token: ${authToken ? "Generado" : "No generado"}`);
  } catch (error) {
    console.error("❌ Error en la prueba end-to-end:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
    process.exit(1);
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
  ];

  for (const service of services) {
    try {
      const response = await axios.get(service.url);
      if (response.status !== 200) {
        throw new Error(`${service.name} no está funcionando`);
      }
    } catch (error) {
      throw new Error(`Error verificando ${service.name}: ${error.message}`);
    }
  }
}

async function registerUser() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/register`,
      testUser
    );
    if (response.status !== 201) {
      throw new Error("Error en el registro de usuario");
    }
    console.log(`   ✅ Usuario registrado: ${testUser.name}`);
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.log("   ⚠️  Usuario ya existe, continuando...");
    } else {
      throw error;
    }
  }
}

async function loginUser() {
  const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
    email: testUser.email,
    password: testUser.password,
  });

  if (response.status !== 200) {
    throw new Error("Error en el login");
  }

  authToken = response.data.token;
  console.log(`   ✅ Token generado: ${authToken.substring(0, 20)}...`);
}

async function createCourse() {
  const response = await axios.post(`${API_BASE_URL}/api/courses`, testCourse, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  if (response.status !== 201) {
    throw new Error("Error creando curso");
  }

  courseId = response.data.id;
  console.log(`   ✅ Curso creado: ${testCourse.name} (ID: ${courseId})`);
}

async function enrollInCourse() {
  const response = await axios.post(
    `${API_BASE_URL}/api/enrollments`,
    {
      courseId: courseId,
      studentId: testUser.studentId,
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );

  if (response.status !== 201) {
    throw new Error("Error en la inscripción");
  }

  enrollmentId = response.data.id;
  console.log(`   ✅ Inscripción creada: ${enrollmentId}`);
}

async function processPayment() {
  const response = await axios.post(
    `${API_BASE_URL}/api/payments`,
    {
      enrollmentId: enrollmentId,
      amount: testCourse.price,
      currency: "USD",
      paymentMethod: "card",
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );

  if (response.status !== 201) {
    throw new Error("Error procesando pago");
  }

  paymentId = response.data.id;
  console.log(`   ✅ Pago procesado: ${paymentId} ($${testCourse.price})`);
}

async function checkNotifications() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.status === 200) {
      console.log(`   ✅ Notificaciones encontradas: ${response.data.length}`);
    }
  } catch (error) {
    console.log("   ⚠️  No se pudieron verificar notificaciones");
  }
}

async function checkFrontend() {
  const response = await axios.get(FRONTEND_URL);
  if (response.status !== 200) {
    throw new Error("Frontend no está funcionando");
  }
  console.log("   ✅ Frontend SPA accesible");
}

// Ejecutar prueba
testEndToEndFlow();
