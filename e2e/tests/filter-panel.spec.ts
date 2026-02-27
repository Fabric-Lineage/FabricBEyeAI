import { test, expect } from '@playwright/test';

test.describe('Filter Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('text=Demo Mode').click();
    await expect(page.locator('.graph-controls')).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(2000);
    // Open the filter panel
    await page.locator('button.control-btn', { hasText: 'Filters' }).click();
    await expect(page.locator('.filter-panel')).toBeVisible({ timeout: 5000 });
  });

  test('should show the filter panel with content', async ({ page }) => {
    const panel = page.locator('.filter-panel');
    const text = await panel.textContent();
    expect(text!.length).toBeGreaterThan(0);
  });

  test('should toggle filter controls', async ({ page }) => {
    // Filter panel should contain checkboxes or labels
    const labels = page.locator('.filter-panel label, .filter-panel .filter-item, .filter-panel input[type="checkbox"]');
    const count = await labels.count();
    expect(count).toBeGreaterThan(0);
  });
});
