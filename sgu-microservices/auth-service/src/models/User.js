const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

/**
 * Modelo de Usuario
 * Representa a los usuarios del sistema (alumnos y administrativos)
 */
const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Información básica
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50],
      },
    },

    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50],
      },
    },

    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 255], // Mínimo 6 caracteres antes de hashear
      },
    },

    // Rol del usuario
    role: {
      type: DataTypes.ENUM('student', 'admin'),
      allowNull: false,
      defaultValue: 'student',
    },

    // Estado del usuario
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },

    // Información adicional para estudiantes
    studentId: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      validate: {
        isValidStudentId(value) {
          if (value && !/^[A-Za-z0-9\-_]+$/.test(value)) {
            throw new Error(
              'ID de estudiante debe contener solo letras, números, guiones y guiones bajos'
            );
          }
        },
      },
    },

    // Fecha de último login
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Token de verificación de email (para futuras funcionalidades)
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['role'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

/**
 * Hook que se ejecuta antes de crear o actualizar un usuario
 * Hashea la contraseña si fue modificada
 */
User.beforeSave(async (user, options) => {
  // Solo hashear si la contraseña fue modificada
  if (user.changed('password')) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    user.password = await bcrypt.hash(user.password, saltRounds);
  }
});

/**
 * Método de instancia para verificar contraseña
 */
User.prototype.checkPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Método de instancia para obtener datos públicos del usuario
 */
User.prototype.toPublicJSON = function () {
  const userObj = this.toJSON();
  delete userObj.password;
  delete userObj.emailVerificationToken;
  return userObj;
};

/**
 * Método de instancia para actualizar último login
 */
User.prototype.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save();
};

module.exports = User;
