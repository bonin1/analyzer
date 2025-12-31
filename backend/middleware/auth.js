const { verifyToken } = require('../helpers/jwtHelper');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Middleware to authenticate JWT token from cookie
 */
const authenticate = (req, res, next) => {
  try {
    const token = req.cookies[config.jwt.cookieName];

    if (!token) {
      logger.warn('Authentication failed: No token provided');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided' 
      });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      logger.warn('Authentication failed: Invalid token');
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid or expired token' 
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'Internal server error' 
    });
  }
};

/**
 * Middleware to check user role
 * @param {string[]} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Authorization failed: User not authenticated');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please login first' 
      });
    }

    logger.info(`Authorization check - User: ${req.user.username}, Role: ${req.user.role}, Required roles: ${roles.join(', ')}`);

    if (!roles.includes(req.user.role)) {
      logger.warn(`Authorization failed: User role '${req.user.role}' not authorized. Required roles: ${roles.join(', ')}`);
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You do not have permission to access this resource' 
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
