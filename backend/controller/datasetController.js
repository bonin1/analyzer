const DatasetService = require('../helpers/datasetService');
const logger = require('../config/logger');

/**
 * Import dataset from IRS ZIP file URL
 * POST /api/dataset
 */
const importDataset = async (req, res) => {
  try {
    const { irsZipUrl, maxCompanies } = req.body;

    // Validate URL
    if (!irsZipUrl) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'irsZipUrl is required'
      });
    }

    // Validate URL format
    try {
      new URL(irsZipUrl);
    } catch {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid URL format'
      });
    }

    // Validate maxCompanies if provided
    if (maxCompanies !== undefined && (isNaN(maxCompanies) || maxCompanies < 1)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'maxCompanies must be a positive number'
      });
    }

    logger.info('Dataset import requested', { 
      url: irsZipUrl,
      maxCompanies: maxCompanies || 'unlimited',
      user: req.user?.id || 'API Key',
      ip: req.ip
    });

    // Start processing (this will take time)
    const service = new DatasetService();
    const stats = await service.processDataset(irsZipUrl, maxCompanies);

    logger.info('Dataset import completed successfully', stats);

    res.json({
      message: 'Dataset imported successfully',
      statistics: {
        totalFiles: stats.totalFiles,
        processed: stats.processed,
        saved: stats.saved,
        errors: stats.errors,
        duration: `${(stats.duration / 1000).toFixed(2)}s`,
        successRate: `${((stats.saved / stats.totalFiles) * 100).toFixed(2)}%`
      },
      errors: stats.errors.slice(0, 10) // Return first 10 errors
    });
  } catch (error) {
    logger.error('Dataset import failed', { 
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Import failed',
      message: error.message,
      details: 'Check server logs for more information'
    });
  }
};

module.exports = {
  importDataset
};
