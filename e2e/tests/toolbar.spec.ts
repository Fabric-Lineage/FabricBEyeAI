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
    const pauseBtn = page.locator('button.control-btn', { hasText: /Pause|Resume/ });
    const initialText = await pauseBtn.textContent();
    await pauseBtn.click();
    await page.waitForTimeout(500);
    const newText = await pauseBtn.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('should toggle fog effect', async ({ page }) => {
    const fogBtn = page.locator('button.control-btn', { hasText: /Fog|No Fog/ });
    const initialText = await fogBtn.textContent();
    await fogBtn.click();
    await page.waitForTimeout(500);
    const newText = await fogBtn.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('should toggle link curvature', async ({ page }) => {
    const curveBtn = page.locator('button.control-btn', { hasText: /Straight|Curved/ });
    const initialText = await curveBtn.textContent();
    await curveBtn.click();
    await page.waitForTimeout(500);
    const newText = await curveBtn.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('should have export PNG button', async ({ page }) => {
    const exportBtn = page.locator('button.control-btn', { hasText: '📷' });
    await expect(exportBtn).toBeVisible();
  });
});
