// Setup para tests de Notifications Service
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';

let mongoServer;

// Configurar MongoDB según el entorno
beforeAll(async () => {
  // En CI (GitHub Actions), usar MongoDB in-memory
  if (process.env.CI) {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    console.log('🧪 Usando MongoDB in-memory para CI:', process.env.MONGODB_URI);
  } else {
    // En local, usar MongoDB real con autenticación
    process.env.MONGODB_URI = 'mongodb://sgu_admin:sgu_mongo_password@localhost:27017/sgu_notifications_test?authSource=admin';
    console.log('🔧 Usando MongoDB local para tests');
  }

  // Conectar a MongoDB usando la URI configurada
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado a MongoDB para tests');
}, 60000); // Timeout de 60 segundos para MongoDB in-memory

afterAll(async () => {
  // Cerrar conexión a MongoDB
  await mongoose.connection.close();
  console.log('🔌 Desconectado de MongoDB');

  // Detener MongoDB in-memory si fue iniciado
  if (mongoServer) {
    await mongoServer.stop();
    console.log('🛑 MongoDB in-memory detenido');
  }
});

process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-password';

// Configuración de timeouts
jest.setTimeout(30000);



