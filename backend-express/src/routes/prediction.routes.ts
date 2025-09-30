import express from 'express';
import { PredictionController, upload } from '../controllers/prediction.controller';
import { authenticateToken, isFarmer, isOfficer } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Breed prediction routes
router.post('/breed', isFarmer, upload.single('image'), PredictionController.predictBreed);
router.get('/breeds', PredictionController.getAvailableBreeds);
router.get('/breeds/:breedName/info', PredictionController.getBreedInfo);

// User prediction history
router.get('/history', PredictionController.getPredictionHistory);
router.get('/stats', PredictionController.getPredictionStats);
router.get('/:id', PredictionController.getPredictionById);

// Admin/Officer routes
router.get('/', isOfficer, PredictionController.getAllPredictions);

// System routes
router.get('/system/flask-status', isOfficer, PredictionController.testFlaskConnection);

export default router;