const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const logger = require('../src/utils/logger');

(async function init() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'db-init.sql'), 'utf8');
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      logger.info('Executing SQL:', stmt.slice(0, 80) + (stmt.length > 80 ? '...' : ''));
      await db.execute(stmt);
    }

    logger.info('DB initialization completed');
    process.exit(0);
  } catch (err) {
    logger.error('DB initialization failed', err);
    process.exit(1);
  }
})();