const logger = require('./logger');

module.exports = {
  sendVerificationEmail: async ({ to, username, url }) => {
    const from = process.env.EMAIL_FROM || 'no-reply@forofoos.local';
    try {
      let nodemailer;
      try {
        nodemailer = require('nodemailer');
      } catch (e) {
        logger.warn('nodemailer not installed; logging verification link instead', { to, link: url });
        logger.info('Verification link:', url);
        return;
      }

      let transporter;

      // FIX: Permitir certificados inseguros por defecto (útil para desarrollo local/antivirus)
      // Solo se bloqueará si configuras explícitamente SMTP_ALLOW_INSECURE=false
      const allowInsecure = process.env.SMTP_ALLOW_INSECURE !== 'false';

      if (process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
          tls: allowInsecure ? { rejectUnauthorized: false } : undefined,
        });
      } else {
        // Crear cuenta de pruebas en Ethereal si no hay SMTP configurado
        logger.info('No SMTP config found, creating Ethereal test account...');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: testAccount,
          tls: allowInsecure ? { rejectUnauthorized: false } : undefined,
        });
      }

      const info = await transporter.sendMail({
        from,
        to,
        subject: 'Por favor confirma tu correo en ForoFoos',
        text: `Hola ${username},\n\nPor favor confirma tu correo visitando este enlace: ${url}\n\nSi no solicitaste esto, ignora este correo.`,
        html: `<p>Hola ${username},</p><p>Por favor confirma tu correo visitando este enlace: <a href="${url}">${url}</a></p><p>Si no solicitaste esto, ignora este correo.</p>`,
      });

      // Si es Ethereal, hay una URL de preview
      if (nodemailer.getTestMessageUrl && info) {
        logger.info('Email preview URL:', nodemailer.getTestMessageUrl(info));
      }

      logger.info('Verification email sent to', to);
      return info;
    } catch (err) {
      // Detect self-signed certificate / TLS errors and provide actionable guidance
      if (
        err &&
        (err.code === 'ESOCKET' || (err.message && err.message.toLowerCase().includes('self-signed')))
      ) {
        logger.error('sendVerificationEmail error (TLS)', err);
        logger.warn('TLS error detected when connecting to SMTP. Possible causes: self-signed certificate or rejected TLS handshake.');
        logger.warn('Quick fixes (development only):');
        logger.warn('- Set `SMTP_ALLOW_INSECURE=true` in your `.env` to allow insecure TLS (NOT recommended for production).');
        logger.warn(
          "- Or add your CA to Node's trust store and restart the app: set environment variable `NODE_EXTRA_CA_CERTS='C:\\path\\to\\ca.pem'` (Windows PowerShell) or `NODE_EXTRA_CA_CERTS=/path/to/ca.pem` (Linux/macOS)."
        );
        logger.warn('- For production, use a SMTP provider with a valid CA-signed certificate (SendGrid, SES, etc.).');
      } else {
        logger.error('sendVerificationEmail error', err);
      }
      throw err;
    }
  },
};