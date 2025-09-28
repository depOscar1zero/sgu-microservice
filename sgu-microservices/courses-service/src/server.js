const app = require("./app");
const { testConnection, syncDatabase } = require("./config/database");

// Puerto del servidor
const PORT = process.env.PORT || 3002;

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error("No se pudo conectar a la base de datos");
    }

    // Sincronizar modelos
    await syncDatabase();

    // Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log("🚀 Courses Service iniciado correctamente");
      console.log(`📡 Servidor corriendo en puerto ${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API: http://localhost:${PORT}/api/courses`);
    });

    // Manejo de errores del servidor
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Puerto ${PORT} ya está en uso`);
      } else {
        console.error("❌ Error del servidor:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Error iniciando el servidor:", error.message);
    process.exit(1);
  }
};

// Manejo de señales de terminación
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM recibido, cerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT recibido, cerrando servidor...");
  process.exit(0);
});

// Manejo de errores no capturados
process.on("uncaughtException", (error) => {
  console.error("❌ Error no capturado:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Promesa rechazada no manejada:", reason);
  process.exit(1);
});

// Iniciar el servidor
startServer();
