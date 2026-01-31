require('dotenv').config();
const app = require('./app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  logger.info(`🚀 Servidor corriendo en: http://${HOST}:${PORT}`);
});
