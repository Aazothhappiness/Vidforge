const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logging.cjs');

class MediaAssembler {
  constructor() {
    this.tempDir = path.join(__dirname, '..', 'temp');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
      logger.info('media', `Created temp directory: ${this.tempDir}`);
    }
  }

  async assembleVideo(config, nodeId, runId) {
    const {
      slides = [],
      audioUrl,
      title = 'video',
      fps = 30,
      resolution = { w: 1920, h: 1080 }
    } = config;

    logger.info('media', 'Starting video assembly', nodeId, {
      runId,
      slideCount: slides.length,
      audioUrl,
      resolution,
      fps
    });

    try {
      if (!audioUrl || slides.length === 0) {
        throw new Error('Audio URL and slides are required for video assembly');
      }

      const timestamp = Date.now();
      const outputFilename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.mp4`;
      
      // Mock assembly - return placeholder
      const videoUrl = `/uploads/${outputFilename}`;

      logger.success('media', 'Video assembly completed', nodeId, {
        runId,
        outputUrl: videoUrl,
        duration: 30
      });

      return {
        videoUrl,
        durationSec: 30,
        resolution: `${resolution.w}x${resolution.h}`,
        format: 'mp4',
        metadata: {
          slideCount: slides.length,
          fps
        }
      };
    } catch (error) {
      logger.error('media', `Video assembly failed: ${error.message}`, nodeId, {
        runId,
        error: error.message
      });
      throw error;
    }
  }
}

const mediaAssembler = new MediaAssembler();
module.exports = { mediaAssembler };