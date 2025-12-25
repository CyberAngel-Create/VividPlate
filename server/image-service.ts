import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { processMenuItemImage, processBannerImage, processLogoImage, ResizeOptions } from './image-utils.js';
import { isBackblazeConfigured, uploadToBackblaze } from './backblaze-config.js';

// Base directory for storing uploaded images
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Make sure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Create directories for specific image types
const MENU_ITEMS_DIR = path.join(UPLOADS_DIR, 'menu-items');
const BANNERS_DIR = path.join(UPLOADS_DIR, 'banners');
const LOGOS_DIR = path.join(UPLOADS_DIR, 'logos');

// Create these directories if they don't exist
[MENU_ITEMS_DIR, BANNERS_DIR, LOGOS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Main Image Service class for managing image uploads
 * - Uses Backblaze for menu-items, logos, and banners when configured
 * - Falls back to local storage otherwise
 */
class ImageService {
  static async uploadImage(
    filePath: string,
    targetDir: string,
    prefix: string,
    processImageFn: (filePath: string) => Promise<string>,
    backblazeFolder: string,
    options?: ResizeOptions
  ): Promise<string> {
    try {
      // Process image first (resize, compress, etc.)
      const processedFilePath = await processImageFn(filePath);
      
      // Generate a unique filename
      const filename = `${prefix}-${uuidv4()}${path.extname(processedFilePath)}`;
      const destPath = path.join(targetDir, filename);
      
      // Copy processed file to destination
      fs.copyFileSync(processedFilePath, destPath);
      
      // If temporary file was created during processing, clean it up
      if (processedFilePath !== filePath) {
        fs.unlinkSync(processedFilePath);
      }
      
      // Always try to upload to Backblaze for permanent storage
      let fileUrl = '';
      
      if (isBackblazeConfigured()) {
        try {
          // Upload to Backblaze B2 for permanent cloud storage
          fileUrl = await uploadToBackblaze(
            destPath,
            backblazeFolder,
            filename,
            'image/jpeg'
          );
          
          console.log(`✅ Image permanently stored in Backblaze: ${fileUrl}`);
          
          // Clean up local file after successful cloud upload
          try {
            fs.unlinkSync(destPath);
            console.log(`🗑️ Local file cleaned up: ${destPath}`);
          } catch (cleanupError) {
            console.log(`⚠️ Could not clean up local file: ${cleanupError.message}`);
          }
          
          return fileUrl;
        } catch (backblazeError) {
          console.error('❌ Backblaze upload failed, using local storage as fallback:', backblazeError);
        }
      } else {
        console.log('⚠️ Backblaze not configured, storing locally');
      }
      
      // Generate a URL for local access
      fileUrl = `/uploads/${backblazeFolder}/${filename}`;
      console.log(`Image stored locally: ${fileUrl}`);
      
      return fileUrl;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }
  
  /**
   * Upload a menu item image
   */
  static async uploadMenuItemImage(filePath: string): Promise<string> {
    const options: ResizeOptions = {
      width: 800,
      height: 600,
      fit: 'cover',
      quality: 80
    };
    
    return this.uploadImage(
      filePath,
      MENU_ITEMS_DIR,
      'menu-item',
      processMenuItemImage,
      'menu-items',
      options
    );
  }
  
  /**
   * Upload a banner image
   */
  static async uploadBannerImage(filePath: string): Promise<string> {
    const options: ResizeOptions = {
      width: 1200,
      height: 400,
      fit: 'cover',
      quality: 80
    };
    
    return this.uploadImage(
      filePath,
      BANNERS_DIR,
      'banner',
      processBannerImage,
      'banners',
      options
    );
  }
  
  /**
   * Upload a logo image
   */
  static async uploadLogoImage(filePath: string): Promise<string> {
    const options: ResizeOptions = {
      width: 300,
      height: 300,
      fit: 'contain',
      quality: 90
    };
    
    return this.uploadImage(
      filePath,
      LOGOS_DIR,
      'logo',
      processLogoImage,
      'logos',
      options
    );
  }
  
  /**
   * Delete an image (from both Backblaze and local storage)
   */
  static async deleteImage(storagePath: string) {
    try {
      // For now just handle local deletion
      // Extract the filename from the URL path
      const relativePath = storagePath.startsWith('/uploads/') 
        ? storagePath.substring('/uploads/'.length) 
        : storagePath;
      
      const fullPath = path.join(UPLOADS_DIR, relativePath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Deleted local image: ${fullPath}`);
      }
      
      // Note: Backblaze deletion would be implemented here if needed
      
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }
}

export default ImageService;