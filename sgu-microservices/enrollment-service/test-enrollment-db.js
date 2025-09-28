const { testConnection, syncDatabase } = require('./src/config/database');
const Enrollment = require('./src/models/Enrollment');

async function testEnrollmentDB() {
  console.log('🔍 Probando configuración de base de datos de inscripciones...\n');
  
  try {
    // Probar conexión
    const connected = await testConnection();
    if (!connected) {
      process.exit(1);
    }
    
    // Sincronizar modelos
    await syncDatabase();
    
    console.log('\n✅ Todo funciona correctamente!');
    console.log('📁 Se creó el archivo enrollments.sqlite');
    console.log('📋 Tabla enrollments creada');
    console.log('🔗 Modelo Enrollment listo para usar');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la configuración:', error);
    process.exit(1);
  }
}

testEnrollmentDB();