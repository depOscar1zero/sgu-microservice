const app = require('./app');
const { connectDB } = require('./config/database');

// Puerto del servidor
const PORT = process.env.PORT || 3002;

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Conectar a MongoDB Atlas
    await connectDB();
    
    // Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log('🚀 Courses Service iniciado correctamente');
      console.log(`📡 Servidor corriendo en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📅 Fecha de inicio: ${new Date().toISOString()}`);
      
      // Endpoints disponibles
      console.log('\n✅ Endpoints disponibles:');
      console.log(`   GET  http://localhost:${PORT}/health`);
      console.log(`   GET  http://localhost:${PORT}/info`);
      console.log(`   GET  http://localhost:${PORT}/api/courses`);
      console.log(`   POST http://localhost:${PORT}/api/courses`);
      console.log(`   GET  http://localhost:${PORT}/api/courses/:id`);
      console.log(`   GET  http://localhost:${PORT}/api/courses/code/:code`);
      console.log(`   PUT  http://localhost:${PORT}/api/courses/:id`);
      console.log(`   DELETE http://localhost:${PORT}/api/courses/:id`);
      console.log(`   POST http://localhost:${PORT}/api/courses/:id/reserve`);
      console.log(`   POST http://localhost:${PORT}/api/courses/:id/release`);
      console.log(`   GET  http://localhost:${PORT}/api/courses/stats`);
    });

    // Manejo de cierre graceful
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM recibido. Cerrando servidor...');
      server.close(() => {
        console.log('💥 Servidor cerrado');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('👋 SIGINT recibido. Cerrando servidor...');
      server.close(() => {
        console.log('💥 Servidor cerrado');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  console.log('💥 UNCAUGHT EXCEPTION! Cerrando servidor...');
  console.log(err.name, err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.log('💥 UNHANDLED REJECTION! Cerrando servidor...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Iniciar servidor si este archivo se ejecuta directamente
if (require.main === module) {
  startServer();
}

module.exports = { startServer };