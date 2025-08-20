const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { logger } = require('./logging.cjs');

class MediaManager {
  constructor() {
    this.uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    this.trashDir = path.join(this.uploadsDir, 'trash');
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.uploadsDir, this.trashDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info('media', `Created directory: ${dir}`);
      }
    });
  }

  generateFilename(originalUrl, extension) {
    const hash = crypto.createHash('md5').update(originalUrl).digest('hex').substring(0, 8);
    const timestamp = Date.now();
    return `cached-${timestamp}-${hash}.${extension}`;
  }

  async downloadAndCache(url, nodeId) {
    try {
      logger.info('media', 'Downloading media from URL', nodeId, { url });

      // Check if file already exists
      const extension = this.getExtensionFromUrl(url);
      const filename = this.generateFilename(url, extension);
      const filePath = path.join(this.uploadsDir, filename);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const localUrl = `/uploads/${filename}`;
        logger.info('media', 'Media already cached', nodeId, { url, localUrl });
        return {
          url: localUrl,
          local: filePath,
          filename,
          size: stats.size,
          contentType: this.getContentTypeFromExtension(extension),
          originalUrl: url
        };
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || '';
      
      const detectedExtension = this.getExtensionFromContentType(contentType) || extension;
      const finalFilename = this.generateFilename(url, detectedExtension);
      const finalFilePath = path.join(this.uploadsDir, finalFilename);
      
      // Ensure directory exists before writing
      this.ensureDirectories();
      fs.writeFileSync(finalFilePath, buffer);
      
      const stats = fs.statSync(finalFilePath);
      const localUrl = `/uploads/${finalFilename}`;
      
      logger.success('media', 'Media cached successfully', nodeId, {
        originalUrl: url,
        localUrl,
        filename: finalFilename,
        size: this.formatFileSize(stats.size),
        contentType
      });

      return {
        url: localUrl,
        local: finalFilePath,
        filename: finalFilename,
        size: stats.size,
        contentType,
        originalUrl: url
      };
    } catch (error) {
      logger.error('media', 'Failed to download and cache media', nodeId, {
        url,
        error: error.message
      });
      throw error;
    }
  }

  getExtensionFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const extension = path.extname(pathname).slice(1).toLowerCase();
      return extension || 'bin';
    } catch {
      return 'bin';
    }
  }

  getExtensionFromContentType(contentType) {
    if (contentType.includes('image/png')) return 'png';
    if (contentType.includes('image/jpeg')) return 'jpg';
    if (contentType.includes('image/webp')) return 'webp';
    if (contentType.includes('audio/mpeg')) return 'mp3';
    if (contentType.includes('audio/wav')) return 'wav';
    if (contentType.includes('video/mp4')) return 'mp4';
    return null;
  }

  getContentTypeFromExtension(extension) {
    const types = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'mp4': 'video/mp4'
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
}

const mediaManager = new MediaManager();
module.exports = { mediaManager };