import { test, expect, Page } from '@playwright/test';

// Test helper to capture screenshots at different states
async function captureViewportScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `screenshots/${name}.png`,
    fullPage: true
  });
}

test.describe('Admin Dashboard Responsive Design', () => {

  // Before each test, navigate to the admin dashboard
  // Note: This assumes authentication is handled or can be bypassed for testing
  test.beforeEach(async ({ page }) => {
    // Skip authentication for now - you may need to implement login
    await page.goto('/admin');

    // Wait for the dashboard to load
    await page.waitForTimeout(2000);
  });

  test('Mobile viewport (320px) - should display all components', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(1000);

    await captureViewportScreenshot(page, 'mobile-320px');

    // Check if key elements are visible
    const isHeaderVisible = await page.locator('text=Total Users').isVisible();
    console.log('Mobile 320px - Header visible:', isHeaderVisible);

    // Check if cards stack properly
    const cards = await page.locator('[class*="bg-white"][class*="rounded"]').count();
    console.log('Mobile 320px - Number of card elements:', cards);
  });

  test('Mobile viewport (375px) - iPhone SE', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    await captureViewportScreenshot(page, 'mobile-375px');

    // Test touch target sizes
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 5)) {
      const box = await button.boundingBox();
      if (box) {
        console.log(`Button size: ${box.width}x${box.height}`);
      }
    }
  });

  test('Mobile viewport (414px) - iPhone XR', async ({ page }) => {
    await page.setViewportSize({ width: 414, height: 896 });
    await page.waitForTimeout(1000);

    await captureViewportScreenshot(page, 'mobile-414px');
  });

  test('Tablet viewport (768px) - iPad', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    await captureViewportScreenshot(page, 'tablet-768px');

    // Check grid layout
    const gridContainer = await page.locator('[class*="grid"]').first();
    if (gridContainer) {
      const styles = await gridContainer.evaluate(el =>
        window.getComputedStyle(el).gridTemplateColumns
      );
      console.log('Tablet - Grid template columns:', styles);
    }
  });

  test('Tablet viewport (1024px)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);

    await captureViewportScreenshot(page, 'tablet-1024px');
  });

  test('Desktop viewport (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);

    await captureViewportScreenshot(page, 'desktop-1280px');
  });

  test('Desktop viewport (1920px) - Full HD', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    await captureViewportScreenshot(page, 'desktop-1920px');
  });

  test('Test collapsible sections on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Try to find and click collapsible sections
    const activitySection = page.locator('text=Recent Activity');
    if (await activitySection.isVisible()) {
      await activitySection.click();
      await page.waitForTimeout(500);
      await captureViewportScreenshot(page, 'mobile-activity-collapsed');
    }
  });

  test('Test horizontal scrolling issues', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Check if page has horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    console.log('Has horizontal scroll on mobile:', hasHorizontalScroll);

    if (hasHorizontalScroll) {
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      console.log(`Scroll width: ${scrollWidth}px, Client width: ${clientWidth}px, Overflow: ${scrollWidth - clientWidth}px`);
    }
  });

  test('Test chart responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);

    // Check if charts are visible and properly sized
    const charts = await page.locator('[class*="recharts"]').all();
    console.log('Number of charts found:', charts.length);

    for (let i = 0; i < charts.length; i++) {
      const box = await charts[i].boundingBox();
      if (box) {
        console.log(`Chart ${i + 1} size: ${box.width}x${box.height}`);
      }
    }
  });
});
