const { Sequelize } = require("sequelize");
require("dotenv").config();

// Debug: Mostrar variables de entorno
console.log("🔍 Debug - NODE_ENV:", process.env.NODE_ENV);
console.log("🔍 Debug - DB_STORAGE:", process.env.DB_STORAGE);

// Configuración de la base de datos
let sequelize;

// Forzar SQLite para desarrollo
if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
  console.log("📱 Usando SQLite para desarrollo");
  // Para desarrollo local usamos SQLite
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.DB_STORAGE || "./enrollments.sqlite",
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
    },
  });
} else {
  console.log("🏭 Usando MySQL para producción");
  // Para producción usaremos MySQL/RDS
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: "mysql",
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: true,
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
      "Conexión a base de datos de inscripciones establecida correctamente"
    );
    return true;
  } catch (error) {
    console.error(
      "No se pudo conectar a la base de datos de inscripciones:",
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
    await sequelize.sync({ force: false });
    console.log("Modelos de inscripciones sincronizados correctamente");
  } catch (error) {
    console.error(
      "Error sincronizando modelos de inscripciones:",
      error.message
    );
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
