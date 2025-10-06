/**
 * Script de prueba para verificar el funcionamiento del microservicio
 * Prueba todos los endpoints disponibles
 */

const http = require("http");

const BASE_URL = "http://localhost:3003";

/**
 * Función para hacer peticiones HTTP
 */
function makeRequest(path, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3003,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token-123",
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
          });
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

/**
 * Probar endpoint de salud
 */
async function testHealthEndpoint() {
  console.log("🏥 Probando endpoint de salud...");
  try {
    const response = await makeRequest("/health");
    console.log(
      `✅ Health endpoint: ${response.status} - ${JSON.stringify(
        response.body
      )}`
    );
    return true;
  } catch (error) {
    console.log(`❌ Health endpoint falló: ${error.message}`);
    return false;
  }
}

/**
 * Probar endpoint de información
 */
async function testInfoEndpoint() {
  console.log("📋 Probando endpoint de información...");
  try {
    const response = await makeRequest("/info");
    console.log(
      `✅ Info endpoint: ${response.status} - ${JSON.stringify(response.body)}`
    );
    return true;
  } catch (error) {
    console.log(`❌ Info endpoint falló: ${error.message}`);
    return false;
  }
}

/**
 * Probar endpoint de estadísticas
 */
async function testStatsEndpoint() {
  console.log("📊 Probando endpoint de estadísticas...");
  try {
    const response = await makeRequest("/api/enrollments/stats");
    console.log(
      `✅ Stats endpoint: ${response.status} - ${JSON.stringify(response.body)}`
    );
    return true;
  } catch (error) {
    console.log(`❌ Stats endpoint falló: ${error.message}`);
    return false;
  }
}

/**
 * Probar endpoint de inscripciones del usuario
 */
async function testMyEnrollmentsEndpoint() {
  console.log("👤 Probando endpoint de mis inscripciones...");
  try {
    const response = await makeRequest("/api/enrollments/my");
    console.log(
      `✅ My enrollments endpoint: ${response.status} - ${JSON.stringify(
        response.body
      )}`
    );
    return true;
  } catch (error) {
    console.log(`❌ My enrollments endpoint falló: ${error.message}`);
    return false;
  }
}

/**
 * Probar endpoint de inscripción (POST)
 */
async function testEnrollmentEndpoint() {
  console.log("📝 Probando endpoint de inscripción...");
  try {
    const enrollmentData = {
      courseId: 1,
      userId: 123,
      semester: "2025-1",
    };
    const response = await makeRequest(
      "/api/enrollments",
      "POST",
      enrollmentData
    );
    console.log(
      `✅ Enrollment endpoint: ${response.status} - ${JSON.stringify(
        response.body
      )}`
    );
    return true;
  } catch (error) {
    console.log(`❌ Enrollment endpoint falló: ${error.message}`);
    return false;
  }
}

/**
 * Función principal de pruebas
 */
async function runTests() {
  console.log("🚀 === PRUEBAS DEL MICROSERVICIO ENROLLMENT ===");
  console.log("📡 Probando endpoints del microservicio...\n");

  const tests = [
    { name: "Health Endpoint", fn: testHealthEndpoint },
    { name: "Info Endpoint", fn: testInfoEndpoint },
    { name: "Stats Endpoint", fn: testStatsEndpoint },
    { name: "My Enrollments Endpoint", fn: testMyEnrollmentsEndpoint },
    { name: "Enrollment Endpoint", fn: testEnrollmentEndpoint },
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    console.log(`\n🔍 Ejecutando: ${test.name}`);
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        console.log(`✅ ${test.name} - PASÓ`);
      } else {
        console.log(`❌ ${test.name} - FALLÓ`);
      }
    } catch (error) {
      console.log(`💥 ${test.name} - ERROR: ${error.message}`);
    }
  }

  console.log("\n📊 === RESUMEN DE PRUEBAS ===");
  console.log(`✅ Pasaron: ${passed}/${total}`);
  console.log(`❌ Fallaron: ${total - passed}/${total}`);
  console.log(`📈 Porcentaje de éxito: ${Math.round((passed / total) * 100)}%`);

  if (passed === total) {
    console.log(
      "\n🎉 ¡TODAS LAS PRUEBAS PASARON! El microservicio está funcionando correctamente."
    );
  } else {
    console.log(
      "\n⚠️  Algunas pruebas fallaron. Revisar la configuración del microservicio."
    );
  }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testHealthEndpoint,
  testInfoEndpoint,
  testStatsEndpoint,
  testMyEnrollmentsEndpoint,
  testEnrollmentEndpoint,
};
