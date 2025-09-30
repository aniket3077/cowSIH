import express from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, isAdmin, isOfficer } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// User profile routes
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);

// Admin/Officer routes
router.get('/', isOfficer, UserController.getAllUsers);
router.get('/search', isOfficer, UserController.searchUsers);
router.get('/stats', isAdmin, UserController.getUserStats);
router.get('/:id', isOfficer, UserController.getUserById);

// Admin only routes
router.put('/:id/role', isAdmin, UserController.updateUserRole);
router.delete('/:id', isAdmin, UserController.deactivateUser);

export default router;