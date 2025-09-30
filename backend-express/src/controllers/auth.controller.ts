import { Response } from 'express';
import { admin } from '../config/firebase.config';
import { UserService } from '../services/user.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

export class AuthController {
  // Register or login user (handles both)
  static async authenticateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
      }

      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(token);
      const { uid, email, name } = decodedToken;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      // Check if user exists
      let user = await UserService.getUserByFirebaseUid(uid);

      if (!user) {
        // Create new user if doesn't exist
        user = await UserService.createUser({
          firebaseUid: uid,
          email: email,
          name: name || null,
          role: UserRole.FARMER // Default role
        });

        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isNewUser: true
          }
        });
      } else {
        // User exists, return login success
        if (!user.isActive) {
          res.status(403).json({ error: 'Account is deactivated' });
          return;
        }

        res.json({
          success: true,
          message: 'Login successful',
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isNewUser: false
          }
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  // Verify token endpoint
  static async verifyToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      const user = await UserService.getUserByFirebaseUid(decodedToken.uid);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ error: 'Account is deactivated' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          uid: decodedToken.uid
        }
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(403).json({ error: 'Invalid or expired token' });
    }
  }

  // Logout (optional - mainly handled on client side)
  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // With Firebase, logout is mainly handled on the client side
      // Here we can log the logout event or perform cleanup if needed
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  // Refresh token (Firebase handles this automatically)
  static async refreshToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Firebase SDK handles token refresh automatically
      // This endpoint is for custom implementations if needed
      
      res.json({
        success: true,
        message: 'Token refresh is handled automatically by Firebase SDK'
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  }

  // Get current user info
  static async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const user = await UserService.getUserById(req.user.userId!);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profileImage: user.profileImage,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Failed to get user information' });
    }
  }

  // Update user profile during onboarding
  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { name, role } = req.body;

      // Validate role if provided
      if (role && !Object.values(UserRole).includes(role)) {
        res.status(400).json({ error: 'Invalid role' });
        return;
      }

      const updatedUser = await UserService.updateUser(req.user.userId!, {
        name,
        ...(role && { role })
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
}