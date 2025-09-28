const { Sequelize } = require("sequelize");
require("dotenv").config();

// Debug: Mostrar variables de entorno
console.log("🔍 Debug - NODE_ENV:", process.env.NODE_ENV);
console.log("🔍 Debug - DATABASE_URL:", process.env.DATABASE_URL);

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
    console.log("✅ Conexión a base de datos establecida correctamente");
    return true;
  } catch (error) {
    console.error("❌ No se pudo conectar a la base de datos:", error.message);
    return false;
  }
};

/**
 * Función para sincronizar modelos
 */
const syncDatabase = async () => {
  try {
    // Forzar recreación de tablas para evitar conflictos
    await sequelize.sync({ force: true }); // force: true recrea las tablas
    console.log("✅ Modelos sincronizados correctamente");
  } catch (error) {
    console.error("❌ Error sincronizando modelos:", error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
