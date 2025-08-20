// VidForge - Server logger
const fs = require('fs');
const path = require('path');

let logId = 0;
const generateId = () => `vf_server_${Date.now()}_${++logId}`;

class VFServerLogger {
  constructor() {
    this.runId = null;
    this.logFile = path.join(__dirname, '..', 'logs', 'vidforge.log');
    this.ensureLogDir();
  }

  ensureLogDir() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  setRunId(runId) {
    this.runId = runId;
  }

  clearRunId() {
    this.runId = null;
  }

  log(level, cat, msg, nodeId, meta) {
    const log = {
      id: generateId(),
      ts: Date.now(),
      level,
      cat,
      msg,
      nodeId,
      runId: this.runId,
      meta: meta ? this.sanitizeMeta(meta) : undefined
    };

    // Console output
    const timestamp = new Date().toISOString();
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[${timestamp}] [${cat.toUpperCase()}] ${msg}`, meta || '');

    // File output (async, don't block)
    setImmediate(() => {
      try {
        fs.appendFileSync(this.logFile, JSON.stringify(log) + '\n');
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    });

    return log;
  }

  sanitizeMeta(meta) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(meta)) {
      if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 2000) {
        sanitized[key] = value.substring(0, 2000) + '... [TRUNCATED]';
      } else if (typeof value === 'object' && value !== null) {
        try {
          const str = JSON.stringify(value);
          if (str.length > 5000) {
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
  debug(cat, msg, nodeId, meta) {
    return this.log('debug', cat, msg, nodeId, meta);
  }

  info(cat, msg, nodeId, meta) {
    return this.log('info', cat, msg, nodeId, meta);
  }

  warn(cat, msg, nodeId, meta) {
    return this.log('warn', cat, msg, nodeId, meta);
  }

  error(cat, msg, nodeId, meta) {
    return this.log('error', cat, msg, nodeId, meta);
  }

  success(cat, msg, nodeId, meta) {
    return this.log('success', cat, msg, nodeId, meta);
  }
}

const logger = new VFServerLogger();
module.exports = { logger };