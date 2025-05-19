import fs from 'fs';
import path from 'path';
import { processImage, ResizeOptions } from './image-utils';
import { uploadMenuItemImage, uploadLogoImage, uploadBannerImage } from './filen-service';

/**
 * Service to handle image uploads using Filen
 */
export class ImageService {
  /**
   * Upload an image using Filen
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

      // Try uploading to Filen first
      try {
        const filenUrl = await uploadToFilen(processedPath, folder);
        
        // Clean up local files after successful Filen upload
        if (fs.existsSync(processedPath)) {
          fs.unlinkSync(processedPath);
        }
        if (filePath !== processedPath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        return {
          url: filenUrl,
          storagePath: filenUrl
        };
      } catch (filenError) {
        console.warn('Filen upload failed, falling back to local storage:', filenError);
        
        // Fallback to local storage
        const localUrl = `/uploads/${path.basename(processedPath)}`;
        return {
          url: localUrl,
          storagePath: localUrl
        };
      }
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
      // For now, just return true as Filen doesn't provide direct delete API
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
}