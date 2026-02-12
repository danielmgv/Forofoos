require('dotenv').config();
const app = require('./app');
const logger = require('./src/utils/logger');
const db = require('./src/config/db');

// Handlers globales para capturar errores no manejados y asegurarnos de que
// se registren con detalle en los logs.
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason);
  process.exit(1);
});

async function checkDB() {
  try {
    await db.execute('SELECT 1');
    logger.info('DB connection OK');
  } catch (err) {
    logger.error('DB connection failed at startup', err);
    // In production we might want to fail hard; for now we only warn.
  }
}

const checkSMTPAtStartup = async () => {
  // In production we require a working SMTP configuration
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.SMTP_HOST) {
      logger.error('SMTP_HOST is not configured but is required in production. Aborting startup.');
      process.exit(1);
    }
    try {
      const nodemailer = require('nodemailer');
      const allowInsecure = process.env.SMTP_ALLOW_INSECURE === 'true';
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        tls: allowInsecure ? { rejectUnauthorized: false } : undefined,
      });
      await transporter.verify();
      logger.info('SMTP connection verified');
    } catch (err) {
      logger.error('SMTP verification failed at startup', err);
      process.exit(1);
    }
  } else {
    logger.debug('Skipping strict SMTP verification (not in production)');
  }
};

// Start sequence
(async function start() {
  try {
    await checkDB();
    await checkSMTPAtStartup();

    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || '0.0.0.0';

    app.listen(PORT, HOST, () => {
      logger.info(`🚀 Servidor corriendo en: http://${HOST}:${PORT}`);
      if (typeof app.logRegisteredRoutes === 'function') {
        try {
          app.logRegisteredRoutes();
        } catch (err) {
          logger.warn('No se pudieron listar las rutas:', err);
        }
      }
    });
  } catch (err) {
    logger.error('Startup failed', err);
    process.exit(1);
  }
})();
