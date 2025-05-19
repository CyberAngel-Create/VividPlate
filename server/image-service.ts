
import fs from 'fs';
import path from 'path';
import { Storage } from '@replit/storage';
import { processImage, ResizeOptions } from './image-utils';

// Initialize storage with error handling
let storage: Storage;
try {
  storage = new Storage();
} catch (error) {
  console.error('Failed to initialize Replit Storage:', error);
  throw new Error('Storage initialization failed');
}

/**
 * Service to handle image uploads using Replit Storage
 */
export class ImageService {
  /**
   * Upload an image to Replit Storage
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

      // Upload to Replit Storage with retry
      let retries = 3;
      while (retries > 0) {
        try {
          await storage.set(storagePath, fileBuffer);
          const url = await storage.getUrl(storagePath);
          
          // Clean up processed file if different from original
          if (processedPath !== filePath && fs.existsSync(processedPath)) {
            fs.unlinkSync(processedPath);
          }

          return { url, storagePath };
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Error uploading image to Replit Storage:', error);
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
      await storage.delete(storagePath);
      return true;
    } catch (error) {
      console.error('Error deleting image from Replit Storage:', error);
      throw error;
    }
  }

  static async checkStorageConnection(): Promise<boolean> {
    try {
      // Test storage by setting and getting a value
      const testKey = 'storage-test';
      await storage.set(testKey, 'test');
      const value = await storage.get(testKey);
      await storage.delete(testKey);
      return value === 'test';
    } catch (error) {
      console.error('Storage connection test failed:', error);
      return false;
    }
  }
}
