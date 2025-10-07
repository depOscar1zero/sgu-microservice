require("dotenv").config();
const { Sequelize } = require("sequelize");

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
} else if (process.env.NODE_ENV === "development" && !process.env.FORCE_POSTGRES && !process.env.DATABASE_URL) {
  console.log("📱 Usando SQLite para desarrollo local");
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./enrollments.sqlite",
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
    },
  });
} else if (process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
  console.log("🏭 Usando PostgreSQL para desarrollo");
  console.log("🔗 DATABASE_URL:", process.env.DATABASE_URL.replace(/\/\/.*@/, "//***:***@")); // Ocultar credenciales en logs
  
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
    dialectOptions: {
      ssl: process.env.NODE_ENV === "production" ? {
        require: false,
        rejectUnauthorized: false
      } : false
    }
  });
} else {
  console.log("📱 Usando SQLite en memoria (Docker - Modo Demo)");
  try {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      define: {
        timestamps: true,
        underscored: true,
      },
    });
  } catch (error) {
    console.log("⚠️ Error con SQLite, usando modo mock para demostración");
    // En caso de error, crear un mock de Sequelize
    sequelize = {
      authenticate: async () => {
        console.log("✅ Mock: Conexión simulada establecida");
        return true;
      },
      sync: async () => {
        console.log("✅ Mock: Modelos simulados sincronizados");
        return true;
      },
      define: () => {
        const mockModel = {
          create: async (data) => ({ id: Math.random().toString(36), ...data }),
          findAll: async () => [],
          findOne: async () => null,
          findByPk: async () => null,
          update: async () => [1],
          destroy: async () => 1,
          // Agregar métodos necesarios para el modelo
          init: () => {},
          addHook: () => {},
          removeHook: () => {},
          hasHook: () => false
        };
        
        // Agregar métodos de instancia
        mockModel.prototype = {
          save: async function() { return this; },
          update: async function(data) { Object.assign(this, data); return this; },
          destroy: async function() { return 1; },
          confirm: async function() { this.status = "Confirmed"; return this; },
          cancel: async function() { this.status = "Cancelled"; return this; },
          toJSON: function() { return this; }
        };
        
        return mockModel;
      }
    };
  }
}

/**
 * Función para probar la conexión
 */
const testConnection = async () => {
  let retries = 3;
  let delay = 2000;
  
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log("✅ Conexión a base de datos de inscripciones establecida correctamente");
      return true;
    } catch (error) {
      console.error(`❌ Intento ${4 - retries} - No se pudo conectar a la base de datos de inscripciones:`, error.message);
      retries--;
      
      if (retries > 0) {
        console.log(`⏳ Reintentando en ${delay/1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Incrementar delay exponencialmente
      }
    }
  }
  
  console.error("❌ No se pudo establecer conexión después de 3 intentos");
  return false;
};

/**
 * Función para sincronizar modelos
 */
const syncDatabase = async () => {
  try {
    // Primero probar la conexión
    const connected = await testConnection();
    if (!connected) {
      throw new Error("No se pudo establecer conexión a la base de datos");
    }
    
    await sequelize.sync({ force: false });
    console.log("✅ Modelos de inscripciones sincronizados correctamente");
  } catch (error) {
    console.error("❌ Error sincronizando modelos de inscripciones:", error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};