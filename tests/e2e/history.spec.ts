import { test, expect } from '@playwright/test';

test('history page visual regression', async ({ page }) => {
  // Go to login page
  await page.goto('http://localhost:5173/login');
  await page.fill('input#username', 'admin');
  await page.fill('input#password', 'admin123');
  await page.click('button[type="submit"]');
  // Wait for redirect to home
  await page.waitForURL('http://localhost:5173/');
  // Go to history page
  await page.goto('http://localhost:5173/history');
  // Wait for the table to load
  await page.waitForSelector('table.weeks-table');
  // Take a screenshot
  await page.screenshot({ path: 'frontend/tests/e2e/history-page.png', fullPage: true });
  // Optionally, assert something on the page
  expect(await page.title()).toContain('Stock Pick Game');
});