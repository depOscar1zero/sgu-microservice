const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de la base de datos
let sequelize;

if (process.env.NODE_ENV === 'development') {
  // Para desarrollo local usamos SQLite (más simple)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: console.log, // Muestra las queries SQL en desarrollo
    define: {
      timestamps: true, // Agrega createdAt y updatedAt automáticamente
      underscored: true, // Usa snake_case para los nombres de columna
    }
  });
} else {
  // Para producción usaremos MySQL/RDS
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false, // En producción no mostrar queries
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
      }
    }
  );
}

/**
 * Función para probar la conexión
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error.message);
    return false;
  }
};

/**
 * Función para sincronizar modelos
 */
const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false }); // force: true recrea las tablas
    console.log('✅ Modelos sincronizados correctamente');
  } catch (error) {
    console.error('❌ Error sincronizando modelos:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};