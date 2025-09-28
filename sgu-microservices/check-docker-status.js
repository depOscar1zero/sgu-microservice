// Script para verificar el estado de Docker y los servicios
const { exec } = require("child_process");
const util = require("util");
const execAsync = util.promisify(exec);

async function checkDockerStatus() {
  console.log("🔍 Verificando estado de Docker...");

  try {
    // Verificar si Docker está ejecutándose
    const { stdout: dockerPs } = await execAsync("docker ps");
    console.log("✅ Docker está ejecutándose");

    // Verificar contenedores del proyecto SGU
    const { stdout: sguContainers } = await execAsync(
      'docker ps --filter "name=sgu" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"'
    );

    if (sguContainers.trim()) {
      console.log("\n📦 Contenedores SGU encontrados:");
      console.log(sguContainers);
    } else {
      console.log("\n📦 No hay contenedores SGU ejecutándose");
    }

    // Verificar imágenes
    const { stdout: images } = await execAsync(
      'docker images --filter "reference=sgu*" --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}"'
    );

    if (images.trim()) {
      console.log("\n🖼️  Imágenes SGU encontradas:");
      console.log(images);
    } else {
      console.log("\n🖼️  No hay imágenes SGU construidas");
    }

    return true;
  } catch (error) {
    console.log("❌ Error verificando Docker:", error.message);
    return false;
  }
}

async function checkDockerComposeStatus() {
  console.log("\n🔍 Verificando estado de Docker Compose...");

  try {
    const { stdout } = await execAsync("docker-compose ps");
    console.log("✅ Docker Compose está disponible");

    if (stdout.includes("sgu")) {
      console.log("\n📊 Estado de servicios:");
      console.log(stdout);
    } else {
      console.log("\n📊 No hay servicios SGU ejecutándose");
    }

    return true;
  } catch (error) {
    console.log("❌ Error verificando Docker Compose:", error.message);
    return false;
  }
}

async function provideInstructions() {
  console.log("\n📋 INSTRUCCIONES PARA INICIAR EL SISTEMA:");
  console.log("=".repeat(50));

  console.log("\n1. 🐳 Verificar Docker Desktop:");
  console.log("   - Asegúrate de que Docker Desktop esté ejecutándose");
  console.log(
    "   - Verifica que el ícono de Docker esté en la bandeja del sistema"
  );

  console.log("\n2. 🔨 Construir imágenes:");
  console.log("   docker-compose build");

  console.log("\n3. 🚀 Iniciar servicios:");
  console.log("   docker-compose up -d");

  console.log("\n4. 🔍 Verificar estado:");
  console.log("   docker-compose ps");

  console.log("\n5. 📊 Ver logs:");
  console.log("   docker-compose logs -f [servicio]");

  console.log("\n6. 🛑 Detener servicios:");
  console.log("   docker-compose down");

  console.log("\n7. 🧪 Probar sistema:");
  console.log("   node test-docker-system.js");
}

async function main() {
  console.log("🔍 VERIFICACIÓN DEL SISTEMA SGU DOCKERIZADO");
  console.log("=".repeat(50));

  const dockerOk = await checkDockerStatus();
  const composeOk = await checkDockerComposeStatus();

  if (dockerOk && composeOk) {
    console.log("\n✅ Docker y Docker Compose están funcionando correctamente");
    console.log("🚀 Puedes proceder a construir e iniciar el sistema");
  } else {
    console.log("\n❌ Hay problemas con Docker o Docker Compose");
    console.log("📝 Por favor, revisa la configuración");
  }

  await provideInstructions();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkDockerStatus, checkDockerComposeStatus };
