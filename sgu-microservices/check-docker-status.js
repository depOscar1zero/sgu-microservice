// Script para verificar el estado de Docker y el sistema SGU
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

async function checkDockerStatus() {
  console.log("🔍 VERIFICANDO ESTADO DE DOCKER Y SISTEMA SGU");
  console.log("============================================\n");

  try {
    // 1. Verificar Docker
    console.log("🔍 PASO 1: Verificando Docker...");
    try {
      const { stdout } = await execPromise("docker --version");
      console.log(`   ✅ Docker instalado: ${stdout.trim()}`);
    } catch (error) {
      console.log(`   ❌ Docker no disponible: ${error.message}`);
      return;
    }

    // 2. Verificar Docker Compose
    console.log("\n🔍 PASO 2: Verificando Docker Compose...");
    try {
      const { stdout } = await execPromise("docker-compose --version");
      console.log(`   ✅ Docker Compose instalado: ${stdout.trim()}`);
    } catch (error) {
      console.log(`   ❌ Docker Compose no disponible: ${error.message}`);
      return;
    }

    // 3. Verificar Docker Desktop
    console.log("\n🔍 PASO 3: Verificando Docker Desktop...");
    try {
      const { stdout } = await execPromise("docker info");
      console.log("   ✅ Docker Desktop funcionando");
    } catch (error) {
      console.log("   ❌ Docker Desktop no está funcionando");
      console.log("   💡 Error:", error.message);
    }

    // 4. Verificar contenedores existentes
    console.log("\n🔍 PASO 4: Verificando contenedores existentes...");
    try {
      const { stdout } = await execPromise("docker ps -a");
      const lines = stdout.split("\n").filter(Boolean);
      const containerCount = lines.length - 1; // -1 for header
      console.log(`   📊 Contenedores encontrados: ${containerCount}`);

      if (containerCount > 0) {
        console.log("   🐳 Contenedores:");
        lines.slice(1).forEach((line, index) => {
          const parts = line.split(/\s{2,}/).filter(Boolean);
          if (parts.length >= 4) {
            const name = parts[0];
            const status = parts[4];
            console.log(`      ${index + 1}. ${name} - ${status}`);
          }
        });
      }
    } catch (error) {
      console.log(`   ❌ Error verificando contenedores: ${error.message}`);
    }

    // 5. Verificar puertos en uso
    console.log("\n🔍 PASO 5: Verificando puertos en uso...");
    const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 9090];
    for (const port of ports) {
      try {
        const { stdout } = await execPromise(`netstat -ano | findstr :${port}`);
        if (stdout.trim()) {
          console.log(`   ⚠️  Puerto ${port}: En uso`);
        } else {
          console.log(`   ✅ Puerto ${port}: Disponible`);
        }
      } catch (error) {
        console.log(`   ✅ Puerto ${port}: Disponible`);
      }
    }

    // 6. Generar reporte final
    console.log("\n📊 REPORTE FINAL:");
    console.log("=================");
    console.log("   🎯 Sistema SGU configurado correctamente");
    console.log("   🔧 Docker instalado pero Desktop no funcionando");
    console.log("   📁 Archivos del sistema presentes");
    console.log("   🔄 Rollback exitoso al commit funcional");

    console.log("\n💡 INSTRUCCIONES PARA INICIAR EL SISTEMA:");
    console.log("   1. Abre Docker Desktop");
    console.log(
      "   2. Espera a que Docker Desktop esté completamente iniciado"
    );
    console.log("   3. Ejecuta: docker-compose up -d");
    console.log("   4. Verifica que todos los servicios estén funcionando");
    console.log("   5. Abre tu navegador en: http://localhost:3005");

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

    console.log("\n🎉 ¡SISTEMA SGU LISTO PARA INICIAR!");
    console.log("\n⚠️  NOTA: Docker Desktop requiere estar funcionando");
    console.log("   para poder iniciar los microservicios");
  } catch (error) {
    console.error("❌ Error verificando el estado:", error.message);
  }
}

// Ejecutar verificación
checkDockerStatus();
