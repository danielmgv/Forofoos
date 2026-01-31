const db = require('../config/db');
const bcrypt = require('bcrypt');

// Muestra el formulario de login
exports.showLogin = (req, res) => {
  res.render('login', { error: null });
};

// Procesa el formulario de login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.userId = user.id;
      req.session.username = user.username;
      return res.redirect('/dashboard'); // Redirige al área privada
    }

    res.render('login', { error: 'Email o contraseña incorrectos' });
  } catch (error) {
    res.status(500).send('Error en el servidor');
  }
};

// Muestra el formulario de registro
exports.showRegister = (req, res) => {
  res.render('register', { error: null });
};

// Procesa el registro de usuarios
exports.register = async (req, res) => {
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
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length) {
      return res.render('register', { error: 'Ya existe un usuario con ese email' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await db.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [
      username,
      email,
      hashed,
    ]);
    res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en el servidor');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
};
