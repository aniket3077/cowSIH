import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: UserRole;
    userId?: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface UserCreateData {
  firebaseUid: string;
  email: string;
  name?: string;
  role?: UserRole;
}

export interface UserUpdateData {
  name?: string;
  role?: UserRole;
  profileImage?: string;
  isActive?: boolean;
}

export interface BreedPredictionData {
  breedName: string;
  confidence: number;
  processingTime?: number;
  additionalInfo?: {
    description?: string;
    characteristics?: string[];
    origin?: string;
  };
}

export interface FlaskHealthCheck {
  isConnected: boolean;
  responseTime?: number;
  version?: string;
  error?: string;
}