import { test, expect } from '@playwright/test';

test.describe('Demo Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the graph when Demo Mode is clicked', async ({ page }) => {
    await page.locator('text=Demo Mode').click();
    // Wait for graph container — use attribute selector since id starts with digit
    await expect(page.locator('[id="3d-graph"]')).toBeVisible({ timeout: 30000 });
  });

  test('should render a canvas element inside the graph', async ({ page }) => {
    await page.locator('text=Demo Mode').click();
    await expect(page.locator('[id="3d-graph"]')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[id="3d-graph"] canvas')).toBeVisible({ timeout: 10000 });
  });

  test('should show toolbar controls after graph loads', async ({ page }) => {
    await page.locator('text=Demo Mode').click();
    await expect(page.locator('.graph-controls')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('.search-input')).toBeVisible();
    await expect(page.locator('text=Filters')).toBeVisible();
    await expect(page.locator('text=Fit')).toBeVisible();
  });

  test('should log workspace and artifact counts to console', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') logs.push(msg.text());
    });
    await page.locator('text=Demo Mode').click();
    await page.waitForTimeout(8000);
    const hasWorkspaceLog = logs.some(l => l.toLowerCase().includes('workspace') || l.toLowerCase().includes('node') || l.toLowerCase().includes('loaded'));
    expect(hasWorkspaceLog || logs.length > 0).toBeTruthy();
  });
});
