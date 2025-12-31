const fs = require('fs').promises;
const path = require('path');

/**
 * Safely extract value from nested XML object
 * @param {Object} obj - XML object
 * @param {string} path - Dot-separated path (e.g., 'Return.ReturnData.IRS990')
 * @param {*} defaultValue - Default value if path not found
 */
const getNestedValue = (obj, path, defaultValue = null) => {
  try {
    return path.split('.').reduce((acc, part) => {
      if (acc && typeof acc === 'object') {
        // Handle arrays - take first element
        if (Array.isArray(acc)) {
          return acc[0]?.[part];
        }
        return acc[part];
      }
      return undefined;
    }, obj) ?? defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Extract text value from XML element (handles both string and object with _text)
 */
const extractText = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value._text || value._ || null;
  }
  return String(value);
};

/**
 * Extract numeric value and convert to number
 */
const extractNumber = (value) => {
  const text = extractText(value);
  if (!text) return 0;
  const num = parseFloat(String(text).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
};

/**
 * Ensure directory exists
 */
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

/**
 * Delete directory recursively
 */
const deleteDirectory = async (dirPath) => {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    // Ignore errors if directory doesn't exist
  }
};

/**
 * Format currency for display
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Calculate percentage change
 * Returns null if there's no previous data to compare
 */
const calculatePercentageChange = (current, previous) => {
  if (previous === null || previous === undefined) {
    return null;
  }
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

/**
 * Calculate absolute change
 * Returns null if there's no previous data to compare
 */
const calculateAbsoluteChange = (current, previous) => {
  if (previous === null || previous === undefined) {
    return null;
  }
  return current - previous;
};

/**
 * Generate unique filename for temporary files
 */
const generateTempFilename = (prefix = 'temp') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}_${random}`;
};

module.exports = {
  getNestedValue,
  extractText,
  extractNumber,
  ensureDirectoryExists,
  deleteDirectory,
  formatCurrency,
  calculatePercentageChange,
  calculateAbsoluteChange,
  generateTempFilename
};
