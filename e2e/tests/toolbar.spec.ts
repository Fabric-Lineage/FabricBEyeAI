import { test, expect } from '@playwright/test';

test.describe('Toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('text=Demo Mode').click();
    await expect(page.locator('.graph-controls')).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(2000);
  });

  test('should accept search input', async ({ page }) => {
    const searchInput = page.locator('.search-input');
    await searchInput.fill('Sales');
    await expect(searchInput).toHaveValue('Sales');
  });

  test('should toggle pause/resume simulation', async ({ page }) => {
    const pauseBtn = page.locator('button.control-btn.icon-only', { hasText: /▶️|⏸️/ });
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();
    await page.waitForTimeout(500);
  });

  test('should have export PNG button', async ({ page }) => {
    const exportBtn = page.locator('button.control-btn.icon-only', { hasText: '📷' });
    await expect(exportBtn).toBeVisible();
  });

  test('should have core toolbar buttons', async ({ page }) => {
    await expect(page.locator('button.control-btn', { hasText: 'Fit' })).toBeVisible();
    await expect(page.locator('button.control-btn', { hasText: 'Focus' })).toBeVisible();
    await expect(page.locator('button.control-btn', { hasText: 'Legend' })).toBeVisible();
    await expect(page.locator('button.control-btn', { hasText: 'Data Flow' })).toBeVisible();
    await expect(page.locator('button.control-btn', { hasText: 'Endorsements' })).toBeVisible();
    await expect(page.locator('button.control-btn', { hasText: 'Filters' })).toBeVisible();
  });
});
