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
  // Para desarrollo local usamos SQLite (más simple)
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.DB_STORAGE || "./database.sqlite",
    logging: console.log, // Muestra las queries SQL en desarrollo
    define: {
      timestamps: true, // Agrega createdAt y updatedAt automáticamente
      underscored: true, // Usa snake_case para los nombres de columna
    },
  });
} else {
  console.log("🏭 Usando PostgreSQL para producción");
  // Para producción usaremos PostgreSQL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false, // En producción no mostrar queries
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
}

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
    await sequelize.sync({ force: false }); // force: true recrea las tablas
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
