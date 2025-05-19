
import fs from 'fs';
import path from 'path';
import { Storage } from '@replit/storage';
import { processImage, ResizeOptions } from './image-utils';
import { filenClient } from './filen-config';

// Initialize storage with error handling
let storage: Storage | null = null;
try {
  storage = new Storage();
} catch (error) {
  console.error('Failed to initialize Replit Storage:', error);
}

/**
 * Service to handle image uploads using Replit Storage with Filen fallback
 */
export class ImageService {
  /**
   * Upload an image using available storage methods
   */
  static async uploadImage(
    filePath: string,
    folder: string,
    fileName?: string,
    options?: ResizeOptions
  ) {
    try {
      // Process the image first if options are provided
      const processedPath = options ? await processImage(filePath, options) : filePath;

      // Verify file exists
      if (!fs.existsSync(processedPath)) {
        throw new Error(`File not found: ${processedPath}`);
      }

      // Read the file as buffer
      const fileBuffer = fs.readFileSync(processedPath);

      // Generate unique filename
      const originalFileName = fileName || path.basename(filePath);
      const uniqueFileName = `${Date.now()}-${originalFileName}`;
      const storagePath = `${folder}/${uniqueFileName}`;

      // Try Replit Storage first
      if (storage) {
        try {
          await storage.set(storagePath, fileBuffer);
          const url = `/uploads/${uniqueFileName}`;
          return { url, storagePath };
        } catch (error) {
          console.error('Replit Storage upload failed, using local storage:', error);
        }
      }

      // Fallback to local storage
      const localPath = path.join(process.cwd(), 'uploads', uniqueFileName);
      fs.writeFileSync(localPath, fileBuffer);
      
      // Clean up processed file if different from original
      if (processedPath !== filePath && fs.existsSync(processedPath)) {
        fs.unlinkSync(processedPath);
      }

      return { 
        url: `/uploads/${uniqueFileName}`,
        storagePath: localPath 
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  static async uploadMenuItemImage(filePath: string): Promise<string> {
    const options: ResizeOptions = {
      width: 600,
      height: 400,
      fit: 'cover',
      quality: 80,
      maxSizeKB: 150
    };

    const response = await this.uploadImage(filePath, 'menu-items', undefined, options);
    return response.url;
  }

  static async uploadBannerImage(filePath: string): Promise<string> {
    const options: ResizeOptions = {
      width: 1200,
      height: 320,
      fit: 'cover',
      quality: 80,
      maxSizeKB: 200
    };

    const response = await this.uploadImage(filePath, 'banners', undefined, options);
    return response.url;
  }

  static async uploadLogoImage(filePath: string): Promise<string> {
    const options: ResizeOptions = {
      width: 400,
      height: 400,
      fit: 'cover',
      quality: 85,
      maxSizeKB: 100
    };

    const response = await this.uploadImage(filePath, 'logos', undefined, options);
    return response.url;
  }

  static async deleteImage(storagePath: string) {
    try {
      if (storage) {
        await storage.delete(storagePath);
      }
      // Also try to delete local file
      if (fs.existsSync(storagePath)) {
        fs.unlinkSync(storagePath);
      }
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
}
