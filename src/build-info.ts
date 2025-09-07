/**
 * Build Information
 * Displays build metadata in console and makes it available globally
 */

export const BUILD = {
  version: import.meta.env.VITE_APP_VERSION || '0.0.0',
  sha: import.meta.env.VITE_GIT_SHA || 'unknown',
  time: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
  environment: import.meta.env.MODE || 'development',
};

// Make build info available globally for debugging
if (typeof window !== 'undefined') {
  // @ts-expect-error - Adding global build info for debugging
  window.__BUILD__ = BUILD;

  // Log build info to console
  console.log('🚀 HaaNaiHang Build Info:', BUILD);

  // Add build info to page title in development
  if (BUILD.environment === 'development') {
    document.title = `HaaNaiHang ${BUILD.version} (${BUILD.sha}) — หาในห้าง`;
  }
}

// Export for programmatic access
export default BUILD;
