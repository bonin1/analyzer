const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { User } = require('../models');
const logger = require('../config/logger');

/**
 * GET /api/users
 * Get all users
 * Protected: Admin only
 */
router.get('/',
  authenticate,
  authorize('admin'),
  async (req, res) => {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']]
      });

      res.json({ users });
    } catch (error) {
      logger.error('Error fetching users:', error);
      res.status(500).json({
        error: 'Failed to fetch users',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/users/:id
 * Get specific user
 * Protected: Admin only OR own profile
 */
router.get('/:id',
  authenticate,
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Check if user is admin or requesting own profile
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        logger.warn(`Access denied: User ${req.user.id} tried to access user ${userId}`);
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view your own profile'
        });
      }

      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'The requested user does not exist'
        });
      }

      res.json({ user });
    } catch (error) {
      logger.error('Error fetching user:', error);
      res.status(500).json({
        error: 'Failed to fetch user',
        message: error.message
      });
    }
  }
);

/**
 * PUT /api/users/:id
 * Update user information
 * Protected: Admin only OR own profile (limited fields)
 */
router.put('/:id',
  authenticate,
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { username, email, role, isActive } = req.body;

      // Check if user is admin or updating own profile
      const isAdmin = req.user.role === 'admin';
      const isOwnProfile = req.user.id === userId;

      if (!isAdmin && !isOwnProfile) {
        logger.warn(`Access denied: User ${req.user.id} tried to update user ${userId}`);
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own profile'
        });
      }

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'The requested user does not exist'
        });
      }

      // Regular users can only update their own username/email
      // Admins can update role and isActive status
      const updateData = {};
      
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      
      if (isAdmin) {
        if (role !== undefined) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
      }

      await user.update(updateData);

      logger.info(`User ${userId} updated by ${req.user.id}`);

      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      res.json({
        message: 'User updated successfully',
        user: updatedUser
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      res.status(500).json({
        error: 'Failed to update user',
        message: error.message
      });
    }
  }
);

/**
 * DELETE /api/users/:id
 * Delete user
 * Protected: Admin only
 */
router.delete('/:id',
  authenticate,
  authorize('admin'),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Prevent admin from deleting themselves
      if (req.user.id === userId) {
        return res.status(400).json({
          error: 'Cannot delete own account',
          message: 'You cannot delete your own admin account'
        });
      }

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'The requested user does not exist'
        });
      }

      await user.destroy();

      logger.info(`User ${userId} deleted by admin ${req.user.id}`);

      res.json({
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting user:', error);
      res.status(500).json({
        error: 'Failed to delete user',
        message: error.message
      });
    }
  }
);

module.exports = router;
