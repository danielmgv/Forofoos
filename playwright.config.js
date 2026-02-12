const { devices } = require('@playwright/test');

module.exports = {
  testDir: 'e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:3000',
    timeout: 120 * 1000,
    reuseExistingServer: false,
    env: { SMTP_ALLOW_INSECURE: 'true', LOG_DIR: process.env.LOG_DIR || 'logs' },
  },
};
