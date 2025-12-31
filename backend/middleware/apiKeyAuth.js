const config = require('../config');
const logger = require('../config/logger');

/**
 * Middleware to validate API key for protected endpoints
 */
const validateApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      logger.warn('API key validation failed: No key provided', {
        ip: req.ip,
        endpoint: req.originalUrl
      });
      return res.status(401).json({ 
        error: 'API key required',
        message: 'X-API-Key header is required for this endpoint' 
      });
    }

    if (apiKey !== config.api.secretKey) {
      logger.warn('API key validation failed: Invalid key', {
        ip: req.ip,
        endpoint: req.originalUrl
      });
      return res.status(403).json({ 
        error: 'Invalid API key',
        message: 'The provided API key is invalid' 
      });
    }

    logger.info('API key validated successfully', {
      ip: req.ip,
      endpoint: req.originalUrl
    });
    
    next();
  } catch (error) {
    logger.error('API key validation error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'Internal server error' 
    });
  }
};

module.exports = validateApiKey;
