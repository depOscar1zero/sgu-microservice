const User = require('../models/User');
const { generateToken } = require('../config/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');

/**
 * Registro de nuevo usuario
 */
const register = catchAsync(async (req, res) => {
  const { firstName, lastName, email, password, role, studentId } = req.body;

  // Validaciones básicas
  if (!firstName || !lastName || !email || !password) {
    throw new AppError('Todos los campos son requeridos', 400);
  }

  // Verificar si el email ya existe
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError('El email ya está registrado', 409);
  }

  // Si es estudiante, verificar que tenga studentId
  if (role === 'student' && !studentId) {
    throw new AppError('Los estudiantes deben proporcionar un ID de estudiante', 400);
  }

  // Crear el usuario
  const userData = {
    firstName,
    lastName,
    email,
    password,
    role: role || 'student'
  };

  if (studentId) {
    userData.studentId = studentId;
  }

  const user = await User.create(userData);

  // Generar token
  const token = generateToken(user.id, user.role);

  res.status(201).json({
    success: true,
    message: 'Usuario registrado exitosamente',
    data: {
      user: user.toPublicJSON(),
      token
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Inicio de sesión
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Validar campos requeridos
  if (!email || !password) {
    throw new AppError('Email y contraseña son requeridos', 400);
  }

  // Buscar usuario por email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError('Credenciales inválidas', 401);
  }

  // Verificar si el usuario está activo
  if (!user.isActive) {
    throw new AppError('Usuario inactivo', 401);
  }

  // Verificar contraseña
  const isPasswordValid = await user.checkPassword(password);
  if (!isPasswordValid) {
    throw new AppError('Credenciales inválidas', 401);
  }

  // Actualizar último login
  await user.updateLastLogin();

  // Generar token
  const token = generateToken(user.id, user.role);

  res.status(200).json({
    success: true,
    message: 'Inicio de sesión exitoso',
    data: {
      user: user.toPublicJSON(),
      token
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Obtener perfil del usuario autenticado
 */
const getProfile = catchAsync(async (req, res) => {
  // El middleware de auth ya validó el token y puso el userId en req.user
  const user = await User.findByPk(req.user.userId);
  
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      user: user.toPublicJSON()
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Refrescar token
 */
const refreshToken = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.user.userId);
  
  if (!user || !user.isActive) {
    throw new AppError('Usuario no válido', 401);
  }

  // Generar nuevo token
  const token = generateToken(user.id, user.role);

  res.status(200).json({
    success: true,
    message: 'Token renovado exitosamente',
    data: {
      token
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Cambiar contraseña
 */
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Contraseña actual y nueva son requeridas', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('La nueva contraseña debe tener al menos 6 caracteres', 400);
  }

  const user = await User.findByPk(req.user.userId);
  
  // Verificar contraseña actual
  const isCurrentPasswordValid = await user.checkPassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError('Contraseña actual incorrecta', 400);
  }

  // Actualizar contraseña
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Contraseña actualizada exitosamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = {
  register,
  login,
  getProfile,
  refreshToken,
  changePassword
};