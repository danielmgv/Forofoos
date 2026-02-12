/* eslint-disable no-console */
// Logger simple y configurable por env (LOG_LEVEL). Niveles: error, warn, info, debug.
const fs = require('fs');
const path = require('path');

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const defaultLevel =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const currentLevel = defaultLevel in levels ? defaultLevel : 'debug';

function shouldLog(level) {
  return levels[level] <= levels[currentLevel];
}

// Directorio de logs configurable y creación si no existe
const logsDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
try {
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
} catch (err) {
  console.error('[LOGGER ERROR] No se pudo crear el directorio de logs:', err);
}

// Rotación por tamaño: configurable via LOG_MAX_SIZE (bytes). Por defecto 5MB.
const MAX_SIZE = parseInt(process.env.LOG_MAX_SIZE || '5242880', 10);

function getLogPath() {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(logsDir, `Log_app-${date}.log`);
}

function formatArgs(args) {
  return args
    .map((a) => {
      if (typeof a === 'string') return a;
      if (a instanceof Error) return a.stack || a.message;
      try {
        // Intentar serializar incluyendo propiedades no enumerables (por ejemplo Error)
        return JSON.stringify(a, Object.getOwnPropertyNames(a));
      } catch (e) {
        return String(a);
      }
    })
    .join(' ');
}

function rotateBySizeIfNeeded(currentPath) {
  try {
    if (!fs.existsSync(currentPath)) return;
    const stat = fs.statSync(currentPath);
    if (stat.size >= MAX_SIZE) {
      const ts = new Date().toISOString().replace(/[:.]/g, '-'); // safe timestamp
      const rotated = currentPath.replace(/\.log$/, `.${ts}.log`);
      fs.renameSync(currentPath, rotated);
      // Nota: no usamos logger.* aquí para evitar recursión; usamos console.log
      console.log('[LOGGER INFO] Rotated log file to', rotated);
    }
  } catch (err) {
    console.error('[LOGGER ERROR] Error checking/rotating log file:', err);
  }
}

function appendToFile(level, args) {
  const currentPath = getLogPath();
  // Rotar por tamaño antes de escribir
  rotateBySizeIfNeeded(currentPath);

  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
  const text = `${prefix} ${formatArgs(args)}`;
  fs.appendFile(currentPath, text + '\n', (err) => {
    if (err) console.error('[LOGGER ERROR] Could not write logs to file', err);
  });
}

module.exports = {
  error: (...args) => {
    if (shouldLog('error')) {
      console.error('[ERROR]', ...args);
      appendToFile('error', args);
    }
  },
  warn: (...args) => {
    if (shouldLog('warn')) {
      console.warn('[WARN]', ...args);
      appendToFile('warn', args);
    }
  },
  info: (...args) => {
    if (shouldLog('info')) {
      console.log('[INFO]', ...args);
      appendToFile('info', args);
    }
  },
  debug: (...args) => {
    if (shouldLog('debug')) {
      console.log('[DEBUG]', ...args);
      appendToFile('debug', args);
    }
  },
};
