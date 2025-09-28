#!/usr/bin/env node

/**
 * Script para ejecutar tests en CI/CD
 * Maneja la configuración de entorno y ejecución de tests
 */

const { execSync } = require("child_process");
const path = require("path");

console.log("🧪 Iniciando tests en CI/CD...\n");

// Configurar variables de entorno para CI
process.env.NODE_ENV = "test";
process.env.CI = "true";
process.env.JEST_WORKER_ID = "1";

// Función para ejecutar comando con manejo de errores
function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    console.log(`✅ ${description} completado\n`);
  } catch (error) {
    console.error(`❌ Error en ${description}:`, error.message);
    process.exit(1);
  }
}

// Función para verificar que los servicios estén disponibles
async function waitForServices() {
  console.log("⏳ Esperando que los servicios estén disponibles...");

  const services = [
    { name: "Auth Service", url: "http://localhost:3001/health" },
    { name: "Courses Service", url: "http://localhost:3002/health" },
    { name: "Enrollment Service", url: "http://localhost:3003/health" },
    { name: "Payments Service", url: "http://localhost:3004/health" },
  ];

  for (const service of services) {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(service.url);
        if (response.ok) {
          console.log(`✅ ${service.name} disponible`);
          break;
        }
      } catch (error) {
        // Servicio no disponible, continuar esperando
      }

      attempts++;
      if (attempts >= maxAttempts) {
        console.log(
          `⚠️  ${service.name} no disponible después de ${maxAttempts} intentos`
        );
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}

async function main() {
  try {
    // 1. Instalar dependencias si es necesario
    console.log("📦 Verificando dependencias...");
    try {
      require("jest");
      require("supertest");
    } catch (error) {
      console.log("📦 Instalando dependencias de testing...");
      runCommand("npm install", "Instalación de dependencias");
    }

    // 2. Esperar servicios (solo si no estamos en modo unit tests)
    if (
      process.argv.includes("--integration") ||
      process.argv.includes("--e2e")
    ) {
      await waitForServices();
    }

    // 3. Ejecutar tests según el tipo especificado
    const testType = process.argv[2] || "unit";

    switch (testType) {
      case "unit":
        console.log("🧪 Ejecutando tests unitarios...");
        runCommand(
          "npm run test:auth && npm run test:courses && npm run test:enrollment && npm run test:payments",
          "Tests unitarios"
        );
        break;

      case "integration":
        console.log("🔗 Ejecutando tests de integración...");
        runCommand("npm run test:integration", "Tests de integración");
        break;

      case "e2e":
        console.log("🌐 Ejecutando tests end-to-end...");
        runCommand("npm run test:e2e", "Tests E2E");
        break;

      case "all":
        console.log("🚀 Ejecutando todos los tests...");
        runCommand("npm run test:all", "Todos los tests");
        break;

      case "coverage":
        console.log("📊 Ejecutando tests con cobertura...");
        runCommand("npm run test:coverage", "Tests con cobertura");
        break;

      default:
        console.log(
          "❌ Tipo de test no válido. Opciones: unit, integration, e2e, all, coverage"
        );
        process.exit(1);
    }

    console.log("🎉 Tests completados exitosamente!");
  } catch (error) {
    console.error("💥 Error durante la ejecución de tests:", error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main, waitForServices };
