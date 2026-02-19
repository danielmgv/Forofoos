const { User, Proyecto } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const crypto = require('crypto');
const mailer = require('../utils/mailer');

// Muestra el formulario de login
exports.showLogin = (req, res) => {
  res.render('login', { error: null, showResend: false, email: '' });
};

// Procesa el formulario de login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });

    if (user && !user.is_verified) {
      return res.render('login', {
        error: 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja.',
        showResend: true,
        email: email,
      });
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.userId = user.id;
      req.session.username = user.username;
      return res.redirect('/home'); // Redirige al área privada
    }

    res.render('login', { error: 'Email o contraseña incorrectos', showResend: false, email: email });
  } catch (error) {
    next(error);
  }
};

// Muestra el formulario de registro
exports.showRegister = (req, res) => {
  res.render('register', { error: null });
};

// Procesa el registro de usuarios
exports.register = async (req, res, next) => {
  let { username, email, password } = req.body;
  username = username ? username.trim() : '';
  email = email ? email.trim() : '';
  password = password ? password : '';

  if (!username || !email || !password) {
    return res.render('register', { error: 'Todos los campos son obligatorios' });
  }

  // Validación básica de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.render('register', { error: 'El email no tiene un formato válido' });
  }

  // Validación mínima de contraseña
  if (password.length < 8) {
    return res.render('register', { error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  try {
    const existingUsers = await User.findAll({
      where: {
        [Op.or]: [{ email: email }, { username: username }],
      },
    });

    if (existingUsers.length > 0) {
      // Distinguir si existe por email o username
      const existsByEmail = existingUsers.some((u) => u.email === email);
      const existsByUsername = existingUsers.some((u) => u.username === username);
      if (existsByEmail) return res.render('register', { error: 'Ya existe un usuario con ese email' });
      if (existsByUsername) return res.render('register', { error: 'El nombre de usuario ya está en uso' });
      return res.render('register', { error: 'El usuario ya existe' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await User.create({
      username,
      email,
      password: hashed,
      verification_token: token,
      verification_expires: expires,
    });

    // Enviar email de verificación (si falla, mostramos mensaje genérico)
    const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;
    try {
      await mailer.sendVerificationEmail({ to: email, username, url: verifyUrl });
    } catch (e) {
      logger.warn('No se pudo enviar el email de verificación', { to: email, link: verifyUrl, err: e && e.message });
    }

    // Mostrar pantalla de registro con instrucción para verificar el email
    return res.status(200).render('register', { error: 'Cuenta creada. Revisa tu correo para confirmar la cuenta.' });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

// Verificar token de confirmación
exports.verify = async (req, res, next) => {
  const { token } = req.query;
  if (!token) return res.status(400).render('error', { message: 'Token inválido', error: {} });
  try {
    const user = await User.findOne({
      where: {
        verification_token: token,
        verification_expires: { [Op.gt]: new Date() },
      },
    });
    if (!user) return res.status(400).render('error', { message: 'Token inválido o expirado', error: {} });

    user.is_verified = true;
    user.verification_token = null;
    user.verification_expires = null;
    await user.save();

    return res.render('confirm', { message: 'Correo verificado. Ya puedes iniciar sesión.' });
  } catch (err) {
    next(err);
  }
};

// Reenviar verificación por email
exports.resendVerification = async (req, res, next) => {
  const { email } = req.body;
  if (!email) return res.status(400).render('register', { error: 'Proporciona un email válido' });
  try {
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(200).render('register', { error: 'Si la cuenta existe, recibirás un correo' });
    if (user.is_verified) return res.status(200).render('register', { error: 'La cuenta ya está verificada. Puedes iniciar sesión.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verification_token = token;
    user.verification_expires = expires;
    await user.save();

    const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;
    try {
      await mailer.sendVerificationEmail({ to: user.email, username: user.username, url: verifyUrl });
    } catch (e) {
      logger.warn('No se pudo enviar email de verificación (reenviar), link:', verifyUrl);
    }

    return res.status(200).render('register', { error: 'Si la cuenta existe recibirás un correo con el enlace de verificación.' });
  } catch (err) {
    next(err);
  }
};

// Cambiar contraseña (desde configuración)
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.redirect('/configuracion?error=Todos los campos son obligatorios');
  }

  if (newPassword !== confirmPassword) {
    return res.redirect('/configuracion?error=Las contraseñas nuevas no coinciden');
  }

  if (newPassword.length < 8) {
    return res.redirect('/configuracion?error=La nueva contraseña debe tener al menos 8 caracteres');
  }

  try {
    const user = await User.findByPk(req.session.userId);

    if (!user) {
      return res.redirect('/configuracion?error=Usuario no encontrado');
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.redirect('/configuracion?error=La contraseña actual es incorrecta');

    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashed });

    res.redirect('/configuracion?success=Contraseña actualizada correctamente');
  } catch (err) {
    next(err);
  }
};

// Mostrar perfil de usuario
exports.perfil = async (req, res, next) => {
  try {
    // Obtener datos del usuario
    const userProfile = await User.findByPk(req.session.userId, {
      attributes: ['id', 'username', 'email', 'createdAt', 'is_verified'],
    });

    if (!userProfile) {
      return res.redirect('/login');
    }

    // Obtener estadísticas (ej. total de proyectos)
    const totalProjects = await Proyecto.count({
      where: { usuario_id: req.session.userId },
    });

    res.render('perfil', {
      profile: { ...userProfile.get({ plain: true }), created_at: userProfile.createdAt },
      stats: { projects: totalProjects },
    });
  } catch (error) {
    next(error);
  }
};
