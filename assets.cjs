// VidForge - Asset lifecycle manager with content addressing and streaming
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { logger } = require('../utils/logging.cjs');

class AssetManager {
  constructor() {
    this.assetsDir = path.join(__dirname, '..', '..', 'assets');
    this.manifestsDir = path.join(__dirname, '..', '..', 'manifests');
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.assetsDir, this.manifestsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info('media', `Created directory: ${dir}`);
      }
    });
  }

  async saveAsset(buffer, extension, producer, runId) {
    try {
      // Generate content-addressed filename
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      const filename = `${hash}.${extension}`;
      const filePath = path.join(this.assetsDir, filename);
      const publicUrl = `/assets/${filename}`;

      // Check if asset already exists (deduplication)
      if (fs.existsSync(filePath)) {
        logger.info('media', 'Asset already exists, reusing', producer, {
          runId,
          sha256: hash,
          filename,
          size: buffer.length,
          deduplication: true
        });

        return {
          sha256: hash,
          path: filePath,
          publicUrl,
          filename,
          size: buffer.length,
          contentType: this.getContentType(extension),
          deduplication: true
        };
      }

      // Write new asset
      fs.writeFileSync(filePath, buffer);
      const stats = fs.statSync(filePath);

      const asset = {
        sha256: hash,
        path: filePath,
        publicUrl,
        filename,
        size: stats.size,
        contentType: this.getContentType(extension),
        producer,
        consumers: [],
        pinned: false,
        createdAt: Date.now(),
        runId
      };

      // Update manifest
      await this.updateManifest(runId, asset);

      logger.success('media', 'Asset saved successfully', producer, {
        runId,
        sha256: hash,
        filename,
        size: this.formatFileSize(stats.size),
        contentType: asset.contentType,
        publicUrl
      });

      return asset;
    } catch (error) {
      logger.error('media', `Failed to save asset: ${error.message}`, producer, {
        runId,
        error: error.message,
        bufferSize: buffer.length,
        extension
      });
      throw error;
    }
  }

  async updateManifest(runId, asset) {
    try {
      const manifestPath = path.join(this.manifestsDir, `${runId}.json`);
      let manifest = { runId, assets: [], createdAt: Date.now() };

      if (fs.existsSync(manifestPath)) {
        const existing = fs.readFileSync(manifestPath, 'utf8');
        manifest = JSON.parse(existing);
      }

      manifest.assets.push(asset);
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      logger.debug('media', 'Asset manifest updated', asset.producer, {
        runId,
        manifestPath,
        totalAssets: manifest.assets.length
      });
    } catch (error) {
      logger.warn('media', `Failed to update manifest: ${error.message}`, asset.producer, {
        runId,
        error: error.message
      });
    }
  }

  async addConsumer(sha256, consumer, runId) {
    try {
      const manifestPath = path.join(this.manifestsDir, `${runId}.json`);
      if (!fs.existsSync(manifestPath)) return;

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const asset = manifest.assets.find(a => a.sha256 === sha256);
      
      if (asset && !asset.consumers.includes(consumer)) {
        asset.consumers.push(consumer);
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        
        logger.debug('media', `Consumer added to asset`, consumer, {
          runId,
          sha256,
          totalConsumers: asset.consumers.length
        });
      }
    } catch (error) {
      logger.warn('media', `Failed to add consumer: ${error.message}`, consumer, {
        runId,
        sha256,
        error: error.message
      });
    }
  }

  async gcAssets(options = {}) {
    const { ttlDays = 7, keepPinned = true, dryRun = false } = options;
    const cutoffTime = Date.now() - (ttlDays * 24 * 60 * 60 * 1000);
    
    try {
      const files = fs.readdirSync(this.assetsDir);
      const manifestFiles = fs.readdirSync(this.manifestsDir);
      
      // Build set of assets to keep
      const protectedAssets = new Set();
      
      for (const manifestFile of manifestFiles) {
        try {
          const manifestPath = path.join(this.manifestsDir, manifestFile);
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          
          // Keep assets from recent runs or pinned assets
          if (manifest.createdAt > cutoffTime) {
            manifest.assets.forEach(asset => {
              protectedAssets.add(asset.filename);
            });
          } else if (keepPinned) {
            manifest.assets.filter(a => a.pinned).forEach(asset => {
              protectedAssets.add(asset.filename);
            });
          }
        } catch (error) {
          logger.warn('media', `Failed to read manifest ${manifestFile}: ${error.message}`);
        }
      }

      // Clean up old assets
      let deletedCount = 0;
      let freedBytes = 0;

      for (const filename of files) {
        if (!protectedAssets.has(filename)) {
          const filePath = path.join(this.assetsDir, filename);
          const stats = fs.statSync(filePath);
          
          if (stats.birthtime.getTime() < cutoffTime) {
            if (!dryRun) {
              fs.unlinkSync(filePath);
            }
            deletedCount++;
            freedBytes += stats.size;
            
            logger.info('media', `${dryRun ? 'Would delete' : 'Deleted'} old asset: ${filename}`, null, {
              filename,
              age: Math.round((Date.now() - stats.birthtime.getTime()) / (24 * 60 * 60 * 1000)),
              size: this.formatFileSize(stats.size)
            });
          }
        }
      }

      logger.success('media', `Asset garbage collection completed`, null, {
        deletedCount,
        freedSpace: this.formatFileSize(freedBytes),
        protectedAssets: protectedAssets.size,
        dryRun
      });

      return { deletedCount, freedBytes, protectedAssets: protectedAssets.size };
    } catch (error) {
      logger.error('media', `Asset GC failed: ${error.message}`, null, { error: error.message });
      throw error;
    }
  }

  getContentType(extension) {
    const types = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mov': 'video/quicktime',
      'json': 'application/json',
      'txt': 'text/plain'
    };
    
    return types[extension.toLowerCase()] || 'application/octet-stream';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async getAssetInfo(sha256) {
    try {
      const filename = fs.readdirSync(this.assetsDir).find(f => f.startsWith(sha256));
      if (!filename) return null;

      const filePath = path.join(this.assetsDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        sha256,
        filename,
        path: filePath,
        publicUrl: `/assets/${filename}`,
        size: stats.size,
        contentType: this.getContentType(path.extname(filename).substring(1)),
        createdAt: stats.birthtime.getTime(),
        modifiedAt: stats.mtime.getTime()
      };
    } catch (error) {
      logger.error('media', `Failed to get asset info for ${sha256}: ${error.message}`);
      return null;
    }
  }
}

const assetManager = new AssetManager();
module.exports = { assetManager };