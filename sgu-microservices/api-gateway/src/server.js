const app = require('./app');

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Función para iniciar el servidor
const startServer = () => {
  try {
    const server = app.listen(PORT, () => {
      console.log('🚀 API Gateway iniciado correctamente');
      console.log(`📡 Servidor corriendo en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📅 Fecha de inicio: ${new Date().toISOString()}`);

      // Servicios configurados
      console.log('\n🔗 Servicios registrados:');
      console.log(
        `   Auth Service: ${
          process.env.AUTH_SERVICE_URL || 'http://localhost:3001'
        }`
      );
      console.log(
        `   Courses Service: ${
          process.env.COURSES_SERVICE_URL || 'http://localhost:3002'
        }`
      );

      // Endpoints del Gateway
      console.log('\n✅ Endpoints del Gateway:');
      console.log(`   GET  http://localhost:${PORT}/health`);
      console.log(`   GET  http://localhost:${PORT}/status`);
      console.log(`   GET  http://localhost:${PORT}/info`);

      // Rutas proxeadas
      console.log('\n🔄 Rutas proxeadas:');
      console.log(
        `   POST http://localhost:${PORT}/api/auth/register → Auth Service`
      );
      console.log(
        `   POST http://localhost:${PORT}/api/auth/login → Auth Service`
      );
      console.log(
        `   GET  http://localhost:${PORT}/api/auth/profile → Auth Service`
      );
      console.log(
        `   GET  http://localhost:${PORT}/api/courses → Courses Service`
      );
      console.log(
        `   POST http://localhost:${PORT}/api/courses → Courses Service`
      );
      console.log(
        `   GET  http://localhost:${PORT}/api/courses/:id → Courses Service`
      );

      console.log('\n🛡️  Características habilitadas:');
      console.log('   - Rate Limiting');
      console.log('   - JWT Authentication');
      console.log('   - Health Monitoring');
      console.log('   - Request Logging');
      console.log('   - CORS');
      console.log('   - Security Headers');
    });

    // Manejo de cierre graceful
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM recibido. Cerrando Gateway...');
      server.close(() => {
        console.log('💥 Gateway cerrado');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('👋 SIGINT recibido. Cerrando Gateway...');
      server.close(() => {
        console.log('💥 Gateway cerrado');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('❌ Error iniciando el Gateway:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('uncaughtException', err => {
  console.log('💥 UNCAUGHT EXCEPTION! Cerrando Gateway...');
  console.log(err.name, err.message);
  process.exit(1);
});

process.on('unhandledRejection', err => {
  console.log('💥 UNHANDLED REJECTION! Cerrando Gateway...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Iniciar servidor si este archivo se ejecuta directamente
if (require.main === module) {
  startServer();
}
