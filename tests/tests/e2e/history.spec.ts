import { test, expect } from '@playwright/test';

const users = [
  { username: 'admin', password: 'admin123' },
  { username: 'patrick', password: 'patrickpw' },
  { username: 'taylor', password: 'taylorpw' },
  { username: 'logan', password: '' },
];

for (const user of users) {
  test(`history page visual regression for ${user.username}`, async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input#username', user.username);
    if (user.password) await page.fill('input#password', user.password);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.top-bar');
    await page.goto('http://localhost:5173/history');
    await page.waitForSelector('.weeks-list');
    await page.screenshot({ path: `tests/e2e/history-page-${user.username}.png`, fullPage: true });
    expect(await page.title()).toContain('Stock Pick Game');
  });
}

test('login and logout flow', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.fill('input#username', 'admin');
  await page.fill('input#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.logout-btn');
  await page.click('.logout-btn');
  await page.waitForURL('http://localhost:5173/login');
  expect(await page.url()).toContain('/login');
});

test('navigation to history and admin', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.fill('input#username', 'admin');
  await page.fill('input#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.top-bar');
  await page.goto('http://localhost:5173/history');
  expect(await page.locator('h1').textContent()).toContain('Game History');
  await page.goto('http://localhost:5173/admin');
  expect(await page.locator('h1').textContent()).toContain('Admin Panel');
});