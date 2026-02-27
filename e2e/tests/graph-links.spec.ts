import { test, expect } from '@playwright/test';

test.describe('Graph Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('text=Demo Mode').click();
    await expect(page.locator('[id="3d-graph"] canvas')).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(3000);
  });

  test('should have a working graph canvas after demo load', async ({ page }) => {
    const canvas = page.locator('[id="3d-graph"] canvas');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    // Graph should take significant viewport area
    expect(box!.width).toBeGreaterThan(200);
  });

  test('should show Focus button for domain isolation', async ({ page }) => {
    const focusBtn = page.locator('button.control-btn', { hasText: 'Focus' });
    await expect(focusBtn).toBeVisible();
  });

  test('should show data flow view toggle', async ({ page }) => {
    const dataFlowBtn = page.locator('button.control-btn', { hasText: 'Data Flow' });
    await expect(dataFlowBtn).toBeVisible();
  });
});
