import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes
router.post('/login', AuthController.authenticateUser);
router.post('/register', AuthController.authenticateUser);
router.post('/verify-token', AuthController.verifyToken);

// Protected routes
router.use(authenticateToken);
router.post('/logout', AuthController.logout);
router.post('/refresh-token', AuthController.refreshToken);
router.get('/me', AuthController.getCurrentUser);
router.put('/profile', AuthController.updateProfile);

export default router;