const mongoose = require("mongoose");
require("dotenv").config();

/**
 * Configuración de conexión a MongoDB para Notifications Service
 */
class DatabaseConfig {
  constructor() {
    this.mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/sgu_notifications";
    this.options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
  }

  /**
   * Conectar a MongoDB
   */
  async connect() {
    try {
      await mongoose.connect(this.mongoUri, this.options);
      console.log(
        "✅ MongoDB conectado correctamente para Notifications Service"
      );
      console.log(`📁 Base de datos: ${this.mongoUri}`);
      return true;
    } catch (error) {
      console.error("❌ Error conectando a MongoDB:", error.message);
      return false;
    }
  }

  /**
   * Desconectar de MongoDB
   */
  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log("🔌 Conexión MongoDB cerrada");
    } catch (error) {
      console.error("❌ Error cerrando conexión MongoDB:", error.message);
    }
  }

  /**
   * Verificar estado de la conexión
   */
  getConnectionStatus() {
    return {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    };
  }
}

module.exports = new DatabaseConfig();
