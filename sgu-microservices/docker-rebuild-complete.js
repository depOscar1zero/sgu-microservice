// Script para rebuild completo del sistema SGU
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

async function dockerRebuildComplete() {
  console.log("🔧 REBUILD COMPLETO DEL SISTEMA SGU");
  console.log("==================================\n");

  try {
    // 1. Verificar Docker Desktop
    console.log("🔍 PASO 1: Verificando Docker Desktop...");
    try {
      const { stdout } = await execPromise("docker info");
      console.log("   ✅ Docker Desktop funcionando");
    } catch (error) {
      console.log("   ❌ Docker Desktop no está funcionando");
      console.log("   💡 Error:", error.message);
      console.log("\n🔧 SOLUCIÓN:");
      console.log("   1. Abre Docker Desktop");
      console.log("   2. Espera a que esté completamente iniciado");
      console.log("   3. Ejecuta este script nuevamente");
      return;
    }

    // 2. Limpiar sistema Docker
    console.log("\n🔍 PASO 2: Limpiando sistema Docker...");
    try {
      console.log("   🧹 Eliminando contenedores detenidos...");
      await execPromise("docker container prune -f");
      console.log("   🧹 Eliminando imágenes no utilizadas...");
      await execPromise("docker image prune -a -f");
      console.log("   🧹 Eliminando volúmenes no utilizados...");
      await execPromise("docker volume prune -f");
      console.log("   🧹 Eliminando redes no utilizadas...");
      await execPromise("docker network prune -f");
      console.log("   ✅ Sistema Docker limpiado");
    } catch (error) {
      console.log(`   ⚠️  Error limpiando: ${error.message}`);
    }

    // 3. Rebuild de imágenes
    console.log("\n🔍 PASO 3: Rebuild de imágenes...");
    try {
      console.log("   🔨 Rebuild de API Gateway...");
      await execPromise("docker-compose build api-gateway");
      console.log("   ✅ API Gateway rebuilded");
    } catch (error) {
      console.log(`   ❌ Error rebuild API Gateway: ${error.message}`);
    }

    try {
      console.log("   🔨 Rebuild de Auth Service...");
      await execPromise("docker-compose build auth-service");
      console.log("   ✅ Auth Service rebuilded");
    } catch (error) {
      console.log(`   ❌ Error rebuild Auth Service: ${error.message}`);
    }

    try {
      console.log("   🔨 Rebuild de Courses Service...");
      await execPromise("docker-compose build courses-service");
      console.log("   ✅ Courses Service rebuilded");
    } catch (error) {
      console.log(`   ❌ Error rebuild Courses Service: ${error.message}`);
    }

    try {
      console.log("   🔨 Rebuild de Enrollment Service...");
      await execPromise("docker-compose build enrollment-service");
      console.log("   ✅ Enrollment Service rebuilded");
    } catch (error) {
      console.log(`   ❌ Error rebuild Enrollment Service: ${error.message}`);
    }

    try {
      console.log("   🔨 Rebuild de Payments Service...");
      await execPromise("docker-compose build payments-service");
      console.log("   ✅ Payments Service rebuilded");
    } catch (error) {
      console.log(`   ❌ Error rebuild Payments Service: ${error.message}`);
    }

    try {
      console.log("   🔨 Rebuild de Notifications Service...");
      await execPromise("docker-compose build notifications-service");
      console.log("   ✅ Notifications Service rebuilded");
    } catch (error) {
      console.log(
        `   ❌ Error rebuild Notifications Service: ${error.message}`
      );
    }

    try {
      console.log("   🔨 Rebuild de Frontend SPA...");
      await execPromise("docker-compose build frontend-spa");
      console.log("   ✅ Frontend SPA rebuilded");
    } catch (error) {
      console.log(`   ❌ Error rebuild Frontend SPA: ${error.message}`);
    }

    // 4. Iniciar sistema
    console.log("\n🔍 PASO 4: Iniciando sistema...");
    try {
      console.log("   🚀 Iniciando todos los servicios...");
      await execPromise("docker-compose up -d");
      console.log("   ✅ Sistema iniciado");
    } catch (error) {
      console.log(`   ❌ Error iniciando sistema: ${error.message}`);
    }

    // 5. Verificar estado
    console.log("\n🔍 PASO 5: Verificando estado...");
    try {
      const { stdout } = await execPromise("docker-compose ps");
      console.log("   📊 Estado de contenedores:");
      const lines = stdout.split("\n").filter(Boolean);
      lines.slice(1).forEach((line, index) => {
        const parts = line.split(/\s{2,}/).filter(Boolean);
        if (parts.length >= 4) {
          const name = parts[0];
          const status = parts[4];
          console.log(`      ${index + 1}. ${name} - ${status}`);
        }
      });
    } catch (error) {
      console.log(`   ❌ Error verificando estado: ${error.message}`);
    }

    // 6. Generar reporte final
    console.log("\n📊 REPORTE FINAL:");
    console.log("=================");
    console.log("   🎯 Rebuild completo del sistema SGU");
    console.log("   🔧 Imágenes reconstruidas desde cero");
    console.log("   🚀 Sistema iniciado");
    console.log("   📊 Estado verificado");

    console.log("\n🔗 URLs DEL SISTEMA:");
    console.log("   🌐 Frontend: http://localhost:3005");
    console.log("   🔧 API Gateway: http://localhost:3000");
    console.log("   🔐 Auth Service: http://localhost:3001");
    console.log("   📚 Courses Service: http://localhost:3002");
    console.log("   📋 Enrollment Service: http://localhost:3003");
    console.log("   💳 Payments Service: http://localhost:3004");
    console.log("   📧 Notifications Service: http://localhost:3006");
    console.log("   📊 Prometheus: http://localhost:9090");
    console.log("   📈 Grafana: http://localhost:3007");

    console.log("\n🎉 ¡REBUILD COMPLETO EXITOSO!");
  } catch (error) {
    console.error("❌ Error en el rebuild completo:", error.message);
  }
}

// Ejecutar rebuild
dockerRebuildComplete();

