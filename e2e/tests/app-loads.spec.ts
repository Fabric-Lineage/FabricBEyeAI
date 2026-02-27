import { test, expect } from '@playwright/test';

test.describe('App Loads', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.container')).toBeVisible();
  });

  test('should show Scan tenant and Demo Mode buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.scanButton')).toBeVisible();
    await expect(page.locator('text=Demo Mode')).toBeVisible();
  });

  test('should show the title text', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.title')).toContainText('FabricBEye');
  });

  test('should have no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });
});
