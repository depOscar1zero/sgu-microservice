const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Configuración de MongoDB
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sgu_courses';
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`MongoDB conectado: ${conn.connection.host}`);
    console.log(`Base de datos: ${conn.connection.name}`);
    
    // Eventos de conexión
    mongoose.connection.on('error', (err) => {
      console.error('Error de conexión MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB desconectado');
    });

    return conn;
  } catch (error) {
    console.error('Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

/**
 * Cerrar conexión de MongoDB
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('Conexión MongoDB cerrada');
  } catch (error) {
    console.error('Error cerrando conexión MongoDB:', error);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};