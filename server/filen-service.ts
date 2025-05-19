import fs from 'fs';
import path from 'path';
import { getFilenClient, initializeFilenClient } from './filen-config';
import { processMenuItemImage, processBannerImage, processLogoImage } from './image-utils';

// Regular expression to extract Filen public URL from a directory
const filenPublicUrlRegex = /https:\/\/drive\.filen\.io\/d\/[a-zA-Z0-9]+$/;

// Folder structure within Filen
const FOLDERS = {
  ROOT: 'VividPlate',
  MENU_ITEMS: 'menu-items',
  LOGOS: 'logos',
  BANNERS: 'banners'
};

// Ensure all folders exist in Filen
async function ensureFolderStructure(email: string, password: string) {
  try {
    const client = initializeFilenClient(email, password);
    
    // Get root directory content
    const root = await client.fs().list('/');
    
    // Check if app root folder exists
    let appFolder = root.find(item => item.type === 'directory' && item.name === FOLDERS.ROOT);
    
    // Create app root folder if it doesn't exist
    if (!appFolder) {
      await client.fs().mkdir({
        name: FOLDERS.ROOT,
        parent: '/'
      });
      console.log(`Created root Filen folder: ${FOLDERS.ROOT}`);
    }
    
    // Ensure subfolders exist
    const subfolders = [FOLDERS.MENU_ITEMS, FOLDERS.LOGOS, FOLDERS.BANNERS];
    
    for (const subfolder of subfolders) {
      const parentPath = `/${FOLDERS.ROOT}`;
      const content = await client.fs().list(parentPath);
      
      const folderExists = content.find(item => 
        item.type === 'directory' && item.name === subfolder
      );
      
      if (!folderExists) {
        await client.fs().mkdir({
          name: subfolder,
          parent: parentPath
        });
        console.log(`Created Filen subfolder: ${parentPath}/${subfolder}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up Filen folder structure:', error);
    return false;
  }
}

// Upload a file to Filen
async function uploadToFilen(localFilePath: string, folderType: 'menu-items' | 'logos' | 'banners') {
  try {
    const client = await initializeFilenClient();
    if (!client) {
      throw new Error('Filen client not initialized');
    }
    
    const fileName = path.basename(localFilePath);
    const parentPath = `/${FOLDERS.ROOT}/${folderType}`;
    
    // Ensure the file exists
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`File not found: ${localFilePath}`);
    }
    
    // Upload the file
    console.log('Attempting to upload to Filen:', { localFilePath, parentPath, fileName });
    
const fileStream = fs.createReadStream(localFilePath);
const uploadResult = await client.fs().upload({
      source: fileStream,
      parent: parentPath,
      name: fileName,
      onProgress: (percentage: number) => {
        console.log(`Uploading to Filen: ${percentage.toFixed(2)}%`);
      }
    });
console.log('Filen upload result:', uploadResult);
    
    // Share the file to get a public URL
    const shareResult = await client.fs().share({
      uuid: uploadResult.uuid,
      downloadEnabled: true,
      password: null,
      expirationEnabled: false,
      expiration: 0
    });
    
    console.log(`File uploaded and shared on Filen: ${shareResult.url}`);
    return shareResult.url;
  } catch (error) {
    console.error(`Error uploading file to Filen (${folderType}):`, error);
    throw error;
  }
}

/**
 * Upload a menu item image to Filen
 * @param localFilePath Path to the local file
 * @returns URL of the uploaded image
 */
export async function uploadMenuItemImage(localFilePath: string): Promise<string> {
  // First, process the image to optimize its size and dimensions
  const processedFilePath = await processMenuItemImage(localFilePath);
  
  // Upload the processed image to Filen
  return uploadToFilen(processedFilePath, FOLDERS.MENU_ITEMS);
}

/**
 * Upload a restaurant logo to Filen
 * @param localFilePath Path to the local file
 * @returns URL of the uploaded image
 */
export async function uploadLogoImage(localFilePath: string): Promise<string> {
  // First, process the image to optimize its size and dimensions
  const processedFilePath = await processLogoImage(localFilePath);
  
  // Upload the processed image to Filen
  return uploadToFilen(processedFilePath, FOLDERS.LOGOS);
}

/**
 * Upload a restaurant banner to Filen
 * @param localFilePath Path to the local file
 * @returns URL of the uploaded image
 */
export async function uploadBannerImage(localFilePath: string): Promise<string> {
  // First, process the image to optimize its size and dimensions
  const processedFilePath = await processBannerImage(localFilePath);
  
  // Upload the processed image to Filen
  return uploadToFilen(processedFilePath, FOLDERS.BANNERS);
}

/**
 * Used as a fallback when Filen upload fails
 * @param originalFilePath Original file path
 * @param processImageFunction Function to process the specific image type
 * @returns Local URL for the image
 */
export async function storeImageLocally(
  originalFilePath: string, 
  processImageFunction: (filePath: string) => Promise<string>
): Promise<{ url: string; filePath: string }> {
  try {
    // Process the image locally
    const processedFilePath = await processImageFunction(originalFilePath);
    
    // Return the local URL
    const fileName = path.basename(processedFilePath);
    const url = `/uploads/${fileName}`;
    
    return { url, filePath: processedFilePath };
  } catch (error) {
    console.error('Error storing image locally:', error);
    
    // If processing fails, return the original file
    const fileName = path.basename(originalFilePath);
    return { url: `/uploads/${fileName}`, filePath: originalFilePath };
  }
}

export default {
  ensureFolderStructure,
  uploadMenuItemImage,
  uploadLogoImage,
  uploadBannerImage,
  storeImageLocally
};