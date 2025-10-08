const app = require('./app');
const { testConnection, syncDatabase } = require('./config/database');

// Puerto del servidor
const PORT = process.env.PORT || 3003;

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    console.log('Inicializando base de datos...');
    const connected = await testConnection();
    if (!connected) {
      process.exit(1);
    }

    // Sincronizar modelos
    await syncDatabase();

    // Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log('🚀 Enrollment Service iniciado correctamente');
      console.log(`📡 Servidor corriendo en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📅 Fecha de inicio: ${new Date().toISOString()}`);

      // Configuración de servicios externos
      console.log('\n🔗 Servicios integrados:');
      console.log(
        `   Auth Service: ${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}`
      );
      console.log(
        `   Courses Service: ${process.env.COURSES_SERVICE_URL || 'http://localhost:3002'}`
      );

      // Reglas de negocio
      console.log('\n📋 Reglas de negocio:');
      console.log(
        `   Máximo inscripciones por estudiante: ${process.env.MAX_ENROLLMENTS_PER_STUDENT || 8}`
      );
      console.log(
        `   Plazo límite de inscripción: ${process.env.ENROLLMENT_DEADLINE_HOURS || 24} horas`
      );

      // Endpoints disponibles
      console.log('\n✅ Endpoints disponibles:');
      console.log(`   GET  http://localhost:${PORT}/health`);
      console.log(`   GET  http://localhost:${PORT}/info`);
      console.log(`   POST http://localhost:${PORT}/api/enrollments`);
      console.log(`   GET  http://localhost:${PORT}/api/enrollments/my`);
      console.log(`   GET  http://localhost:${PORT}/api/enrollments/:id`);
      console.log(
        `   PUT  http://localhost:${PORT}/api/enrollments/:id/cancel`
      );
      console.log(
        `   PUT  http://localhost:${PORT}/api/enrollments/:id/payment`
      );
      console.log(
        `   GET  http://localhost:${PORT}/api/enrollments/course/:courseId`
      );
      console.log(`   GET  http://localhost:${PORT}/api/enrollments/stats`);
    });

    // Manejo de cierre graceful
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM recibido. Cerrando Enrollment Service...');
      server.close(() => {
        console.log('💥 Enrollment Service cerrado');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('👋 SIGINT recibido. Cerrando Enrollment Service...');
      server.close(() => {
        console.log('💥 Enrollment Service cerrado');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('❌ Error iniciando Enrollment Service:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('uncaughtException', err => {
  console.log('💥 UNCAUGHT EXCEPTION! Cerrando Enrollment Service...');
  console.log(err.name, err.message);
  process.exit(1);
});

process.on('unhandledRejection', err => {
  console.log('💥 UNHANDLED REJECTION! Cerrando Enrollment Service...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Iniciar servidor si este archivo se ejecuta directamente
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
