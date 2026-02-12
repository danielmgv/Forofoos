const db = require('../src/config/db');
const logger = require('../src/utils/logger');

(async function migrate() {
  try {
    const dbName = process.env.DB_NAME;
    if (!dbName) {
      logger.error('DB_NAME not set in env; aborting migration');
      process.exit(1);
    }

    const [rows] = await db.execute(
      "SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'verification_token'",
      [dbName]
    );

    if (rows && rows[0] && rows[0].cnt > 0) {
      logger.info('Migration already applied: verification_token exists');
      process.exit(0);
    }

    logger.info('Applying migration: adding verification columns to users');
    await db.execute("ALTER TABLE users ADD COLUMN verification_token VARCHAR(128) DEFAULT NULL, ADD COLUMN verification_expires DATETIME DEFAULT NULL, ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0");

    logger.info('Migration applied successfully');
    process.exit(0);
  } catch (err) {
    logger.error('Migration failed', err);
    process.exit(1);
  }
})();