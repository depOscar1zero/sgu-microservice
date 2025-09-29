// Script de prueba simplificada para verificar el sistema SGU
const axios = require("axios");

const API_BASE_URL = "http://localhost:3000"; // API Gateway

async function testSimpleFlow() {
  console.log("🧪 PRUEBA SIMPLIFICADA DEL SISTEMA SGU");
  console.log("=====================================\n");

  try {
    // 1. Verificar API Gateway
    console.log("🔍 PASO 1: Verificando API Gateway...");
    const gatewayResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log(`   ✅ API Gateway: ${gatewayResponse.data.status}\n`);

    // 2. Verificar Auth Service
    console.log("🔍 PASO 2: Verificando Auth Service...");
    const authResponse = await axios.get("http://localhost:3001/health");
    console.log(`   ✅ Auth Service: ${authResponse.data.status}\n`);

    // 3. Verificar Courses Service
    console.log("🔍 PASO 3: Verificando Courses Service...");
    const coursesResponse = await axios.get(`${API_BASE_URL}/api/courses`);
    console.log(
      `   ✅ Courses Service: ${coursesResponse.data.total} cursos disponibles\n`
    );

    // 4. Verificar Enrollment Service
    console.log("🔍 PASO 4: Verificando Enrollment Service...");
    const enrollmentResponse = await axios.get("http://localhost:3003/health");
    console.log(
      `   ✅ Enrollment Service: ${enrollmentResponse.data.status}\n`
    );

    // 5. Verificar Payments Service
    console.log("🔍 PASO 5: Verificando Payments Service...");
    const paymentsResponse = await axios.get("http://localhost:3004/health");
    console.log(`   ✅ Payments Service: ${paymentsResponse.data.status}\n`);

    // 6. Verificar Notifications Service
    console.log("🔍 PASO 6: Verificando Notifications Service...");
    const notificationsResponse = await axios.get(
      "http://localhost:3006/api/notifications/health"
    );
    console.log(
      `   ✅ Notifications Service: ${notificationsResponse.data.status}\n`
    );

    // 7. Verificar Frontend
    console.log("🔍 PASO 7: Verificando Frontend SPA...");
    const frontendResponse = await axios.get("http://localhost:3005/");
    console.log(`   ✅ Frontend SPA: ${frontendResponse.status} OK\n`);

    // 8. Verificar Prometheus
    console.log("🔍 PASO 8: Verificando Prometheus...");
    const prometheusResponse = await axios.get("http://localhost:9090/");
    console.log(`   ✅ Prometheus: ${prometheusResponse.status} OK\n`);

    // 9. Verificar Grafana
    console.log("🔍 PASO 9: Verificando Grafana...");
    const grafanaResponse = await axios.get("http://localhost:3007/");
    console.log(`   ✅ Grafana: ${grafanaResponse.status} OK\n`);

    console.log("🎉 ¡TODOS LOS SERVICIOS FUNCIONANDO CORRECTAMENTE!\n");

    console.log("📊 RESUMEN DE SERVICIOS:");
    console.log("   ✅ API Gateway (Puerto 3000)");
    console.log("   ✅ Auth Service (Puerto 3001)");
    console.log("   ✅ Courses Service (Puerto 3002)");
    console.log("   ✅ Enrollment Service (Puerto 3003)");
    console.log("   ✅ Payments Service (Puerto 3004)");
    console.log("   ✅ Notifications Service (Puerto 3006)");
    console.log("   ✅ Frontend SPA (Puerto 3005)");
    console.log("   ✅ Prometheus (Puerto 9090)");
    console.log("   ✅ Grafana (Puerto 3007)");

    console.log("\n🔗 URLs DE ACCESO:");
    console.log("   🌐 Frontend: http://localhost:3005");
    console.log("   🔧 API Gateway: http://localhost:3000");
    console.log("   📊 Prometheus: http://localhost:9090");
    console.log("   📈 Grafana: http://localhost:3007 (admin/admin)");
  } catch (error) {
    console.error("❌ Error en la prueba:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
    process.exit(1);
  }
}

testSimpleFlow();
