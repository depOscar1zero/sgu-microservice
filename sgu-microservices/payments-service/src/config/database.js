const { Sequelize } = require("sequelize");
require("dotenv").config();

// Configuración de la base de datos
let sequelize;

if (process.env.NODE_ENV === "development") {
  // Para desarrollo local usamos SQLite
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.DB_STORAGE || "./payments.sqlite",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  // Para producción usaremos PostgreSQL
  sequelize = new Sequelize(
    process.env.DATABASE_URL || process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      dialect: "postgres",
      logging: false,
      pool: {
        max: 20,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
      },
      dialectOptions: {
        ssl:
          process.env.DB_SSL === "true"
            ? {
                require: true,
                rejectUnauthorized: false,
              }
            : false,
      },
    }
  );
}

/**
 * Función para probar la conexión
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      "✅ Conexión a base de datos de pagos establecida correctamente"
    );
    return true;
  } catch (error) {
    console.error(
      "❌ No se pudo conectar a la base de datos de pagos:",
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
      process.env.NODE_ENV === "development" &&
      process.env.DB_FORCE_SYNC === "true";
    await sequelize.sync({ force });
    console.log("✅ Modelos de pagos sincronizados correctamente");
  } catch (error) {
    console.error("❌ Error sincronizando modelos de pagos:", error.message);
    throw error;
  }
};

/**
 * Función para cerrar la conexión
 */
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log("✅ Conexión a base de datos cerrada correctamente");
  } catch (error) {
    console.error("❌ Error cerrando conexión a base de datos:", error.message);
  }
};

/**
 * Función para obtener estadísticas de la base de datos
 */
const getDatabaseStats = async () => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        name,
        sql
      FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);

    return {
      tables: results.length,
      connection: "active",
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas de BD:", error);
    return {
      tables: 0,
      connection: "error",
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
