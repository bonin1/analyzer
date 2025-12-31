const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const companiesController = require('../controller/companiesController');

/**
 * GET /api/companies
 * Get all companies with search, sort, and pagination
 * Public endpoint - no authentication required
 */
router.get('/', 
  apiLimiter,
  companiesController.getAllCompanies
);

/**
 * GET /api/companies/:id
 * Get single company with details
 * Public endpoint - no authentication required
 */
router.get('/:id', 
  apiLimiter,
  companiesController.getCompanyById
);

/**
 * POST /api/companies
 * Create new company (admin only)
 * Protected: Requires authentication + admin role
 */
router.post('/', 
  apiLimiter,
  authenticate,
  authorize('admin'),
  async (req, res) => {
    // TODO: Implement company creation if needed for manual entry
    res.json({ 
      message: 'Company creation endpoint',
      note: 'Implementation pending - use dataset import for bulk creation'
    });
  }
);

/**
 * PUT /api/companies/:id
 * Update company (admin only)
 * Protected: Requires authentication + admin role
 */
router.put('/:id',
  apiLimiter,
  authenticate,
  authorize('admin'),
  async (req, res) => {
    // TODO: Implement company update if needed for corrections
    res.json({ 
      message: 'Company update endpoint',
      note: 'Implementation pending'
    });
  }
);

/**
 * DELETE /api/companies/:id
 * Delete company (admin only)
 * Protected: Requires authentication + admin role
 */
router.delete('/:id',
  apiLimiter,
  authenticate,
  authorize('admin'),
  async (req, res) => {
    // TODO: Implement company deletion if needed
    res.json({ 
      message: 'Company deletion endpoint',
      note: 'Implementation pending'
    });
  }
);

module.exports = router;
