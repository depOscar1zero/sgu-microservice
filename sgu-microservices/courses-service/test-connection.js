const { sequelize, testConnection, syncDatabase } = require('./src/config/database');
const Course = require('./src/models/Course');

async function testConnectionAndModels() {
  console.log('🔍 Probando conexión a la base de datos...\n');
  
  try {
    // Probar conexión
    const connected = await testConnection();
    if (!connected) {
      throw new Error('No se pudo conectar a la base de datos');
    }
    
    // Sincronizar modelos
    await syncDatabase();
    
    // Probar modelo Course
    console.log('\n📚 Probando modelo Course...');
    const testCourse = await Course.create({
      code: 'TEST001',
      name: 'Curso de Prueba',
      description: 'Este es un curso de prueba',
      department: 'Ingeniería',
      credits: 3,
      capacity: 30,
      price: 100.00,
      professor: 'Dr. Prueba'
    });
    
    console.log('✅ Curso creado exitosamente:', testCourse.code);
    
    // Buscar el curso
    const foundCourse = await Course.findOne({ where: { code: 'TEST001' } });
    console.log('✅ Curso encontrado:', foundCourse.name);
    
    // Eliminar el curso de prueba
    await testCourse.destroy();
    console.log('✅ Curso de prueba eliminado');
    
    console.log('\n🎉 Todo funciona correctamente!');
    console.log('📁 Base de datos configurada y lista para usar');
    
    await sequelize.close();
    console.log('\n👋 Conexión cerrada correctamente');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n🔧 Verificar:');
    console.log('   - Configuración de base de datos');
    console.log('   - Modelos definidos correctamente');
    console.log('   - Permisos de escritura en directorio');
    
    process.exit(1);
  }
}

testConnectionAndModels();