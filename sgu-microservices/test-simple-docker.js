// Script de prueba para verificar el sistema SGU dockerizado simplificado
const axios = require("axios");

const SIMPLE_SERVICES = {
  "Auth Service": "http://localhost:3001",
  "Courses Service": "http://localhost:3002",
  PostgreSQL: "http://localhost:5432",
  MongoDB: "http://localhost:27017",
  Redis: "http://localhost:6379",
};

const HEALTH_ENDPOINTS = {
  "Auth Service": "/health",
  "Courses Service": "/health",
  PostgreSQL: "/", // PostgreSQL no tiene endpoint de salud HTTP
  MongoDB: "/", // MongoDB no tiene endpoint de salud HTTP
  Redis: "/", // Redis no tiene endpoint de salud HTTP
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

async function testDatabaseConnections() {
  console.log("\n🔍 Probando conexiones de base de datos...");

  const results = [];

  // Probar PostgreSQL
  try {
    const { exec } = require("child_process");
    const util = require("util");
    const execAsync = util.promisify(exec);

    const { stdout } = await execAsync(
      "docker exec sgu-postgres pg_isready -h localhost -p 5432"
    );
    console.log("✅ PostgreSQL: Base de datos lista");
    results.push({ success: true, service: "PostgreSQL" });
  } catch (error) {
    console.log("❌ PostgreSQL: No disponible");
    results.push({ success: false, service: "PostgreSQL" });
  }

  // Probar MongoDB
  try {
    const { exec } = require("child_process");
    const util = require("util");
    const execAsync = util.promisify(exec);

    const { stdout } = await execAsync(
      'docker exec sgu-mongodb mongosh --eval "db.runCommand({ping: 1})" --quiet'
    );
    console.log("✅ MongoDB: Base de datos lista");
    results.push({ success: true, service: "MongoDB" });
  } catch (error) {
    console.log("❌ MongoDB: No disponible");
    results.push({ success: false, service: "MongoDB" });
  }

  // Probar Redis
  try {
    const { exec } = require("child_process");
    const util = require("util");
    const execAsync = util.promisify(exec);

    const { stdout } = await execAsync("docker exec sgu-redis redis-cli ping");
    if (stdout.includes("PONG")) {
      console.log("✅ Redis: Base de datos lista");
      results.push({ success: true, service: "Redis" });
    } else {
      console.log("❌ Redis: No disponible");
      results.push({ success: false, service: "Redis" });
    }
  } catch (error) {
    console.log("❌ Redis: No disponible");
    results.push({ success: false, service: "Redis" });
  }

  return results;
}

async function testAllServices() {
  console.log(
    "🚀 Iniciando pruebas del sistema SGU dockerizado simplificado...\n"
  );

  const results = [];

  // Probar servicios HTTP
  for (const [serviceName, baseUrl] of Object.entries(SIMPLE_SERVICES)) {
    if (
      serviceName === "PostgreSQL" ||
      serviceName === "MongoDB" ||
      serviceName === "Redis"
    ) {
      continue; // Saltar bases de datos, las probaremos por separado
    }

    const healthEndpoint = HEALTH_ENDPOINTS[serviceName];
    const result = await testService(serviceName, baseUrl, healthEndpoint);
    results.push(result);

    // Pequeña pausa entre pruebas
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Probar bases de datos
  const dbResults = await testDatabaseConnections();
  results.push(...dbResults);

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
        console.log(`   ✅ ${r.service}`);
      });
  }

  if (failed > 0) {
    console.log("\n⚠️  SERVICIOS CON PROBLEMAS:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   ❌ ${r.service}`);
      });
  }

  console.log("\n📋 INSTRUCCIONES:");
  console.log(
    "1. Verificar contenedores: docker-compose -f docker-compose.simple.yml ps"
  );
  console.log(
    "2. Ver logs: docker-compose -f docker-compose.simple.yml logs [servicio]"
  );
  console.log(
    "3. Reiniciar: docker-compose -f docker-compose.simple.yml restart"
  );

  return results;
}

async function main() {
  console.log("🧪 SISTEMA DE PRUEBAS SGU DOCKERIZADO SIMPLIFICADO");
  console.log("=".repeat(60));

  await testAllServices();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testAllServices,
  testService,
  SIMPLE_SERVICES,
  HEALTH_ENDPOINTS,
};
