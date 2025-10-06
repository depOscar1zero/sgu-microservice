const { Sequelize } = require("sequelize");
require("dotenv").config();

// Debug: Mostrar variables de entorno
console.log("🔍 Debug - NODE_ENV:", process.env.NODE_ENV);
console.log("🔍 Debug - DATABASE_URL:", process.env.DATABASE_URL ? "Definida" : "No definida");

// Configuración de la base de datos
let sequelize;

// Configuración según el entorno
if (process.env.NODE_ENV === "test") {
  console.log("📱 Usando SQLite en memoria para tests");
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: ":memory:",
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  });
} else if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
  console.log("📱 Usando SQLite para desarrollo");
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.DB_STORAGE || "./database.sqlite",
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
    },
  });
} else if (process.env.DATABASE_URL) {
  console.log("🏭 Usando PostgreSQL para producción");
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
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
  });
} else {
  console.log("📱 Fallback a SQLite");
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false,
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
    await sequelize.sync({ force: false });
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