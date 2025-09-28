const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * Modelo para Cursos - Versión Simplificada para SQLite
 */
const Course = sequelize.define(
  "Course",
  {
    // Información básica del curso
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Información académica
    department: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Configuración del curso
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },

    enrolled: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    // Costos
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },

    // Instructor
    professor: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Estado
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "ACTIVE",
    },

    isVisible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "courses",
    timestamps: true,
    indexes: [
      { fields: ["code"] },
      { fields: ["department"] },
      { fields: ["status"] },
    ],
  }
);

// Método para verificar disponibilidad
Course.prototype.isAvailable = function () {
  return (
    this.enrolled < this.capacity && this.status === "ACTIVE" && this.isVisible
  );
};

// Método para obtener cupos disponibles
Course.prototype.getAvailableSlots = function () {
  return this.capacity - this.enrolled;
};

module.exports = Course;
