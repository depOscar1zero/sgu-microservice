const { testConnection, syncDatabase } = require('./src/config/database');
const User = require('./src/models/User');

async function testSetup() {
  console.log('🚀 Probando configuración de base de datos...\n');
  
  // Probar conexión
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  // Sincronizar modelos
  await syncDatabase();
  
  console.log('\n✅ Todo funciona correctamente!');
  console.log('📁 Se creó el archivo database.sqlite');
  console.log('📋 Tabla users creada');
  
  process.exit(0);
}

testSetup().catch(error => {
  console.error('❌ Error en la configuración:', error);
  process.exit(1);
});