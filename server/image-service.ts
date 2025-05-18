import fs from 'fs';
import path from 'path';
import imagekit from './imagekit-config';
import { processImage, ResizeOptions } from './image-utils';

/**
 * Service to handle image uploads to ImageKit
 */
export class ImageService {
  /**
   * Upload an image to ImageKit
   * @param filePath Path to the local file
   * @param folder ImageKit folder to store the image in (e.g., 'menu-items', 'logos', 'banners')
   * @param fileName Optional custom filename
   * @param options Optional resize options
   * @returns Promise with the ImageKit upload response
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
      
      // Upload to ImageKit
      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: originalFileName,
        folder: `vividplate/${folder}`,
        useUniqueFileName: true,
        tags: [`vividplate`, folder],
      });
      
      // Clean up the processed file if it's different from the original
      if (processedPath !== filePath && fs.existsSync(processedPath)) {
        fs.unlinkSync(processedPath);
      }
      
      return response;
    } catch (error) {
      console.error('Error uploading image to ImageKit:', error);
      throw error;
    }
  }
  
  /**
   * Upload a menu item image to ImageKit
   * @param filePath Path to the local file
   * @returns URL of the uploaded image
   */
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
  
  /**
   * Upload a banner image to ImageKit
   * @param filePath Path to the local file
   * @returns URL of the uploaded image
   */
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
  
  /**
   * Upload a logo image to ImageKit
   * @param filePath Path to the local file
   * @returns URL of the uploaded image
   */
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
  
  /**
   * Delete an image from ImageKit
   * @param fileId The ImageKit file ID to delete
   * @returns Promise with the deletion response
   */
  static async deleteImage(fileId: string) {
    try {
      return await imagekit.deleteFile(fileId);
    } catch (error) {
      console.error('Error deleting image from ImageKit:', error);
      throw error;
    }
  }
  
  /**
   * Generate a URL with transformation parameters for an ImageKit image
   * @param url Original ImageKit URL
   * @param transformations Object with transformation parameters
   * @returns Transformed URL
   */
  static getTransformedUrl(url: string, transformations: Record<string, any>): string {
    if (!url || !url.includes('ik.imagekit.io')) {
      return url; // Return original URL if not an ImageKit URL
    }
    
    return imagekit.url({
      src: url,
      transformation: [transformations]
    });
  }
}