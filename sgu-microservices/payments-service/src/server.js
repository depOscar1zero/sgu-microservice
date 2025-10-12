const app = require('./app');
const { testConnection, syncDatabase } = require('./config/database');

// Configuración del puerto
const PORT = process.env.PORT || 3004;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('=== CONFIGURACIÓN DEL PAYMENTS SERVICE ===');
console.log(`Puerto: ${PORT}`);
console.log(`Entorno: ${NODE_ENV}`);
console.log(
  `Base de datos: ${NODE_ENV === 'development' ? 'SQLite' : 'MySQL'}`
);
console.log('==========================================');

// Función para inicializar el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    console.log('🔌 Conectando a la base de datos...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      throw new Error('No se pudo conectar a la base de datos');
    }

    // Sincronizar modelos
    console.log('📊 Sincronizando modelos de base de datos...');
    await syncDatabase();

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`🚀 Payments Service ejecutándose en el puerto ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`💳 API de pagos: http://localhost:${PORT}/api/payments`);
      console.log();
      console.log('📋 Rutas disponibles:');
      console.log('  POST   /api/payments                     - Crear pago');
      console.log(
        '  POST   /api/payments/intent             - Crear Payment Intent'
      );
      console.log(
        '  GET    /api/payments                     - Obtener pagos del usuario'
      );
      console.log(
        '  GET    /api/payments/:id                 - Obtener pago por ID'
      );
      console.log(
        '  GET    /api/payments/enrollment/:id       - Obtener pagos por inscripción'
      );
      console.log(
        '  POST   /api/payments/:id/refund          - Procesar reembolso'
      );
      console.log(
        '  GET    /api/payments/stats               - Estadísticas (admin)'
      );
      console.log('  GET    /health                           - Health check');
      console.log();
      console.log('🔧 Configuración:');
      console.log(
        `  - Stripe: ${
          process.env.STRIPE_SECRET_KEY ? 'Configurado' : 'Modo simulación'
        }`
      );
      console.log(
        `  - Auth Service: ${
          process.env.AUTH_SERVICE_URL || 'http://localhost:3001'
        }`
      );
      console.log(
        `  - Enrollment Service: ${
          process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3003'
        }`
      );
      console.log();
    });

    // Configurar timeout del servidor
    server.timeout = 30000; // 30 segundos

    // Manejo graceful del cierre
    const gracefulShutdown = signal => {
      console.log(`\n🛑 Recibida señal ${signal}, cerrando servidor...`);

      server.close(err => {
        if (err) {
          console.error('Error cerrando servidor:', err);
          process.exit(1);
        }

        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('⚠️  Forzando cierre del servidor');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('uncaughtException', error => {
  console.error('💥 Excepción no capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, _promise) => {
  console.error('💥 Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Iniciar servidor
startServer();
