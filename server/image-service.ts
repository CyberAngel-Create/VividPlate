import fs from 'fs';
import path from 'path';
import { Storage } from '@replit/storage';
import { processImage, ResizeOptions } from './image-utils';

const storage = new Storage();

/**
 * Service to handle image uploads using Replit Storage
 */
export class ImageService {
  /**
   * Upload an image to Replit Storage
   * @param filePath Path to the local file
   * @param folder Folder to store the image in (e.g., 'menu-items', 'logos', 'banners') 
   * @param fileName Optional custom filename
   * @param options Optional resize options
   * @returns Object with the file URL
   */
  static async uploadImage(
    filePath: string,
    folder: string,
    fileName?: string,
    options?: ResizeOptions
  ) {
    try {
      // Process the image first (resize, compress) if options are provided
      const processedPath = options ? await processImage(filePath, options) : filePath;

      // Read the file as a buffer
      const fileBuffer = fs.readFileSync(processedPath);

      // Use the original filename if no custom name is provided
      const originalFileName = fileName || path.basename(filePath);
      const uniqueFileName = `${Date.now()}-${originalFileName}`;
      const storagePath = `${folder}/${uniqueFileName}`;

      // Upload to Replit Storage
      await storage.set(storagePath, fileBuffer);
      const url = await storage.getUrl(storagePath);

      // Clean up the processed file if it's different from the original
      if (processedPath !== filePath && fs.existsSync(processedPath)) {
        fs.unlinkSync(processedPath);
      }

      return { url, storagePath };
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
}