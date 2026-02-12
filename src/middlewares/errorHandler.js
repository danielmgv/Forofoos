const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const safeMessage =
    status === 500
      ? 'Ha ocurrido un error en el servidor. Por favor intenta más tarde.'
      : err.message || 'Ha ocurrido un error.';

  // Log completo para devops/console
  logger.error(err);

  // Si la petición pertenece al flujo de registro, renderizamos la misma vista
  // para mantener la estética y UX (sin redirigir a una página distinta)
  if (req && req.path && ['/auth/register', '/register'].includes(req.path)) {
    return res.status(200).render('register', {
      error: 'No se pudo crear la cuenta en este momento. Por favor inténtalo más tarde.',
    });
  }

  if (req && req.path === '/auth/resend-verification') {
    return res.status(200).render('register', {
      error: 'No se pudo reenviar el correo en este momento. Por favor inténtalo más tarde.',
    });
  }

  // Soporta HTML y JSON según lo que el cliente acepte
  if (req.accepts('html')) {
    res.status(status).render('error', {
      message: safeMessage,
      error: process.env.NODE_ENV === 'development' ? err : {},
      status,
    });
  } else {
    res.status(status).json({ error: safeMessage });
  }
};