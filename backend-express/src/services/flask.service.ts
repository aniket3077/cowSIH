import axios from 'axios';
import FormData from 'form-data';

export interface BreedPredictionResult {
  breedName: string;
  confidence: number;
  processingTime?: number;
  additionalInfo?: {
    description?: string;
    characteristics?: string[];
    origin?: string;
  };
}

export interface FlaskApiResponse {
  prediction: string;
  confidence: number;
  processing_time?: number;
  breed_info?: {
    description?: string;
    characteristics?: string[];
    origin?: string;
  };
  error?: string;
}

export class FlaskService {
  private static readonly FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';
  private static readonly TIMEOUT = 30000; // 30 seconds

  /**
   * Send image to Flask backend for breed prediction
   */
  static async predictBreed(imageBuffer: Buffer, filename: string): Promise<BreedPredictionResult> {
    try {
      const formData = new FormData();
      formData.append('image', imageBuffer, {
        filename: filename,
        contentType: 'image/jpeg'
      });

      const response = await axios.post<FlaskApiResponse>(
        `${this.FLASK_API_URL}/predict`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Accept': 'application/json'
          },
          timeout: this.TIMEOUT,
          maxContentLength: 10 * 1024 * 1024, // 10MB
          maxBodyLength: 10 * 1024 * 1024 // 10MB
        }
      );

      if (response.data.error) {
        throw new Error(`Flask API error: ${response.data.error}`);
      }

      return {
        breedName: response.data.prediction,
        confidence: response.data.confidence,
        processingTime: response.data.processing_time,
        additionalInfo: response.data.breed_info
      };

    } catch (error) {
      console.error('Flask service error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Flask backend is not running. Please start the Flask server.');
        }
        
        if (error.response?.status === 400) {
          throw new Error('Invalid image format or size');
        }
        
        if (error.response?.status === 500) {
          throw new Error('Flask backend processing error');
        }
        
        throw new Error(`Flask API request failed: ${error.message}`);
      }
      
      throw new Error('Failed to communicate with Flask backend');
    }
  }

  /**
   * Health check for Flask backend
   */
  static async checkFlaskHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.FLASK_API_URL}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('Flask health check failed:', error);
      return false;
    }
  }

  /**
   * Get available breeds from Flask backend
   */
  static async getAvailableBreeds(): Promise<string[]> {
    try {
      const response = await axios.get<{ breeds: string[] }>(
        `${this.FLASK_API_URL}/breeds`,
        { timeout: 10000 }
      );
      return response.data.breeds || [];
    } catch (error) {
      console.error('Failed to get available breeds:', error);
      return [];
    }
  }

  /**
   * Get detailed breed information from Flask backend
   */
  static async getBreedInfo(breedName: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.FLASK_API_URL}/breed-info/${encodeURIComponent(breedName)}`,
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get breed info:', error);
      return null;
    }
  }

  /**
   * Test connection to Flask backend
   */
  static async testConnection(): Promise<{
    isConnected: boolean;
    responseTime?: number;
    version?: string;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${this.FLASK_API_URL}/health`, {
        timeout: 5000
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        isConnected: true,
        responseTime,
        version: response.data.version || 'unknown'
      };
    } catch (error) {
      return {
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}