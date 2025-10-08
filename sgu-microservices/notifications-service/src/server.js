const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const app = require('./app');
const dbConfig = require('./config/database');

const PORT = process.env.PORT || 3006;

// Debug: Mostrar el puerto que se está usando
console.log('🔍 Debug - PORT desde .env:', process.env.PORT);
console.log('🔍 Debug - PORT final:', PORT);

/**
 * Función para iniciar el servidor
 */
async function startServer() {
  try {
    console.log('🚀 Iniciando Notifications Service...');
    console.log(`📧 Puerto: ${PORT}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);

    // Conectar a la base de datos
    console.log('📊 Conectando a MongoDB...');
    const dbConnected = await dbConfig.connect();

    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log('✅ Notifications Service iniciado correctamente');
      console.log(`🌐 Servidor corriendo en: http://localhost:${PORT}`);
      console.log(
        `📧 Health check: http://localhost:${PORT}/api/notifications/health`
      );
      console.log('📊 Base de datos: MongoDB');
      console.log('🔔 Funcionalidades: Email, SMS, Push Notifications');
    });

    // Manejo de cierre graceful
    process.on('SIGTERM', () => {
      console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
      server.close(() => {
        console.log('🔌 Servidor cerrado');
        dbConfig.disconnect().then(() => {
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
      server.close(() => {
        console.log('🔌 Servidor cerrado');
        dbConfig.disconnect().then(() => {
          process.exit(0);
        });
      });
    });
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('uncaughtException', error => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Iniciar el servidor
startServer();
