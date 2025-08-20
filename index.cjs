const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { errorHandler } = require('./middleware/errorHandler.cjs');
const { logger } = require('./utils/logging.cjs');
const { assetManager } = require('./lib/assets.cjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Ensure uploads directory exists and mount static serving
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Initialize logging
logger.info('workflow', 'VidForge API Server starting up', null, {
  port: PORT,
  nodeEnv: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString()
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve uploaded files with proper headers
app.use('/uploads', express.static(UPLOAD_DIR, {
  maxAge: '1h',
  acceptRanges: true,
  cacheControl: true,
  setHeaders: (res, filePath) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Range');
  }
}));

// Serve assets with range support for streaming
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  logger.info('media', 'Created assets directory', null, { assetsDir });
}

app.use('/assets', express.static(assetsDir, {
  acceptRanges: true,
  cacheControl: true,
  maxAge: '7d', // Assets are content-addressed, can cache longer
  setHeaders: (res, filePath) => {
    // Add CORS headers for cross-origin media access
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Range');
  }
}));

// Serve character images
const charactersDir = path.join(__dirname, '..', 'characters');
if (!fs.existsSync(charactersDir)) {
  fs.mkdirSync(charactersDir, { recursive: true });
  logger.info('config', 'Created characters directory', null, { charactersDir });
}

app.use('/characters', express.static(charactersDir, {
  acceptRanges: true,
  cacheControl: true,
  maxAge: '1d'
}));

// Routes
try {
  const nodeExecutionRoutes = require('./routes/nodeExecution.cjs');
  const uploadRouter = require('./routes/upload.cjs');
  const characterRoutes = require('./routes/characters.cjs');
  const trainedModelsRoutes = require('./routes/api/trained-models.cjs');
  
  app.use('/api', nodeExecutionRoutes);
  app.use('/api/upload', uploadRouter);
  app.use('/api/characters', characterRoutes);
  app.use('/api/trained-models', trainedModelsRoutes);
  
  logger.success('workflow', 'Routes loaded successfully', null, {
    routes: ['/api', '/api/upload', '/uploads', '/assets', '/characters', '/api/characters']
  });
} catch (error) {
  logger.error('workflow', 'Error loading routes', null, { error: error.message, stack: error.stack });
  process.exit(1);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  logger.debug('api', 'Health check requested');
  
  // Include system status
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    directories: {
      uploads: fs.existsSync(UPLOAD_DIR),
      assets: fs.existsSync(assetsDir),
      characters: fs.existsSync(charactersDir)
    }
  };
  
  res.json(status);
});

// Asset garbage collection endpoint
app.post('/api/assets/gc', async (req, res) => {
  try {
    const { ttlDays = 7, dryRun = false } = req.body;
    const result = await assetManager.gcAssets({ ttlDays, dryRun });
    
    logger.info('media', 'Asset GC completed via API', null, result);
    res.json({ ok: true, result });
  } catch (error) {
    logger.error('media', `Asset GC failed: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  logger.warn('api', `404 Not Found: ${req.method} ${req.originalUrl}`);
  if (!res.headersSent) {
    res.status(404).json({ 
      ok: false, 
      error: 'Not found',
      path: req.originalUrl 
    });
  }
});

// Start server
const server = app.listen(PORT, '127.0.0.1', () => {
  logger.success('workflow', 'VidForge API Server started successfully', null, {
    url: `http://127.0.0.1:${PORT}`,
    uploadsDir: UPLOAD_DIR,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('workflow', 'SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('workflow', 'Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('workflow', 'SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('workflow', 'Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('error', 'Uncaught Exception', null, { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('error', 'Unhandled Rejection', null, { reason: String(reason), promise: String(promise) });
  process.exit(1);
});

module.exports = app;