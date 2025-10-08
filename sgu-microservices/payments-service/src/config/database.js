const { Sequelize } = require('sequelize');
require('dotenv').config();

// Debug: Mostrar variables de entorno
console.log('🔍 Debug - NODE_ENV:', process.env.NODE_ENV);
console.log(
  '🔍 Debug - DATABASE_URL:',
  process.env.DATABASE_URL ? 'Definida' : 'No definida'
);

// Configuración de la base de datos
let sequelize;

// Configuración según el entorno
if (process.env.NODE_ENV === 'test') {
  console.log('📱 Usando SQLite en memoria para tests');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  });
} else if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  console.log('📱 Usando SQLite para desarrollo');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './payments.sqlite',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  });
} else if (process.env.DATABASE_URL) {
  console.log('🏭 Usando PostgreSQL para producción');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  });
} else {
  console.log('📱 Fallback a SQLite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './payments.sqlite',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  });
}

/**
 * Función para probar la conexión
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      '✅ Conexión a base de datos de pagos establecida correctamente'
    );
    return true;
  } catch (error) {
    console.error(
      '❌ No se pudo conectar a la base de datos de pagos:',
      error.message
    );
    return false;
  }
};

/**
 * Función para sincronizar modelos
 */
const syncDatabase = async () => {
  try {
    const force =
      process.env.NODE_ENV === 'development' &&
      process.env.DB_FORCE_SYNC === 'true';
    await sequelize.sync({ force });
    console.log('✅ Modelos de pagos sincronizados correctamente');
  } catch (error) {
    console.error('❌ Error sincronizando modelos de pagos:', error.message);
    throw error;
  }
};

/**
 * Función para cerrar la conexión
 */
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('✅ Conexión a base de datos cerrada correctamente');
  } catch (error) {
    console.error('❌ Error cerrando conexión a base de datos:', error.message);
  }
};

/**
 * Función para obtener estadísticas de la base de datos
 */
const getDatabaseStats = async () => {
  try {
    if (sequelize.getDialect() === 'sqlite') {
      const [results] = await sequelize.query(`
        SELECT 
          name,
          sql
        FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);
      return {
        tables: results.length,
        connection: 'active',
      };
    } else {
      // Para PostgreSQL
      const [results] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      return {
        tables: results.length,
        connection: 'active',
      };
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas de BD:', error);
    return {
      tables: 0,
      connection: 'error',
    };
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  closeConnection,
  getDatabaseStats,
};
