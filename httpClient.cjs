const axios = require('axios');
const { logger } = require('../utils/logging.cjs');

class ResilientHttpClient {
  constructor() {
    this.client = axios.create({
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      validateStatus: () => true
    });

    this.client.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        logger.debug('api', `HTTP Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('api', `HTTP Request Error: ${error.message}`);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - (response.config.metadata?.startTime || 0);
        logger.debug('api', `HTTP Response: ${response.status} (${duration}ms)`);
        return response;
      },
      (error) => {
        logger.error('api', `HTTP Response Error: ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  async get(url, options = {}) {
    return this.client.get(url, options);
  }

  async post(url, data, options = {}) {
    return this.client.post(url, data, options);
  }
}

const httpClient = new ResilientHttpClient();
module.exports = { httpClient };