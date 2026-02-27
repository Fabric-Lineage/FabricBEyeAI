import { test, expect } from '@playwright/test';

test.describe('Domain Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('text=Demo Mode').click();
    await expect(page.locator('.graph-controls')).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(2000);
  });

  test('should open the filter panel', async ({ page }) => {
    await page.locator('button.control-btn', { hasText: 'Filters' }).click();
    await expect(page.locator('.filter-panel')).toBeVisible({ timeout: 5000 });
  });

  test('should show domain filter options in the panel', async ({ page }) => {
    await page.locator('button.control-btn', { hasText: 'Filters' }).click();
    await expect(page.locator('.filter-panel')).toBeVisible({ timeout: 5000 });
    // Filter panel should have checkboxes or toggle controls
    const filterContent = await page.locator('.filter-panel').textContent();
    expect(filterContent).toBeTruthy();
  });

  test('should toggle Focus mode on and off', async ({ page }) => {
    const focusBtn = page.locator('button.control-btn', { hasText: 'Focus' });
    await focusBtn.click();
    // Focus mode should activate (button gets 'active' class)
    await expect(focusBtn).toHaveClass(/active/, { timeout: 3000 });
    // Click again to deactivate
    await focusBtn.click();
    await page.waitForTimeout(500);
  });
});
