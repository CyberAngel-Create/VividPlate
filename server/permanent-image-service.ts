import { storage } from './storage.js';
import { InsertPermanentImage } from '../shared/schema.js';
import fs from 'fs';
import path from 'path';
import { processImage, ResizeOptions } from './image-utils.js';

/**
 * Permanent Image Service - Stores images in database as base64
 * This ensures images persist across all devices and environments
 */
export class PermanentImageService {
  
  /**
   * Save an image permanently to the database
   * @param filePath Local file path
   * @param userId User ID
   * @param restaurantId Restaurant ID (optional)
   * @param category Image category (logo, banner, menu-item)
   * @param options Resize options
   * @returns Permanent filename for accessing the image
   */
  static async saveImage(
    filePath: string,
    userId: number,
    restaurantId: number | null,
    category: string,
    options?: ResizeOptions
  ): Promise<string> {
    try {
      // Process the image if resize options are provided
      let processedPath = filePath;
      if (options) {
        processedPath = await processImage(filePath, options);
      }

      // Read the processed image file
      const imageBuffer = fs.readFileSync(processedPath);
      const base64Data = imageBuffer.toString('base64');
      
      // Get file info
      const originalName = path.basename(filePath);
      const mimeType = this.getMimeType(originalName);
      const fileSize = imageBuffer.length;
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const filename = `${timestamp}-${randomSuffix}-${originalName}`;
      
      // Save to database
      const imageData: InsertPermanentImage = {
        filename,
        originalName,
        mimeType,
        imageData: base64Data,
        fileSize,
        userId,
        restaurantId,
        category
      };
      
      await storage.savePermanentImage(imageData);
      
      // Clean up temporary files if they were created during processing
      if (processedPath !== filePath) {
        try {
          fs.unlinkSync(processedPath);
        } catch (cleanupError) {
          console.warn('Could not clean up temporary file:', processedPath);
        }
      }
      
      return filename;
    } catch (error) {
      console.error('Error saving permanent image:', error);
      throw new Error('Failed to save image permanently');
    }
  }

  /**
   * Retrieve an image from the database
   * @param filename Permanent filename
   * @returns Image data and metadata or null if not found
   */
  static async getImage(filename: string): Promise<{
    imageData: string;
    mimeType: string;
    originalName: string;
    fileSize: number;
  } | null> {
    try {
      const image = await storage.getPermanentImage(filename);
      if (!image) {
        return null;
      }
      
      return {
        imageData: image.imageData,
        mimeType: image.mimeType,
        originalName: image.originalName,
        fileSize: image.fileSize
      };
    } catch (error) {
      console.error('Error retrieving permanent image:', error);
      return null;
    }
  }

  /**
   * Delete a permanent image
   * @param filename Permanent filename
   * @returns True if deleted successfully
   */
  static async deleteImage(filename: string): Promise<boolean> {
    try {
      return await storage.deletePermanentImage(filename);
    } catch (error) {
      console.error('Error deleting permanent image:', error);
      return false;
    }
  }

  /**
   * Get user's permanent images
   * @param userId User ID
   * @returns Array of user's images
   */
  static async getUserImages(userId: number) {
    try {
      return await storage.getPermanentImagesByUserId(userId);
    } catch (error) {
      console.error('Error getting user images:', error);
      return [];
    }
  }

  /**
   * Get restaurant's permanent images
   * @param restaurantId Restaurant ID
   * @returns Array of restaurant's images
   */
  static async getRestaurantImages(restaurantId: number) {
    try {
      return await storage.getPermanentImagesByRestaurantId(restaurantId);
    } catch (error) {
      console.error('Error getting restaurant images:', error);
      return [];
    }
  }

  /**
   * Get MIME type from filename
   * @param filename File name
   * @returns MIME type
   */
  private static getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.gif':
        return 'image/gif';
      case '.webp':
        return 'image/webp';
      case '.svg':
        return 'image/svg+xml';
      default:
        return 'image/jpeg'; // Default fallback
    }
  }
}

/**
 * Helper functions for specific image types
 */
export class PermanentImageHelpers {
  
  /**
   * Save a menu item image permanently
   */
  static async saveMenuItemImage(filePath: string, userId: number, restaurantId: number): Promise<string> {
    const options: ResizeOptions = {
      width: 400,
      height: 300,
      fit: 'cover',
      quality: 85,
      maxSizeKB: 100
    };
    
    return await PermanentImageService.saveImage(filePath, userId, restaurantId, 'menu-item', options);
  }

  /**
   * Save a restaurant logo permanently
   */
  static async saveLogoImage(filePath: string, userId: number, restaurantId: number): Promise<string> {
    const options: ResizeOptions = {
      width: 200,
      height: 200,
      fit: 'cover',
      quality: 90,
      maxSizeKB: 80
    };
    
    return await PermanentImageService.saveImage(filePath, userId, restaurantId, 'logo', options);
  }

  /**
   * Save a restaurant banner permanently
   */
  static async saveBannerImage(filePath: string, userId: number, restaurantId: number): Promise<string> {
    const options: ResizeOptions = {
      width: 800,
      height: 400,
      fit: 'cover',
      quality: 85,
      maxSizeKB: 120
    };
    
    return await PermanentImageService.saveImage(filePath, userId, restaurantId, 'banner', options);
  }
}