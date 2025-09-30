import { Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

export class UserController {
  // Get current user profile
  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await UserService.getUserById(req.user!.userId!);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Remove sensitive information
      const { firebaseUid, ...userProfile } = user;
      
      res.json({
        success: true,
        data: userProfile
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  }

  // Update current user profile
  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, profileImage } = req.body;
      
      const updatedUser = await UserService.updateUser(req.user!.userId!, {
        name,
        profileImage
      });

      const { firebaseUid, ...userProfile } = updatedUser;
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: userProfile
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  // Get all users (admin only)
  static async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await UserService.getAllUsers(page, limit);
      
      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }

  // Get user by ID (admin/officer only)
  static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const { firebaseUid, ...userData } = user;
      
      res.json({
        success: true,
        data: userData
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  // Update user role (admin only)
  static async updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!Object.values(UserRole).includes(role)) {
        res.status(400).json({ error: 'Invalid role' });
        return;
      }

      const updatedUser = await UserService.updateUser(id, { role });
      
      res.json({
        success: true,
        message: 'User role updated successfully',
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role
        }
      });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  }

  // Deactivate user (admin only)
  static async deactivateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Prevent admin from deactivating themselves
      if (id === req.user!.userId) {
        res.status(400).json({ error: 'Cannot deactivate your own account' });
        return;
      }

      await UserService.deleteUser(id);
      
      res.json({
        success: true,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      console.error('Deactivate user error:', error);
      res.status(500).json({ error: 'Failed to deactivate user' });
    }
  }

  // Get user statistics (admin only)
  static async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await UserService.getUserStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ error: 'Failed to get user statistics' });
    }
  }

  // Search users (admin/officer only)
  static async searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { query, role, active } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // This would need to be implemented in UserService
      // For now, return all users with basic filtering
      const result = await UserService.getAllUsers(page, limit);
      
      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  }
}