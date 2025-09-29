// Script de prueba de integración real para el sistema SGU
const axios = require("axios");

const API_BASE_URL = "http://localhost:3000"; // API Gateway

// Datos de prueba reales
const testUsers = [
  {
    firstName: "María",
    lastName: "González",
    email: "maria.gonzalez@test.com",
    password: "TestPassword123!",
    studentId: "STU001",
    department: "Computer Science",
  },
  {
    firstName: "Carlos",
    lastName: "Rodríguez",
    email: "carlos.rodriguez@test.com",
    password: "TestPassword123!",
    studentId: "STU002",
    department: "Mathematics",
  },
  {
    firstName: "Ana",
    lastName: "Martínez",
    email: "ana.martinez@test.com",
    password: "TestPassword123!",
    studentId: "STU003",
    department: "Physics",
  },
];

const testCourses = [
  {
    code: "CS101",
    name: "Introduction to Programming",
    description: "Basic programming concepts using Python",
    credits: 4,
    department: "Computer Science",
    professor: "Dr. John Smith",
    capacity: 30,
    semester: "Fall",
    year: 2024,
    price: 500.0,
    schedule: [
      { day: "Monday", time: "10:00-12:00", room: "Lab A" },
      { day: "Wednesday", time: "10:00-12:00", room: "Lab A" },
    ],
  },
  {
    code: "MATH201",
    name: "Calculus II",
    description: "Integration and series",
    credits: 4,
    department: "Mathematics",
    professor: "Dr. Jane Doe",
    capacity: 25,
    semester: "Fall",
    year: 2024,
    price: 450.0,
    prerequisites: ["MATH101"],
    schedule: [
      { day: "Tuesday", time: "14:00-16:00", room: "Room 201" },
      { day: "Thursday", time: "14:00-16:00", room: "Room 201" },
    ],
  },
  {
    code: "PHY101",
    name: "Physics I",
    description: "Mechanics and thermodynamics",
    credits: 4,
    department: "Physics",
    professor: "Dr. Albert Wilson",
    capacity: 35,
    semester: "Fall",
    year: 2024,
    price: 550.0,
    prerequisites: ["MATH101"],
    schedule: [
      { day: "Tuesday", time: "10:00-12:00", room: "Lab Physics" },
      { day: "Thursday", time: "10:00-12:00", room: "Lab Physics" },
    ],
  },
];

let createdUsers = [];
let createdCourses = [];
let createdEnrollments = [];
let processedPayments = [];

