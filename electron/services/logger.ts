import log from 'electron-log';
import path from 'node:path';
import fs from 'node:fs';
// Safe dynamic electron import for both Electron runtime and Node test environments
let appInstance: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const electron = require('electron');
  appInstance = electron.app || electron.remote?.app;
} catch {}

// Determine logs directory in userData
function getLogsDirectory(): string {
  try {
    if (appInstance && typeof appInstance.getPath === 'function') {
      const userData = appInstance.getPath('userData');
      const logsDir = path.join(userData, 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      return logsDir;
    }
  } catch {}
  const fallbackDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true });
  }
  return fallbackDir;
}

const logsDir = getLogsDirectory();
const mainLogPath = path.join(logsDir, 'eyadati.log');

// Configure electron-log transport
log.transports.file.resolvePathFn = () => mainLogPath;
log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB per file with automatic rotation
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

log.transports.console.format = '%c{h}:{i}:{s}%c [{level}] {text}';

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    log.info(`[عيادتي] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    log.warn(`[عيادتي تحذير] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    log.error(`[عيادتي خطأ] ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    log.debug(`[عيادتي تصحيح] ${message}`, ...args);
  },
  getLogPath: () => mainLogPath,
  getLogsDir: () => logsDir,
};

export default logger;
