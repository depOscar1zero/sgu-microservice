const { Sequelize } = require("sequelize");
require("dotenv").config();

// Debug: Mostrar variables de entorno
console.log("🔍 Debug - NODE_ENV:", process.env.NODE_ENV);
console.log("🔍 Debug - DB_STORAGE:", process.env.DB_STORAGE);

// Configuración de la base de datos
let sequelize;

// Configuración de la base de datos - SIEMPRE PostgreSQL como Auth Service
console.log("🏭 Usando PostgreSQL como Auth Service");
sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
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
});

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
