require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const authRoutes = require('./src/routes/authRoutes');
const logger = require('./src/utils/logger');
const { sequelize } = require('./src/models'); // Importar conexión Sequelize

// Motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));

// Servir assets estáticos (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de sesión (usa env vars)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 },
  })
);

// Middleware para hacer disponible la información del usuario en todas las vistas
app.use((req, res, next) => {
  res.locals.user = req.session.userId
    ? { id: req.session.userId, name: req.session.username }
    : null;
  res.locals.path = req.path;
  next();
});

// Security middleware: interceptar respuestas planas con "Error en el servidor" en la ruta de registro
// y reemplazarlas por la vista `register` con el mensaje estético.
app.use((req, res, next) => {
  const origSend = res.send;
  res.send = function (body) {
    try {
      if (
        (req.path === '/auth/register' || req.path === '/register') &&
        typeof body === 'string' &&
        body.trim() === 'Error en el servidor'
      ) {
        return res.status(200).render('register', {
          error: 'No se pudo crear la cuenta en este momento. Por favor inténtalo más tarde.',
        });
      }
    } catch (e) {
      logger.error('Error al interceptar response body', e);
    }
    return origSend.call(this, body);
  };
  next();
});

// Rutas
app.use('/', authRoutes);
app.use('/', require('./src/routes/home'));
app.use('/', require('./src/routes/publicaciones'));
app.use('/', require('./src/routes/proyectos'));
app.use('/', require('./src/routes/perfil'));
app.use('/', require('./src/routes/community'));
app.use('/', require('./src/routes/views'));

// Middleware global de errores (último middleware)
app.use(require('./src/middlewares/errorHandler'));

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
          const methods =
            route.methods && typeof route.methods === 'object'
              ? Object.keys(route.methods).join(',')
              : 'ALL';
          const pathStr = route.path || (route.regexp && route.regexp.source) || '<unknown>';
          routes.push(`${methods} ${pathStr}`);
        } else if (mw && mw.name === 'router' && mw.handle && mw.handle.stack) {
          // Router anidado: iterar sus capas internas
          mw.handle.stack.forEach((inner) => {
            const r = inner && (inner.route || (inner.handle && inner.handle.route));
            if (r) {
              const methods =
                r.methods && typeof r.methods === 'object'
                  ? Object.keys(r.methods).join(',')
                  : 'ALL';
              const pathStr = r.path || (r.regexp && r.regexp.source) || '<unknown>';
              routes.push(`${methods} ${pathStr}`);
            }
          });
        }
      });
      if (routes.length) console.log('[INFO] Rutas registradas:\n' + routes.join('\n'));
      else console.warn('[WARN] No se encontraron rutas registradas');
    } else {
      console.warn('[WARN] No hay router disponible, no se listan rutas');
    }
  } catch (err) {
    logger.warn('No se pudieron listar las rutas', err);
  }
};

// Exportar app para tests y server
module.exports = app;

// Iniciar servidor si este archivo se ejecuta directamente
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  
  // Sincronizar Sequelize (sin {force: true} para no borrar datos) y luego iniciar server
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Conexión a DB con Sequelize establecida.');
      app.listen(PORT, () => {
        console.log(`\n🚀 Servidor escuchando en http://localhost:${PORT}`);
        app.logRegisteredRoutes();
      });
    })
    .catch(err => console.error('❌ Error conectando a la DB:', err));
}
