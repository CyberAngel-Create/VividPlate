import imagekit from './imagekit-config.js';
import fs from 'fs';
import path from 'path';
import { processMenuItemImage, processBannerImage, processLogoImage } from './image-utils.js';

/**
 * Upload a menu item image to ImageKit
 * @param filePath Local file path
 * @param itemId Menu item ID
 * @param restaurantId Restaurant ID
 * @returns URL of the uploaded image on ImageKit
 */
export async function uploadMenuItemImageToImageKit(filePath: string, itemId: number, restaurantId: number): Promise<string> {
  try {
    // Process the image locally first to optimize it
    const processedFilePath = await processMenuItemImage(filePath);
    const fileToUpload = fs.existsSync(processedFilePath) ? processedFilePath : filePath;
    
    // Read the file as buffer for upload
    const fileBuffer = fs.readFileSync(fileToUpload);
    
    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: fileBuffer,
      fileName: `menu-item-${itemId}-${Date.now()}`,
      folder: 'vividplate/menu-items',
      useUniqueFileName: true,
      tags: ['menu-item', `restaurant-${restaurantId}`, `item-${itemId}`],
    });
    
    // Clean up local files
    if (processedFilePath !== filePath && fs.existsSync(processedFilePath)) {
      fs.unlinkSync(processedFilePath);
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return uploadResponse.url;
  } catch (error) {
    console.error('Error uploading menu item image to ImageKit:', error);
    throw error;
  }
}

/**
 * Upload a banner image to ImageKit
 * @param filePath Local file path
 * @param restaurantId Restaurant ID
 * @returns URL of the uploaded image on ImageKit
 */
export async function uploadBannerImageToImageKit(filePath: string, restaurantId: number): Promise<string> {
  try {
    // Process the image locally first to optimize it
    const processedFilePath = await processBannerImage(filePath);
    const fileToUpload = fs.existsSync(processedFilePath) ? processedFilePath : filePath;
    
    // Read the file as buffer for upload
    const fileBuffer = fs.readFileSync(fileToUpload);
    
    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: fileBuffer,
      fileName: `banner-${restaurantId}-${Date.now()}`,
      folder: 'vividplate/banners',
      useUniqueFileName: true,
      tags: ['banner', `restaurant-${restaurantId}`],
    });
    
    // Clean up local files
    if (processedFilePath !== filePath && fs.existsSync(processedFilePath)) {
      fs.unlinkSync(processedFilePath);
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return uploadResponse.url;
  } catch (error) {
    console.error('Error uploading banner image to ImageKit:', error);
    throw error;
  }
}

/**
 * Upload a logo image to ImageKit
 * @param filePath Local file path
 * @param restaurantId Restaurant ID
 * @returns URL of the uploaded image on ImageKit
 */
export async function uploadLogoImageToImageKit(filePath: string, restaurantId: number): Promise<string> {
  try {
    // Process the image locally first to optimize it
    const processedFilePath = await processLogoImage(filePath);
    const fileToUpload = fs.existsSync(processedFilePath) ? processedFilePath : filePath;
    
    // Read the file as buffer for upload
    const fileBuffer = fs.readFileSync(fileToUpload);
    
    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: fileBuffer,
      fileName: `logo-${restaurantId}-${Date.now()}`,
      folder: 'vividplate/logos',
      useUniqueFileName: true,
      tags: ['logo', `restaurant-${restaurantId}`],
    });
    
    // Clean up local files
    if (processedFilePath !== filePath && fs.existsSync(processedFilePath)) {
      fs.unlinkSync(processedFilePath);
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return uploadResponse.url;
  } catch (error) {
    console.error('Error uploading logo image to ImageKit:', error);
    throw error;
  }
}

/**
 * Used as a fallback when ImageKit upload fails
 * @param originalFilePath Original file path
 * @param processImageFunction Function to process the specific image type
 * @returns Local URL for the image
 */
export async function processImageLocally(
  originalFilePath: string, 
  processImageFunction: (path: string) => Promise<string>
): Promise<{ url: string, filePath: string }> {
  let finalFilePath = originalFilePath;
  let finalFileName = path.basename(originalFilePath);
  
  try {
    const processedFilePath = await processImageFunction(originalFilePath);
    
    if (fs.existsSync(processedFilePath)) {
      finalFilePath = processedFilePath;
      finalFileName = path.basename(processedFilePath);
      
      if (processedFilePath !== originalFilePath && fs.existsSync(originalFilePath)) {
        fs.unlinkSync(originalFilePath);
      }
    }
  } catch (error) {
    console.error('Error processing image locally:', error);
  }
  
  return { 
    url: `/uploads/${finalFileName}`,
    filePath: finalFilePath
  };
}