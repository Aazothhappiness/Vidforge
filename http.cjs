const axios = require('axios');
const { logger } = require('./logging.cjs');

const http = axios.create({
  timeout: 60000,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  validateStatus: () => true
});

http.interceptors.request.use(
  (config) => {
    logger.debug('api', `HTTP Request: ${config.method?.toUpperCase()} ${config.url}`);
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => {
    logger.error('api', `HTTP Request Error: ${error.message}`);
    return Promise.reject(error);
  }
);

http.interceptors.response.use(
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

async function withRetry(requestFn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await requestFn();
      
      if (result.status === 429 || (result.status >= 500 && result.status < 600)) {
        if (attempt === maxRetries) {
          return result;
        }
        
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

const httpUtils = {
  get: (url, config = {}) => withRetry(() => http.get(url, config)),
  post: (url, data, config = {}) => withRetry(() => http.post(url, data, config)),
  put: (url, data, config = {}) => withRetry(() => http.put(url, data, config)),
  delete: (url, config = {}) => withRetry(() => http.delete(url, config)),
  patch: (url, data, config = {}) => withRetry(() => http.patch(url, data, config)),
  axios: http
};

module.exports = httpUtils;