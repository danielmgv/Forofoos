const { test, expect } = require('@playwright/test');

function uniqueEmail() {
  return `e2e_${Date.now()}@example.com`;
}

test('registro -> login -> publicar -> ver post', async ({ page }) => {
  const email = uniqueEmail();
  const password = 'password123';

  // Registro
  await page.goto('/register');
  await page.fill('#username', 'e2euser');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);
  await expect(page).toHaveURL(/\/login/);

  // Login
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
