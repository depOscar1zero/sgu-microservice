// Script de prueba para verificar el sistema SGU dockerizado
const axios = require("axios");

const SERVICES = {
  "API Gateway": "http://localhost:3000",
  "Auth Service": "http://localhost:3001",
  "Courses Service": "http://localhost:3002",
  "Enrollment Service": "http://localhost:3003",
  "Payments Service": "http://localhost:3004",
  "Notifications Service": "http://localhost:3006",
  "Frontend SPA": "http://localhost:3005",
  Prometheus: "http://localhost:9090",
  Grafana: "http://localhost:3007",
};

const HEALTH_ENDPOINTS = {
  "API Gateway": "/health",
  "Auth Service": "/health",
  "Courses Service": "/health",
  "Enrollment Service": "/health",
  "Payments Service": "/health",
  "Notifications Service": "/api/notifications/health",
  "Frontend SPA": "/",
  Prometheus: "/",
  Grafana: "/",
};

async function testService(serviceName, baseUrl, healthEndpoint) {
  try {
    console.log(`🔍 Probando ${serviceName}...`);

    const response = await axios.get(`${baseUrl}${healthEndpoint}`, {
      timeout: 5000,
      headers: {
        "User-Agent": "SGU-Test-Script/1.0",
      },
    });

    console.log(
      `✅ ${serviceName}: ${response.status} - ${response.statusText}`
    );
    return { success: true, status: response.status, service: serviceName };
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.log(
        `❌ ${serviceName}: Servicio no disponible (contenedor no iniciado)`
      );
    } else if (error.code === "ENOTFOUND") {
      console.log(`❌ ${serviceName}: No se puede resolver el host`);
    } else if (error.response) {
      console.log(
        `⚠️  ${serviceName}: ${error.response.status} - ${error.response.statusText}`
      );
    } else {
      console.log(`❌ ${serviceName}: ${error.message}`);
    }
    return { success: false, error: error.message, service: serviceName };
  }
}

async function testAllServices() {
  console.log("🚀 Iniciando pruebas del sistema SGU dockerizado...\n");

  const results = [];

  for (const [serviceName, baseUrl] of Object.entries(SERVICES)) {
    const healthEndpoint = HEALTH_ENDPOINTS[serviceName];
    const result = await testService(serviceName, baseUrl, healthEndpoint);
    results.push(result);

    // Pequeña pausa entre pruebas
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n📊 RESUMEN DE PRUEBAS:");
  console.log("=".repeat(50));

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Servicios funcionando: ${successful}`);
  console.log(`❌ Servicios con problemas: ${failed}`);
  console.log(`📊 Total: ${results.length}`);

  if (successful > 0) {
    console.log("\n🎉 SERVICIOS FUNCIONANDO:");
    results
      .filter((r) => r.success)
      .forEach((r) => {
        console.log(`   ✅ ${r.service} (${r.status})`);
      });
  }

  if (failed > 0) {
    console.log("\n⚠️  SERVICIOS CON PROBLEMAS:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   ❌ ${r.service}: ${r.error}`);
      });
  }

  console.log("\n📋 INSTRUCCIONES:");
  console.log("1. Asegúrate de que Docker Desktop esté ejecutándose");
  console.log("2. Ejecuta: docker-compose up -d");
  console.log("3. Espera a que todos los servicios estén listos");
  console.log("4. Ejecuta este script nuevamente");

  return results;
}

// Función para verificar si Docker está ejecutándose
async function checkDockerStatus() {
  try {
    const { exec } = require("child_process");
    const util = require("util");
    const execAsync = util.promisify(exec);

    console.log("🔍 Verificando estado de Docker...");
    const { stdout } = await execAsync("docker ps");
    console.log("✅ Docker está ejecutándose");
    return true;
  } catch (error) {
    console.log("❌ Docker no está ejecutándose o no está instalado");
    console.log(
      "📝 Por favor, inicia Docker Desktop y vuelve a ejecutar este script"
    );
    return false;
  }
}

async function main() {
  console.log("🧪 SISTEMA DE PRUEBAS SGU DOCKERIZADO");
  console.log("=".repeat(50));

  const dockerRunning = await checkDockerStatus();

  if (!dockerRunning) {
    console.log("\n🛑 No se pueden ejecutar las pruebas sin Docker");
    process.exit(1);
  }

  await testAllServices();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAllServices, testService, SERVICES, HEALTH_ENDPOINTS };
