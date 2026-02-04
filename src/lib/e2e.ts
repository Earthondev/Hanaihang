export const isE2E = Boolean(
  typeof import.meta !== 'undefined' &&
    (import.meta as { env?: Record<string, string> }).env &&
    ((import.meta as { env: Record<string, string> }).env.VITE_E2E === '1' ||
      (import.meta as { env: Record<string, string> }).env.VITE_E2E === 'true'),
);
