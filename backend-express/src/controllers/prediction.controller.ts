import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { FlaskService } from '../services/flask.service';
import { prisma } from '../index';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

export class PredictionController {
  // Predict breed from uploaded image
  static async predictBreed(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Image file is required' });
        return;
      }

      const userId = req.user!.userId!;
      const imageBuffer = req.file.buffer;
      const filename = req.file.originalname;

      // Check Flask backend health first
      const isFlaskHealthy = await FlaskService.checkFlaskHealth();
      if (!isFlaskHealthy) {
        res.status(503).json({ 
          error: 'Prediction service is currently unavailable. Please try again later.' 
        });
        return;
      }

      // Send image to Flask for prediction
      const startTime = Date.now();
      const prediction = await FlaskService.predictBreed(imageBuffer, filename);
      const processingTime = Date.now() - startTime;

      // Save prediction result to database
      const savedPrediction = await prisma.prediction.create({
        data: {
          userId,
          imagePath: `temp/${filename}`, // You might want to save the actual image
          breedName: prediction.breedName,
          confidence: prediction.confidence,
          processingTime: processingTime / 1000, // Convert to seconds
          metadata: {
            originalFilename: filename,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            additionalInfo: prediction.additionalInfo
          }
        }
      });

      res.json({
        success: true,
        data: {
          id: savedPrediction.id,
          breedName: prediction.breedName,
          confidence: prediction.confidence,
          processingTime: processingTime,
          additionalInfo: prediction.additionalInfo,
          timestamp: savedPrediction.createdAt
        }
      });

    } catch (error) {
      console.error('Prediction error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Flask backend is not running')) {
          res.status(503).json({ error: 'Prediction service is temporarily unavailable' });
          return;
        }
        
        if (error.message.includes('Invalid image format')) {
          res.status(400).json({ error: 'Invalid image format or corrupted file' });
          return;
        }
      }
      
      res.status(500).json({ error: 'Failed to process image prediction' });
    }
  }

  // Get prediction history for current user
  static async getPredictionHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [predictions, total] = await Promise.all([
        prisma.prediction.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            breedName: true,
            confidence: true,
            processingTime: true,
            createdAt: true,
            metadata: true
          }
        }),
        prisma.prediction.count({ where: { userId } })
      ]);

      res.json({
        success: true,
        data: predictions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get prediction history error:', error);
      res.status(500).json({ error: 'Failed to get prediction history' });
    }
  }

  // Get prediction by ID
  static async getPredictionById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId!;

      const prediction = await prisma.prediction.findFirst({
        where: { 
          id,
          userId // Ensure user can only access their own predictions
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      if (!prediction) {
        res.status(404).json({ error: 'Prediction not found' });
        return;
      }

      res.json({
        success: true,
        data: prediction
      });

    } catch (error) {
      console.error('Get prediction by ID error:', error);
      res.status(500).json({ error: 'Failed to get prediction' });
    }
  }

  // Get all predictions (admin/officer only)
  static async getAllPredictions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [predictions, total] = await Promise.all([
        prisma.prediction.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true
              }
            }
          }
        }),
        prisma.prediction.count()
      ]);

      res.json({
        success: true,
        data: predictions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get all predictions error:', error);
      res.status(500).json({ error: 'Failed to get predictions' });
    }
  }

  // Get prediction statistics
  static async getPredictionStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.role === 'ADMIN' ? undefined : req.user!.userId!;
      
      const whereClause = userId ? { userId } : {};

      const [
        totalPredictions,
        avgConfidence,
        breedDistribution,
        recentPredictions
      ] = await Promise.all([
        prisma.prediction.count({ where: whereClause }),
        prisma.prediction.aggregate({
          where: whereClause,
          _avg: { confidence: true }
        }),
        prisma.prediction.groupBy({
          by: ['breedName'],
          where: whereClause,
          _count: { breedName: true },
          orderBy: { _count: { breedName: 'desc' } },
          take: 10
        }),
        prisma.prediction.findMany({
          where: whereClause,
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            breedName: true,
            confidence: true,
            createdAt: true
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalPredictions,
          averageConfidence: avgConfidence._avg.confidence || 0,
          breedDistribution: breedDistribution.map((item: any) => ({
            breed: item.breedName,
            count: item._count.breedName
          })),
          recentPredictions
        }
      });

    } catch (error) {
      console.error('Get prediction stats error:', error);
      res.status(500).json({ error: 'Failed to get prediction statistics' });
    }
  }

  // Test Flask connection
  static async testFlaskConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const connectionTest = await FlaskService.testConnection();
      
      res.json({
        success: true,
        data: connectionTest
      });

    } catch (error) {
      console.error('Flask connection test error:', error);
      res.status(500).json({ error: 'Failed to test Flask connection' });
    }
  }

  // Get available breeds
  static async getAvailableBreeds(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const breeds = await FlaskService.getAvailableBreeds();
      
      res.json({
        success: true,
        data: { breeds }
      });

    } catch (error) {
      console.error('Get available breeds error:', error);
      res.status(500).json({ error: 'Failed to get available breeds' });
    }
  }

  // Get breed information
  static async getBreedInfo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { breedName } = req.params;
      const breedInfo = await FlaskService.getBreedInfo(breedName);
      
      if (!breedInfo) {
        res.status(404).json({ error: 'Breed information not found' });
        return;
      }

      res.json({
        success: true,
        data: breedInfo
      });

    } catch (error) {
      console.error('Get breed info error:', error);
      res.status(500).json({ error: 'Failed to get breed information' });
    }
  }
}