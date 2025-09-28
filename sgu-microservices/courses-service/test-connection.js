const { connectDB, disconnectDB } = require('./src/config/database');

async function testConnection() {
  console.log('🔍 Probando conexión a MongoDB Atlas...\n');
  
  try {
    // Intentar conectar
    await connectDB();
    console.log('\n✅ Conexión exitosa a MongoDB Atlas!');
    console.log('📋 La base de datos está lista para usar');
    
    // Cerrar conexión
    await disconnectDB();
    console.log('\n👋 Conexión cerrada correctamente');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error de conexión:', error.message);
    console.log('\n🔧 Verificar:');
    console.log('   - String de conexión en .env');
    console.log('   - Usuario y contraseña correctos');
    console.log('   - Acceso de red configurado');
    
    process.exit(1);
  }
}

testConnection();