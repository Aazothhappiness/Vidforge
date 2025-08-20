// VidForge - Frontend logger with levels & categories
import { VFLog } from '../types';

let logId = 0;
const generateId = () => `vf_${Date.now()}_${++logId}`;

export class VFLogger {
  private runId?: string;
  private listeners: ((log: VFLog) => void)[] = [];

  setRunId(runId: string) {
    this.runId = runId;
  }

  clearRunId() {
    this.runId = undefined;
  }

  addListener(listener: (log: VFLog) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (log: VFLog) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private emit(log: VFLog) {
    this.listeners.forEach(listener => {
      try {
        listener(log);
      } catch (error) {
        console.error('Logger listener error:', error);
      }
    });
  }

  private log(
    level: VFLog['level'],
    cat: VFLog['cat'],
    msg: string,
    nodeId?: string,
    meta?: Record<string, any>
  ) {
    const log: VFLog = {
      id: generateId(),
      ts: Date.now(),
      level,
      cat,
      msg,
      nodeId,
      runId: this.runId,
      meta: meta ? this.sanitizeMeta(meta) : undefined
    };

    // Also log to browser console for development
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[${cat.toUpperCase()}] ${msg}`, meta || '');

    this.emit(log);
  }

  private sanitizeMeta(meta: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(meta)) {
      if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token')) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '... [TRUNCATED]';
      } else if (typeof value === 'object' && value !== null) {
        try {
          const str = JSON.stringify(value);
          if (str.length > 2000) {
            sanitized[key] = '[LARGE_OBJECT]';
          } else {
            sanitized[key] = value;
          }
        } catch {
          sanitized[key] = '[UNSERIALIZABLE]';
        }
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Convenience methods
  debug(cat: VFLog['cat'], msg: string, nodeId?: string, meta?: Record<string, any>) {
    this.log('debug', cat, msg, nodeId, meta);
  }

  info(cat: VFLog['cat'], msg: string, nodeId?: string, meta?: Record<string, any>) {
    this.log('info', cat, msg, nodeId, meta);
  }

  warn(cat: VFLog['cat'], msg: string, nodeId?: string, meta?: Record<string, any>) {
    this.log('warn', cat, msg, nodeId, meta);
  }

  error(cat: VFLog['cat'], msg: string, nodeId?: string, meta?: Record<string, any>) {
    this.log('error', cat, msg, nodeId, meta);
  }

  success(cat: VFLog['cat'], msg: string, nodeId?: string, meta?: Record<string, any>) {
    this.log('success', cat, msg, nodeId, meta);
  }
}

export const logger = new VFLogger();

// Global access for components
(window as any).vfLogger = logger;