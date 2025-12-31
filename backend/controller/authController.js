const { User } = require('../models');
const { hashPassword, comparePassword } = require('../helpers/passwordHelper');
const { generateToken } = require('../helpers/jwtHelper');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Register new user
 */
const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Validation error',
        message: 'Username, email, and password are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { 
        [require('sequelize').Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      logger.warn(`Registration failed: User already exists - ${email}`);
      return res.status(409).json({ 
        error: 'User already exists',
        message: 'Email or username already registered' 
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    logger.info(`User registered successfully: ${user.email}`);

    // Generate token
    const token = generateToken({ 
      id: user.id, 
      username: user.username,
      email: user.email,
      role: user.role 
    });

    // Set cookie
    res.cookie(config.jwt.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      message: error.message 
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Validation error',
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      logger.warn(`Login failed: User not found - ${email}`);
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid email or password' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn(`Login failed: Account disabled - ${email}`);
      return res.status(403).json({ 
        error: 'Account disabled',
        message: 'Your account has been disabled' 
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      logger.warn(`Login failed: Invalid password - ${email}`);
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid email or password' 
      });
    }

    logger.info(`User logged in successfully: ${user.email}`);

    // Generate token
    const token = generateToken({ 
      id: user.id, 
      username: user.username,
      email: user.email,
      role: user.role 
    });

    // Set cookie
    res.cookie(config.jwt.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: error.message 
    });
  }
};

/**
 * Logout user
 */
const logout = (req, res) => {
  try {
    res.clearCookie(config.jwt.cookieName);
    logger.info(`User logged out: ${req.user ? req.user.email : 'unknown'}`);
    
    res.json({ 
      message: 'Logout successful' 
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      message: error.message 
    });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User profile not found' 
      });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Failed to get profile',
      message: error.message 
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile
};
