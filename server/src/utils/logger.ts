export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[${new Date().toISOString()}] [INFO] [MergeMind] ${message}`, meta ? meta : '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[${new Date().toISOString()}] [WARN] [MergeMind] ${message}`, meta ? meta : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[${new Date().toISOString()}] [ERROR] [MergeMind] ${message}`, error ? error : '');
  },
  debug: (message: string, meta?: any) => {
    if (process.env.DEBUG === 'true') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] [MergeMind] ${message}`, meta ? meta : '');
    }
  },
};
