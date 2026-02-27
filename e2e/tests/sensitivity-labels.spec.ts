import { test, expect } from '@playwright/test';

test.describe('Sensitivity Labels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('text=Demo Mode').click();
    await expect(page.locator('[id="3d-graph"] canvas')).toBeVisible({ timeout: 30000 });
    // Wait for graph to fully render and settle
    await page.waitForTimeout(5000);
  });

  test('should render graph with canvas', async ({ page }) => {
    const canvas = page.locator('[id="3d-graph"] canvas');
    await expect(canvas).toBeVisible();
  });

  test('should show Show Unassigned button with badge', async ({ page }) => {
    const unassignedBtn = page.locator('button.control-btn', { hasText: /Show Unassigned|Hide Unassigned/ });
    await expect(unassignedBtn).toBeVisible();
  });

  test('should have toolbar buttons for graph interaction', async ({ page }) => {
    // Verify all critical toolbar buttons exist
    await expect(page.locator('button.control-btn', { hasText: 'Fit' })).toBeVisible();
    await expect(page.locator('button.control-btn', { hasText: /Fog|No Fog/ })).toBeVisible();
    await expect(page.locator('button.control-btn', { hasText: 'Filters' })).toBeVisible();
  });
});
