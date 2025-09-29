// Script para configurar Grafana con dashboards del sistema SGU
const axios = require("axios");

const GRAFANA_URL = "http://localhost:3007";
const GRAFANA_USER = "admin";
const GRAFANA_PASSWORD = "admin";

async function configureGrafana() {
  console.log("🔧 Configurando Grafana para el sistema SGU...\n");

  try {
    // 1. Verificar conexión a Grafana
    console.log("🔍 Verificando conexión a Grafana...");
    const healthResponse = await axios.get(`${GRAFANA_URL}/api/health`);
    console.log("✅ Grafana está funcionando correctamente");

    // 2. Autenticación
    console.log("\n🔐 Autenticando con Grafana...");
    const authResponse = await axios.post(
      `${GRAFANA_URL}/api/auth/keys`,
      {
        name: "sgu-api-key",
        role: "Admin",
        secondsToLive: 86400,
      },
      {
        auth: {
          username: GRAFANA_USER,
          password: GRAFANA_PASSWORD,
        },
      }
    );

    const apiKey = authResponse.data.key;
    console.log("✅ Autenticación exitosa");

    // 3. Verificar datasource de Prometheus
    console.log("\n📊 Verificando datasource de Prometheus...");
    try {
      const datasourceResponse = await axios.get(
        `${GRAFANA_URL}/api/datasources`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      const prometheusDS = datasourceResponse.data.find(
        (ds) => ds.name === "Prometheus"
      );
      if (prometheusDS) {
        console.log("✅ Datasource de Prometheus encontrado");
      } else {
        console.log("⚠️  Datasource de Prometheus no encontrado");
      }
    } catch (error) {
      console.log("⚠️  Error verificando datasource:", error.message);
    }

    // 4. Verificar dashboards
    console.log("\n📈 Verificando dashboards...");
    try {
      const dashboardsResponse = await axios.get(
        `${GRAFANA_URL}/api/search?type=dash-db`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      const sguDashboards = dashboardsResponse.data.filter(
        (d) => d.title.includes("SGU") || d.tags.includes("sgu")
      );

      console.log(`✅ ${sguDashboards.length} dashboards de SGU encontrados:`);
      sguDashboards.forEach((dashboard) => {
        console.log(`   - ${dashboard.title} (ID: ${dashboard.id})`);
      });
    } catch (error) {
      console.log("⚠️  Error verificando dashboards:", error.message);
    }

    console.log("\n🎉 Configuración de Grafana completada");
    console.log("\n📋 URLs de acceso:");
    console.log(`   🌐 Grafana: ${GRAFANA_URL}`);
    console.log(`   👤 Usuario: ${GRAFANA_USER}`);
    console.log(`   🔑 Contraseña: ${GRAFANA_PASSWORD}`);
    console.log("\n📊 Dashboards disponibles:");
    console.log("   - SGU System Overview");
    console.log("   - SGU Microservices Detailed");
    console.log("   - SGU Database Monitoring");
  } catch (error) {
    console.error("❌ Error configurando Grafana:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
  }
}

// Ejecutar configuración
configureGrafana();
