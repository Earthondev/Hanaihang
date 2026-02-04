// E2E Test Configuration Constants
export const E2E_CONFIG = {
  MIN_LOADING_MS: 120,
  SHORT_QUERY_LOADING_MS: 400,
  FIRESTORE_CHECK_TTL: 0,
  FIRESTORE_PING_TIMEOUT_MS: 250,
  DEBOUNCE_MS: 0,
} as const;

export const isE2E = Boolean(
  typeof import.meta !== 'undefined' &&
  (import.meta as { env?: Record<string, string> }).env &&
  ((import.meta as { env: Record<string, string> }).env.VITE_E2E === '1' ||
    (import.meta as { env: Record<string, string> }).env.VITE_E2E === 'true'),
);
