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
console.log('[DEBUG] Registrando authRoutes...');
app.use('/', authRoutes);
console.log('[DEBUG] authRoutes registradas');
console.log('[DEBUG] app._router after authRoutes:', !!app._router, typeof app._router);
console.log('[DEBUG] Registrando publicaciones route...');
app.use('/', require('./src/routes/publicaciones'));
console.log('[DEBUG] publicaciones registradas');
console.log('[DEBUG] app._router after publicaciones:', !!app._router, typeof app._router);

// Loguear rutas en startup (temporal)
// Función pública para listar rutas. Se debe llamar después de arrancar el servidor (ej. desde server.js)
app.logRegisteredRoutes = () => {
  try {
    const routes = [];
    // Compatibilidad: Express 4 usa app._router, Express 5 usa app.router
    const stack = (app._router && app._router.stack) || (app.router && app.router.stack);
    if (stack && Array.isArray(stack)) {
      stack.forEach((mw) => {
        // En Express 5 los layers no exponen directamente `route`, hay que comprobar mw.route o mw.handle.route
        const route = mw && (mw.route || (mw.handle && mw.handle.route));
        if (route) {
          const methods = Object.keys(route.methods).join(',');
          routes.push(`${methods} ${route.path}`);
        } else if (mw && mw.name === 'router' && mw.handle && mw.handle.stack) {
          // Router anidado: iterar sus capas internas
          mw.handle.stack.forEach((inner) => {
            const r = inner && (inner.route || (inner.handle && inner.handle.route));
            if (r) routes.push(`${Object.keys(r.methods).join(',')} ${r.path}`);
          });
        }
      });
      if (routes.length) console.log('[INFO] Rutas registradas:\n' + routes.join('\n'));
      else console.warn('[WARN] No se encontraron rutas registradas');
    } else {
      console.warn('[WARN] No hay router disponible, no se listan rutas');
    }
  } catch (err) {
    console.error('[WARN] No se pudieron listar las rutas', err);
  }
};

// Exportar app para tests y server
module.exports = app;
