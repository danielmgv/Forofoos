/* eslint-disable no-console */
// Logger simple y configurable por env (LOG_LEVEL). Niveles: error, warn, info, debug.
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const defaultLevel =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const currentLevel = defaultLevel in levels ? defaultLevel : 'debug';

function shouldLog(level) {
  return levels[level] <= levels[currentLevel];
}

module.exports = {
  error: (...args) => {
    if (shouldLog('error')) console.error('[ERROR]', ...args);
  },
  warn: (...args) => {
    if (shouldLog('warn')) console.warn('[WARN]', ...args);
  },
  info: (...args) => {
    if (shouldLog('info')) console.log('[INFO]', ...args);
  },
  debug: (...args) => {
    if (shouldLog('debug')) console.log('[DEBUG]', ...args);
  },
};
