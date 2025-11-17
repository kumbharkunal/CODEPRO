/**
 * Production-safe logging utility
 * Only logs in development mode
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  // Development-only logs
  dev: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  // Always log errors
  error: (...args: any[]) => {
    console.error(...args);
  },
  
  // Always log warnings
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  
  // Info logs (can be useful in production)
  info: (...args: any[]) => {
    console.info(...args);
  },
};

// Export individual functions for convenience
export const { dev, error, warn, info } = logger;

