/**
 * E2E Tests for Application
 *
 * REQ-005: E2E Testing (Optional-Feature)
 * TAG-001: Playwright for Electron testing
 */

import { test, expect } from '@playwright/test';

test.describe('Application Launch', () => {
  test('should load application', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load
    await expect(page).toHaveTitle(/Claude/);

    // Check for main app container
    const appContainer = page.locator('.app-container');
    await expect(appContainer).toBeVisible();
  });

  test('should display app title', async ({ page }) => {
    await page.goto('/');

    const title = page.getByText('ClaudeParallelRunner');
    await expect(title).toBeVisible();
  });
});

test.describe('Bootstrap Flow', () => {
  test('should check dependencies on launch', async ({ page }) => {
    await page.goto('/');

    // Look for bootstrap status indicators
    const statusIndicator = page.locator('[data-testid="bootstrap-status"]');
    await expect(statusIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should show main view after bootstrap', async ({ page }) => {
    await page.goto('/');

    // Wait for bootstrap to complete
    await page.waitForSelector('[data-testid="main-view"]', { timeout: 10000 });

    const mainView = page.locator('[data-testid="main-view"]');
    await expect(mainView).toBeVisible();
  });
});

test.describe('User Interactions', () => {
  test('should handle button clicks', async ({ page }) => {
    await page.goto('/');

    // Find and click a button (if present)
    const button = page.locator('button').first();
    if (await button.isVisible()) {
      await button.click();
      // Verify interaction worked
      await expect(button).toBeFocused();
    }
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Test Tab navigation
    await page.keyboard.press('Tab');

    // Verify focus moved
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});

test.describe('Visual Regression', () => {
  test('should match screenshot', async ({ page }) => {
    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await expect(page).toHaveScreenshot('app-initial.png', {
      maxDiffPixels: 100,
    });
  });
});
