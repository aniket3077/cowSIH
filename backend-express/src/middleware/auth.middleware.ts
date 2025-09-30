import { Request, Response, NextFunction } from 'express';
import { admin } from '../config/firebase.config';
import { prisma } from '../index';
import { UserRole } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: UserRole;
    userId?: string;
  };
  file?: Express.Multer.File;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found in database' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'User account is deactivated' });
      return;
    }

    req.user = {
      uid: decodedToken.uid,
      email: user.email,
      role: user.role,
      userId: user.id
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role!)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

// Role-specific middleware
export const isFarmer = authorize([UserRole.FARMER, UserRole.OFFICER, UserRole.ADMIN]);
export const isOfficer = authorize([UserRole.OFFICER, UserRole.ADMIN]);
export const isAdmin = authorize([UserRole.ADMIN]);