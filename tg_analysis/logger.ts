// Simple logger replacement for elizaLogger
export const elizaLogger = {
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  info: (...args: any[]) => console.log('[INFO]', ...args),
  debug: (...args: any[]) => console.log('[DEBUG]', ...args),
  log: (...args: any[]) => console.log('[LOG]', ...args),
};
