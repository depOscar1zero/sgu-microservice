const mongoose = require("mongoose");
const logger = require("../utils/logger");

class DatabaseConfig {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const mongoUri =
        process.env.MONGODB_URI ||
        "mongodb://localhost:27017/sgu_notifications";

      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0,
      };

      this.connection = await mongoose.connect(mongoUri, options);

      logger.info("MongoDB connected successfully", {
        service: "Notifications Service",
        database: this.connection.connection.name,
        host: this.connection.connection.host,
        port: this.connection.connection.port,
      });

      // Event listeners
      mongoose.connection.on("error", (error) => {
        logger.error("MongoDB connection error:", error);
      });

      mongoose.connection.on("disconnected", () => {
        logger.warn("MongoDB disconnected");
      });

      mongoose.connection.on("reconnected", () => {
        logger.info("MongoDB reconnected");
      });

      return this.connection;
    } catch (error) {
      logger.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        logger.info("MongoDB disconnected successfully");
      }
    } catch (error) {
      logger.error("Error disconnecting from MongoDB:", error);
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.connect();
      await this.disconnect();
      return true;
    } catch (error) {
      logger.error("Database connection test failed:", error);
      return false;
    }
  }

  getConnection() {
    return this.connection;
  }
}

module.exports = new DatabaseConfig();
