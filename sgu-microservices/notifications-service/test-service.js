// Script de prueba simple para el Notifications Service
require("dotenv").config({ path: "./.env" });
const app = require("./src/app");

const PORT = process.env.PORT || 3006;

console.log("🧪 Iniciando prueba del Notifications Service...");
console.log(`📧 Puerto: ${PORT}`);

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log("✅ Servidor de prueba iniciado correctamente");
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📧 Health: http://localhost:${PORT}/api/notifications/health`);

  // Hacer una prueba automática
  setTimeout(() => {
    console.log("\n🧪 Probando Health Check...");
    const http = require("http");

    const options = {
      hostname: "localhost",
      port: PORT,
      path: "/api/notifications/health",
      method: "GET",
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        console.log("✅ Health Check exitoso:");
        console.log(JSON.parse(data));
        console.log("\n🎉 ¡Notifications Service funcionando correctamente!");
        process.exit(0);
      });
    });

    req.on("error", (err) => {
      console.error("❌ Error en Health Check:", err.message);
      process.exit(1);
    });

    req.end();
  }, 2000);
});

server.on("error", (err) => {
  console.error("❌ Error del servidor:", err.message);
  process.exit(1);
});
