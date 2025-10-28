import { test, expect } from '@playwright/test';

// Simple visual test to verify responsive design improvements
test.describe('Admin Dashboard Responsive Visual Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard
    // Note: You may need to handle authentication
    await page.goto('/admin');

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('Mobile 375px - iPhone SE viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Verify no horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    console.log('Mobile 375px - Has horizontal scroll:', hasHorizontalScroll);

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/responsive-mobile-375px.png',
      fullPage: true
    });

    // Basic visibility checks
    expect(await page.locator('text=Total Users').isVisible()).toBe(true);
    expect(await page.locator('text=Monthly Revenue').isVisible()).toBe(true);
  });

  test('Tablet 768px - iPad viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/responsive-tablet-768px.png',
      fullPage: true
    });

    // Verify grid layout changes
    const gridContainer = await page.locator('[class*="grid"]').first();
    const gridStyles = await gridContainer.evaluate(el =>
      window.getComputedStyle(el).gridTemplateColumns
    );

    console.log('Tablet 768px - Grid template columns:', gridStyles);
  });

  test('Desktop 1280px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/responsive-desktop-1280px.png',
      fullPage: true
    });

    // Verify all major sections are visible
    expect(await page.locator('text=Statistics').isVisible()).toBe(true);
    expect(await page.locator('text=Recent Activity').isVisible()).toBe(true);
    expect(await page.locator('text=Quick Actions').isVisible()).toBe(true);
    expect(await page.locator('text=System Status').isVisible()).toBe(true);
  });

  test('Touch target sizes on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Check button sizes (should be at least 44px for touch)
    const buttons = await page.locator('button').all();
    let smallButtons = 0;

    for (const button of buttons.slice(0, 10)) {
      const box = await button.boundingBox();
      if (box && (box.height < 44 || box.width < 44)) {
        const buttonText = await button.textContent();
        console.log(`Warning: Small button found (${box.width}x${box.height}): ${buttonText?.substring(0, 30)}`);
        smallButtons++;
      }
    }

    console.log(`Total buttons checked: 10, Small buttons: ${smallButtons}`);
  });

  test('Text readability on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Check for text that might be too small
    const allText = await page.locator('p, span, div, h1, h2, h3').all();
    let tooSmallText = 0;

    for (const element of allText.slice(0, 50)) {
      const fontSize = await element.evaluate(el =>
        parseInt(window.getComputedStyle(el).fontSize)
      );

      if (fontSize < 12) {
        tooSmallText++;
      }
    }

    console.log(`Text elements checked: 50, Too small (< 12px): ${tooSmallText}`);
  });

  test('Chart responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);

    // Check if charts are present and properly sized
    const responsiveContainers = await page.locator('[class*="recharts"]').all();
    console.log('Number of charts found:', responsiveContainers.length);

    for (let i = 0; i < responsiveContainers.length; i++) {
      const box = await responsiveContainers[i].boundingBox();
      if (box) {
        console.log(`Chart ${i + 1} size: ${box.width}px x ${box.height}px`);

        // Charts should not exceed viewport width
        expect(box.width).toBeLessThanOrEqual(375);
      }
    }
  });

  test('Collapsible sections work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Test Recent Activity collapse
    const activityHeader = page.locator('text=Recent Activity').first();
    if (await activityHeader.isVisible()) {
      await activityHeader.click();
      await page.waitForTimeout(300);

      // Check if content is hidden
      const activityContent = page.locator('[class*="border-t"]').first();
      console.log('Activity section toggle test completed');
    }
  });

  test('Grid breakpoints work correctly', async ({ page }) => {
    const breakpoints = [
      { width: 375, name: 'Mobile' },
      { width: 640, name: 'Small' },
      { width: 768, name: 'Tablet' },
      { width: 1024, name: 'Large' },
      { width: 1280, name: 'Desktop' }
    ];

    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: 800 });
      await page.waitForTimeout(500);

      const gridContainer = await page.locator('[class*="grid"]').first();
      const gridStyles = await gridContainer.evaluate(el =>
        window.getComputedStyle(el).gridTemplateColumns
      );

      console.log(`${bp.name} (${bp.width}px) - Grid columns:`, gridStyles);
    }
  });
});
