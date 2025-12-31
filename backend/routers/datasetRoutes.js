const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const validateApiKey = require('../middleware/apiKeyAuth');
const { datasetLimiter } = require('../middleware/rateLimiter');
const datasetController = require('../controller/datasetController');

/**
 * POST /api/dataset
 * Import dataset from IRS ZIP file URL
 * Protected: Requires authentication + admin role OR valid API key
 */
router.post('/', 
  datasetLimiter,
  // First check if API key is provided, otherwise check auth + role
  (req, res, next) => {
    if (req.headers['x-api-key']) {
      // Use API key authentication
      return validateApiKey(req, res, next);
    } else {
      // Use JWT authentication
      return authenticate(req, res, next);
    }
  },
  // If using JWT, verify admin role
  (req, res, next) => {
    if (req.headers['x-api-key']) {
      // API key already validated, skip role check
      return next();
    } else {
      // Check if user has admin role
      return authorize('admin')(req, res, next);
    }
  },
  datasetController.importDataset
);

module.exports = router;
