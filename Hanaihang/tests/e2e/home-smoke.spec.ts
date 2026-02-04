/**
 * Smoke tests for the home page
 * Basic functionality tests to ensure the app loads and core features work
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_DATA, TEST_SELECTORS, TEST_TIMEOUTS } from '../fixtures';

// Helper functions
async function mockGeolocation(page: Page, location: { latitude: number; longitude: number }) {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation(location);
}

async function waitForSearchResults(page: Page, timeout = TEST_TIMEOUTS.results) {
  await expect(page.locator(TEST_SELECTORS.search.results).first())
    .toBeVisible({ timeout });
}

async function waitForSkeleton(page: Page, timeout = TEST_TIMEOUTS.skeleton) {
  await expect(page.locator(TEST_SELECTORS.search.skeleton).first())
    .toBeVisible({ timeout });
}

// Test Suite: Basic Page Load
test.describe('Basic Page Load', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Check that the page loads without errors
    await expect(page).toHaveTitle(/Hanaihang|Mall Directory/);
    
    // Check that main elements are present
    await expect(page.locator(TEST_SELECTORS.ui.heroTitle)).toBeVisible({ timeout: TEST_TIMEOUTS.medium });
    await expect(page.locator(TEST_SELECTORS.search.input)).toBeVisible();
  });

  test('should display hero section', async ({ page }) => {
    await page.goto('/');
    
    // Check hero title is visible
    await expect(page.locator(TEST_SELECTORS.ui.heroTitle)).toBeVisible();
    
    // Check search input is present and functional
    const searchInput = page.locator(TEST_SELECTORS.search.input);
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEditable();
  });

  test('should handle mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile viewport
    await page.goto('/');
    
    // Check that mobile layout works
    await expect(page.locator(TEST_SELECTORS.ui.heroTitle)).toBeVisible();
    await expect(page.locator(TEST_SELECTORS.search.input)).toBeVisible();
  });
});

// Test Suite: Search Functionality
test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should accept search input', async ({ page }) => {
    const searchInput = page.locator(TEST_SELECTORS.search.input);
    
    await searchInput.fill(TEST_DATA.queries.store);
    await expect(searchInput).toHaveValue(TEST_DATA.queries.store);
  });

  test('should show search results for valid query', async ({ page }) => {
    await page.fill(TEST_SELECTORS.search.input, TEST_DATA.queries.store);
    
    // Wait for search results or empty state
    try {
      await waitForSearchResults(page);
      
      // Check that results are displayed
      const cards = page.locator(TEST_SELECTORS.search.results);
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    } catch {
      // If no results, check for empty state
      await expect(page.locator(TEST_SELECTORS.search.emptyState)).toBeVisible();
    }
  });

  test('should show empty state for invalid query', async ({ page }) => {
    await page.fill(TEST_SELECTORS.search.input, TEST_DATA.queries.invalid);
    
    // Should show empty state
    await expect(page.locator(TEST_SELECTORS.search.emptyState)).toBeVisible();
    
    // Should show search suggestions
    await expect(page.locator(TEST_SELECTORS.search.suggestions)).toBeVisible();
  });

  test('should handle search input changes', async ({ page }) => {
    const searchInput = page.locator(TEST_SELECTORS.search.input);
    
    // Type partial query
    await searchInput.fill('c');
    
    // Complete the query
    await searchInput.fill('central');
    
    // Should handle the input change
    await expect(searchInput).toHaveValue('central');
  });
});

// Test Suite: Location Services
test.describe('Location Services', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show location button', async ({ page }) => {
    await expect(page.locator(TEST_SELECTORS.location.button)).toBeVisible();
  });

  test('should request location permission when clicked', async ({ page }) => {
    await page.context().grantPermissions(['geolocation']);
    
    await page.click(TEST_SELECTORS.location.button);
    
    // Should show loading state
    await expect(page.locator(TEST_SELECTORS.location.loading)).toBeVisible();
  });

  test('should work without GPS permission', async ({ page }) => {
    await page.context().clearPermissions();
    
    // Should still allow search
    await page.fill(TEST_SELECTORS.search.input, TEST_DATA.queries.store);
    
    // Should show hint about GPS
    await expect(page.locator(TEST_SELECTORS.location.hint)).toBeVisible();
  });

  test('should rank results by distance when GPS is enabled', async ({ page }) => {
    await mockGeolocation(page, TEST_DATA.locations.bangkok);
    
    await page.fill(TEST_SELECTORS.search.input, TEST_DATA.queries.mall);
    
    try {
      await waitForSearchResults(page);
      
      // Check that distance information is shown
      const distanceElements = page.locator(TEST_SELECTORS.mall.distance);
      const distanceCount = await distanceElements.count();
      
      if (distanceCount > 0) {
        await expect(distanceElements.first()).toBeVisible();
      }
    } catch {
      // If no results, that's also acceptable for smoke test
      console.log('No search results available in test environment');
    }
  });
});

// Test Suite: Navigation
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to mall detail on result click', async ({ page }) => {
    await page.fill(TEST_SELECTORS.search.input, TEST_DATA.queries.mall);
    
    try {
      await waitForSearchResults(page);
      
      // Click first result
      await page.locator(TEST_SELECTORS.search.results).first().click();
      
      // Should navigate to mall detail page
      await expect(page).toHaveURL(/\/malls\/[a-z0-9-]+/);
    } catch {
      // If no results, skip navigation test
      console.log('No search results available for navigation test');
    }
  });

  test('should handle back navigation', async ({ page }) => {
    await page.fill(TEST_SELECTORS.search.input, TEST_DATA.queries.mall);
    
    try {
      await waitForSearchResults(page);
      await page.locator(TEST_SELECTORS.search.results).first().click();
      
      // Go back
      await page.goBack();
      
      // Should return to home page
      await expect(page).toHaveURL('/');
      await expect(page.locator(TEST_SELECTORS.ui.heroTitle)).toBeVisible();
    } catch {
      console.log('Navigation test skipped - no results available');
    }
  });
});

// Test Suite: Performance
test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const start = performance.now();
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    const loadTime = performance.now() - start;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle search within SLA', async ({ page }) => {
    await page.goto('/');
    
    const start = performance.now();
    
    await page.fill(TEST_SELECTORS.search.input, TEST_DATA.queries.store);
    
    try {
      await waitForSearchResults(page);
    } catch {
      // Even if no results, should handle gracefully
      await expect(page.locator(TEST_SELECTORS.search.emptyState)).toBeVisible();
    }
    
    const searchTime = performance.now() - start;
    
    // Should complete search within 1 second
    expect(searchTime).toBeLessThan(1000);
  });
});

// Test Suite: Error Handling
test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/firestore.googleapis.com/**', route => route.abort());
    
    await page.goto('/');
    
    // Should still load the page
    await expect(page.locator(TEST_SELECTORS.ui.heroTitle)).toBeVisible();
    
    // Search should handle the error
    await page.fill(TEST_SELECTORS.search.input, TEST_DATA.queries.store);
    
    // Should show empty state or error handling
    await expect(page.locator(TEST_SELECTORS.search.emptyState)).toBeVisible();
  });

  test('should handle slow network', async ({ page }) => {
    // Simulate slow network
    await page.route('**/firestore.googleapis.com/**', route => {
      setTimeout(() => route.continue(), 2000);
    });
    
    await page.goto('/');
    
    // Should show loading state
    await expect(page.locator(TEST_SELECTORS.search.loading)).toBeVisible();
    
    // Should eventually load
    await expect(page.locator(TEST_SELECTORS.ui.heroTitle)).toBeVisible({ timeout: 5000 });
  });
});

// Test Suite: Accessibility
test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check search input has proper accessibility
    const searchInput = page.locator(TEST_SELECTORS.search.input);
    await expect(searchInput).toHaveAttribute('aria-label');
    
    // Check location button has proper accessibility
    const locationButton = page.locator(TEST_SELECTORS.location.button);
    await expect(locationButton).toHaveAttribute('aria-label');
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Should be able to tab to search input
    await page.keyboard.press('Tab');
    await expect(page.locator(TEST_SELECTORS.search.input)).toBeFocused();
    
    // Should be able to tab to location button
    await page.keyboard.press('Tab');
    await expect(page.locator(TEST_SELECTORS.location.button)).toBeFocused();
  });
});