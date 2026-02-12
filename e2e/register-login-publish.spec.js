const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

function uniqueEmail() {
  return `e2e_${Date.now()}@example.com`;
}

function readVerificationLinkFromLogs() {
  const logsDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(logsDir, `Log_app-${date}.log`);
  if (!fs.existsSync(file)) return null;
  const content = fs.readFileSync(file, 'utf8');
  // Buscar cualquier URL que contenga '/auth/verify?token='
  const m = content.match(/https?:\/\/[^\s]*\/auth\/verify\?token=[A-Za-z0-9]+/g);
  if (!m || !m.length) return null;
  return m[m.length - 1];
}

test('registro -> verify -> login -> publicar -> ver post', async ({ page }) => {
  const email = uniqueEmail();
  const username = `e2euser_${Date.now()}`;
  const password = 'password123';

  // Registro
  await page.goto('/register');
  await page.fill('#username', username);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);

  // Debe quedarse en registro con mensaje instructivo
  await expect(page.locator('#serverError')).toContainText('Revisa tu correo');

  // Leer link de verificación desde logs (reintentar un par de veces)
  let verifyUrl = null;
  for (let i = 0; i < 10; i++) {
    verifyUrl = readVerificationLinkFromLogs();
    if (verifyUrl) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  expect(verifyUrl).toBeTruthy();
  console.log('E2E: verifyUrl=', verifyUrl);

  // Visitar el link de verificación
  await page.goto(verifyUrl);
  await expect(page).toHaveURL(/\/auth\/verify/);
  await expect(page.locator('h2')).toContainText('Correo verificado');

  // Login
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);
  await expect(page).toHaveURL(/\/dashboard/);

  // Publicar
  const message = 'E2E mensaje ' + Date.now();
  await page.fill('textarea[name="contenido"]', message);
  await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);

  // Verificar post en el feed
  await expect(page.locator('.post-content')).toContainText('E2E mensaje');
});
