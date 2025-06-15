import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Go to home page
  await page.goto('http://localhost:5173/');

  // Click the 'Login' link in the top right
  try {
    await page.waitForSelector('text=Login', { timeout: 10000 });
    await page.click('text=Login');
  } catch (error) {
    await page.screenshot({ path: 'test-results/login-link-not-found.png' });
    throw new Error('Login link not found');
  }

  // Wait for the username and password fields to be visible (using data-testid)
  try {
    await page.waitForSelector('[data-testid="login-username"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="login-password"]', { timeout: 10000 });
  } catch (error) {
    await page.screenshot({ path: 'test-results/login-fields-not-found.png' });
    throw new Error('Login fields not found');
  }

  // Fill in credentials
  await page.fill('[data-testid="login-username"]', 'admin');
  await page.fill('[data-testid="login-password"]', 'admin123');

  // Wait for the login button and click it (using data-testid)
  try {
    await page.waitForSelector('[data-testid="login-submit"]', { timeout: 10000 });
    await page.click('[data-testid="login-submit"]');
  } catch (error) {
    await page.screenshot({ path: 'test-results/login-button-not-found.png' });
    throw new Error('Login button not found');
  }

  // Wait for login success indicator (text 'Logged in as')
  try {
    await page.waitForSelector('text=Logged in as', { timeout: 10000 });
  } catch (error) {
    await page.screenshot({ path: 'test-results/login-failed.png' });
    throw new Error('Login did not succeed');
  }

  // Reload the page to ensure the main view updates after login
  await page.reload();
});

test('should submit a pick successfully', async ({ page }) => {
  // Go to main page
  await page.goto('http://localhost:5173/');
  
  // Wait for the current week section to load
  try {
    await page.waitForSelector('[data-testid="current-week-section"]', { timeout: 10000 });
    await page.screenshot({ path: 'test-results/after-current-week-section.png' });
  } catch (error) {
    await page.screenshot({ path: 'test-results/current-week-not-found.png' });
    throw error;
  }
  
  // Ensure the pick input is present before filling
  const pickInput = await page.$('[data-testid="pick-symbol"]');
  if (!pickInput) {
    await page.screenshot({ path: 'test-results/pick-input-not-found.png' });
    throw new Error('Pick input not found');
  }
  // Scroll to the pick input before filling
  await pickInput.scrollIntoViewIfNeeded();
  // Fill in the pick form (only symbol field for current week)
  await pickInput.fill('AAPL');
  
  // Scroll to the submit button before clicking
  const submitButton = await page.$('button[type="submit"]');
  if (!submitButton) {
    await page.screenshot({ path: 'test-results/submit-button-not-found.png' });
    throw new Error('Submit button not found');
  }
  await submitButton.scrollIntoViewIfNeeded();

  // Take screenshot before submission
  await page.screenshot({ path: 'test-results/before-submission.png' });
  
  // Submit the pick
  await submitButton.click();
  
  // Wait for success message
  try {
    await page.waitForSelector('.success-message', { timeout: 10000 });
  } catch (error) {
    await page.screenshot({ path: 'test-results/submission-failed.png' });
    throw error;
  }
  
  // Take screenshot after successful submission
  await page.screenshot({ path: 'test-results/after-submission.png' });
  
  // Verify the pick appears in the current week section
  const pickElement = await page.locator('.current-week .pick-item');
  await expect(pickElement).toContainText('AAPL');
});

test('should show error for invalid symbol', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('[data-testid="current-week-section"]', { timeout: 10000 });
  
  // Try to submit with invalid symbol
  await page.fill('[data-testid="pick-symbol"]', 'INVALID');
  await page.fill('input[name="price"]', '150.00');
  await page.click('button[type="submit"]');
  
  // Take screenshot of error state
  await page.screenshot({ path: 'test-results/invalid-symbol-error.png' });
  
  // Verify error message
  const errorMessage = await page.locator('.error-message');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('Invalid symbol');
});

test('should show error for invalid price', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('[data-testid="current-week-section"]', { timeout: 10000 });
  
  // Try to submit with invalid price
  await page.fill('[data-testid="pick-symbol"]', 'AAPL');
  await page.fill('input[name="price"]', '-150.00');
  await page.click('button[type="submit"]');
  
  // Take screenshot of error state
  await page.screenshot({ path: 'test-results/invalid-price-error.png' });
  
  // Verify error message
  const errorMessage = await page.locator('.error-message');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('Invalid price');
});

test('should prevent submitting multiple picks for the same week', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('[data-testid="current-week-section"]', { timeout: 10000 });
  
  // Submit first pick
  await page.fill('[data-testid="pick-symbol"]', 'AAPL');
  await page.fill('input[name="price"]', '150.00');
  await page.click('button[type="submit"]');
  
  try {
    await page.waitForSelector('.success-message', { timeout: 10000 });
  } catch (error) {
    await page.screenshot({ path: 'test-results/first-pick-failed.png' });
    throw error;
  }
  
  // Take screenshot after first pick
  await page.screenshot({ path: 'test-results/after-first-pick.png' });
  
  // Try to submit another pick
  await page.fill('[data-testid="pick-symbol"]', 'MSFT');
  await page.fill('input[name="price"]', '300.00');
  await page.click('button[type="submit"]');
  
  // Take screenshot of duplicate pick error
  await page.screenshot({ path: 'test-results/duplicate-pick-error.png' });
  
  // Verify error message
  const errorMessage = await page.locator('.error-message');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('already submitted');
}); 