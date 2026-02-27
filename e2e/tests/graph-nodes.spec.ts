import { test, expect } from '@playwright/test';

test.describe('Graph Nodes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('text=Demo Mode').click();
    await expect(page.locator('[id="3d-graph"] canvas')).toBeVisible({ timeout: 30000 });
    // Let the force simulation settle
    await page.waitForTimeout(3000);
  });

  test('should render the 3D graph canvas', async ({ page }) => {
    const canvas = page.locator('[id="3d-graph"] canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);
  });

  test('should have graph controls visible', async ({ page }) => {
    await expect(page.locator('.graph-controls')).toBeVisible();
  });

  test('should display the Fit button for zoom-to-fit', async ({ page }) => {
    const fitBtn = page.locator('button.control-btn', { hasText: 'Fit' });
    await expect(fitBtn).toBeVisible();
  });
});
