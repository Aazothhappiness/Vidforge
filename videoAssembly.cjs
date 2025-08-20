const fs = require('fs');
const path = require('path');
const { logger } = require('./logging.cjs');

class VideoAssembler {
  constructor() {
    this.uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    this.tempDir = path.join(this.uploadsDir, 'temp');
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.uploadsDir, this.tempDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info('media', `Created directory: ${dir}`);
      }
    });
  }

  async assembleVideo(config) {
    const {
      audioUrl,
      images,
      title = 'video',
      resolution = '1080p',
      fps = 30,
      format = 'mp4'
    } = config;

    logger.info('media', 'Starting video assembly', null, {
      audioUrl,
      imageCount: images.length,
      resolution,
      fps,
      format
    });

    try {
      const timestamp = Date.now();
      const outputFilename = `${title}-${timestamp}.${format}`;
      
      // Mock video assembly - return a placeholder URL
      const videoUrl = `/uploads/${outputFilename}`;
      
      logger.success('media', 'Video assembly completed', null, {
        outputFilename,
        videoUrl
      });

      return videoUrl;
    } catch (error) {
      logger.error('media', 'Video assembly failed', null, {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      return `${sizeInMB} MB`;
    } catch (error) {
      return 'Unknown';
    }
  }
}

const videoAssembler = new VideoAssembler();
module.exports = { videoAssembler };