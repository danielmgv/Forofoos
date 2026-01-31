require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const authRoutes = require('./src/routes/authRoutes');

// Motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));

// Configuración de sesión (usa env vars)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 },
  })
);

// Rutas
app.use('/', authRoutes);
app.use('/', require('./src/routes/publicaciones'));

// Loguear rutas en startup (temporal)
setImmediate(() => {
  try {
    const routes = [];
    app._router.stack.forEach((mw) => {
      if (mw.route) {
        const methods = Object.keys(mw.route.methods).join(',');
        routes.push(`${methods} ${mw.route.path}`);
      }
    });
    console.log('[INFO] Rutas registradas:\n' + routes.join('\n'));
  } catch (err) {
    console.error('[WARN] No se pudieron listar las rutas', err);
  }
});

// Exportar app para tests y server
module.exports = app;
