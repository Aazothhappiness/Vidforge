const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class NodeExecutor {
  constructor(apiKeys = {}) {
    this.apiKeys = apiKeys;
    this.uploadsDir = path.join(__dirname, '..', 'uploads');
  }

  generateUniqueFilename(extension) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}.${extension}`;
  }

  async saveFile(buffer, filename) {
    const filePath = path.join(this.uploadsDir, filename);
    await fs.writeFile(filePath, buffer);
    return {
      filename,
      path: filePath,
      url: `/uploads/${filename}`
    };
  }

  async downloadFile(url, filename) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      return await this.saveFile(buffer, filename);
    } catch (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  calculateFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = NodeExecutor;