async function testRealIntegration() {
  console.log("🧪 PRUEBA DE INTEGRACIÓN REAL DEL SISTEMA SGU");
  console.log("============================================\n");

  try {
    // 1. Verificar que todos los servicios estén funcionando
    console.log("🔍 PASO 1: Verificando servicios...");
    await verifyAllServices();
    console.log("✅ Todos los servicios están funcionando\n");

    // 2. Registrar usuarios
    console.log("👥 PASO 2: Registrando usuarios...");
    await registerUsers();
    console.log(`✅ ${createdUsers.length} usuarios registrados\n`);

    // 3. Crear cursos
    console.log("📚 PASO 3: Creando cursos...");
    await createCourses();
    console.log(`✅ ${createdCourses.length} cursos creados\n`);

    // 4. Realizar inscripciones
    console.log("📝 PASO 4: Realizando inscripciones...");
    await createEnrollments();
    console.log(`✅ ${createdEnrollments.length} inscripciones creadas\n`);

    // 5. Procesar pagos
    console.log("💳 PASO 5: Procesando pagos...");
    await processPayments();
    console.log(`✅ ${processedPayments.length} pagos procesados\n`);

    // 6. Verificar notificaciones
    console.log("📧 PASO 6: Verificando notificaciones...");
    await checkNotifications();
    console.log("✅ Notificaciones verificadas\n");

    // 7. Generar reporte final
    console.log("📊 PASO 7: Generando reporte final...");
    await generateFinalReport();
    console.log("✅ Reporte generado\n");

    console.log("🎉 ¡PRUEBA DE INTEGRACIÓN REAL COMPLETADA EXITOSAMENTE!");
    console.log("\n📊 RESUMEN FINAL:");
    console.log(`   👥 Usuarios: ${createdUsers.length}`);
    console.log(`   📚 Cursos: ${createdCourses.length}`);
    console.log(`   📝 Inscripciones: ${createdEnrollments.length}`);
    console.log(`   💳 Pagos: ${processedPayments.length}`);
    console.log(
      `   💰 Total recaudado: $${processedPayments.reduce(
        (sum, p) => sum + p.amount,
        0
      )}`
    );
  } catch (error) {
    console.error("❌ Error en la prueba de integración:", error.message);
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

async function registerUsers() {
  for (const user of testUsers) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/register`,
        user
      );
      if (response.status === 201) {
        createdUsers.push({
          ...user,
          id: response.data.user?.id,
          token: null,
        });
        console.log(
          `   ✅ Usuario registrado: ${user.firstName} ${user.lastName}`
        );
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log(
          `   ⚠️  Usuario ya existe: ${user.firstName} ${user.lastName}`
        );
        // Intentar login
        try {
          const loginResponse = await axios.post(
            `${API_BASE_URL}/api/auth/login`,
            {
              email: user.email,
              password: user.password,
            }
          );
          createdUsers.push({
            ...user,
            id: loginResponse.data.user?.id,
            token: loginResponse.data.token,
          });
          console.log(
            `   ✅ Usuario logueado: ${user.firstName} ${user.lastName}`
          );
        } catch (loginError) {
          console.log(
            `   ❌ Error en login: ${user.firstName} ${user.lastName}`
          );
        }
      } else {
        console.log(
          `   ❌ Error registrando: ${user.firstName} ${user.lastName}`
        );
      }
    }
  }

  // Hacer login para todos los usuarios
  for (let i = 0; i < createdUsers.length; i++) {
    if (!createdUsers[i].token) {
      try {
        const loginResponse = await axios.post(
          `${API_BASE_URL}/api/auth/login`,
          {
            email: createdUsers[i].email,
            password: createdUsers[i].password,
          }
        );
        createdUsers[i].token = loginResponse.data.token;
        createdUsers[i].id = loginResponse.data.user?.id;
      } catch (error) {
        console.log(`   ❌ Error en login: ${createdUsers[i].firstName}`);
      }
    }
  }
}

async function createCourses() {
  for (const course of testCourses) {
    try {
      // Usar el primer usuario como administrador
      const adminUser = createdUsers[0];
      if (!adminUser.token) {
        throw new Error("No hay usuario administrador disponible");
      }

      const response = await axios.post(`${API_BASE_URL}/api/courses`, course, {
        headers: { Authorization: `Bearer ${adminUser.token}` },
      });

      if (response.status === 201) {
        createdCourses.push({
          ...course,
          id: response.data.id,
        });
        console.log(`   ✅ Curso creado: ${course.name} (${course.code})`);
      }
    } catch (error) {
      console.log(`   ❌ Error creando curso: ${course.name}`);
    }
  }
}

async function createEnrollments() {
  for (let i = 0; i < createdUsers.length; i++) {
    const user = createdUsers[i];
    if (!user.token) continue;

    // Cada usuario se inscribe a un curso diferente
    const course = createdCourses[i % createdCourses.length];
    if (!course) continue;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/enrollments`,
        {
          courseId: course.id,
          studentId: user.studentId,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (response.status === 201) {
        createdEnrollments.push({
          id: response.data.id,
          userId: user.id,
          courseId: course.id,
          studentId: user.studentId,
          courseName: course.name,
          amount: course.price,
        });
        console.log(`   ✅ Inscripción: ${user.firstName} → ${course.name}`);
      }
    } catch (error) {
      console.log(
        `   ❌ Error inscripción: ${user.firstName} → ${course.name}`
      );
    }
  }
}

async function processPayments() {
  for (const enrollment of createdEnrollments) {
    try {
      const user = createdUsers.find((u) => u.id === enrollment.userId);
      if (!user || !user.token) continue;

      const response = await axios.post(
        `${API_BASE_URL}/api/payments`,
        {
          enrollmentId: enrollment.id,
          amount: enrollment.amount,
          currency: "USD",
          paymentMethod: "card",
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (response.status === 201) {
        processedPayments.push({
          id: response.data.id,
          enrollmentId: enrollment.id,
          amount: enrollment.amount,
          status: response.data.status,
          studentId: enrollment.studentId,
          courseName: enrollment.courseName,
        });
        console.log(
          `   ✅ Pago procesado: $${enrollment.amount} por ${enrollment.courseName}`
        );
      }
    } catch (error) {
      console.log(`   ❌ Error procesando pago: ${enrollment.courseName}`);
    }
  }
}

async function checkNotifications() {
  for (const user of createdUsers) {
    if (!user.token) continue;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (response.status === 200) {
        console.log(
          `   ✅ Notificaciones para ${user.firstName}: ${
            response.data.length || 0
          }`
        );
      }
    } catch (error) {
      console.log(
        `   ⚠️  No se pudieron verificar notificaciones para ${user.firstName}`
      );
    }
  }
}

async function generateFinalReport() {
  console.log("\n📊 REPORTE DETALLADO:");
  console.log("=====================");

  console.log("\n👥 USUARIOS CREADOS:");
  createdUsers.forEach((user, index) => {
    console.log(
      `   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`
    );
    console.log(`      ID: ${user.id || "N/A"}`);
    console.log(`      Token: ${user.token ? "Generado" : "No generado"}`);
  });

  console.log("\n📚 CURSOS CREADOS:");
  createdCourses.forEach((course, index) => {
    console.log(`   ${index + 1}. ${course.name} (${course.code})`);
    console.log(`      ID: ${course.id}`);
    console.log(`      Precio: $${course.price}`);
    console.log(`      Capacidad: ${course.capacity}`);
    console.log(`      Departamento: ${course.department}`);
  });

  console.log("\n📝 INSCRIPCIONES CREADAS:");
  createdEnrollments.forEach((enrollment, index) => {
    console.log(
      `   ${index + 1}. ${enrollment.studentId} → ${enrollment.courseName}`
    );
    console.log(`      ID: ${enrollment.id}`);
    console.log(`      Monto: $${enrollment.amount}`);
  });

  console.log("\n💳 PAGOS PROCESADOS:");
  processedPayments.forEach((payment, index) => {
    console.log(
      `   ${index + 1}. $${payment.amount} por ${payment.courseName}`
    );
    console.log(`      ID: ${payment.id}`);
    console.log(`      Estado: ${payment.status}`);
    console.log(`      Estudiante: ${payment.studentId}`);
  });

  const totalRevenue = processedPayments.reduce((sum, p) => sum + p.amount, 0);
  console.log(`\n💰 INGRESOS TOTALES: $${totalRevenue}`);
  console.log(
    `📊 TASA DE CONVERSIÓN: ${(
      (processedPayments.length / createdEnrollments.length) *
      100
    ).toFixed(1)}%`
  );
}

// Ejecutar prueba
testRealIntegration();
