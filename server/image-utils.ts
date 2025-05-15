import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
  maxSizeKB?: number;
}

const DEFAULT_QUALITY = 80;

/**
 * Compresses and resizes images based on their type and target size
 */
export async function processImage(
  filePath: string, 
  options: ResizeOptions = {}
): Promise<string> {
  try {
    console.log(`Processing image: ${filePath} with options:`, options);
    
    // Generate output filename with -processed suffix to avoid overwriting original
    const parsedPath = path.parse(filePath);
    const outputPath = path.join(
      parsedPath.dir, 
      `${parsedPath.name}-processed${parsedPath.ext}`
    );
    
    // Create Sharp instance with additional error handling
    let imageProcessor;
    try {
      imageProcessor = sharp(filePath);
      
      // Add a timeout to prevent hanging on corrupt images
      imageProcessor.timeout({
        seconds: 30
      });
    } catch (err) {
      console.error(`Failed to create Sharp instance for ${filePath}:`, err);
      throw new Error(`Image processing engine could not read the file: ${err.message}`);
    }
    
    // Get image metadata with error handling
    let metadata;
    try {
      metadata = await imageProcessor.metadata();
      console.log(`Original image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);
    } catch (err) {
      console.error(`Failed to read image metadata for ${filePath}:`, err);
      throw new Error(`Could not read image metadata: ${err.message}`);
    }
    
    // Normalize image format - handle mobile specific issues
    if (!metadata.format) {
      console.warn(`Unknown image format for ${filePath}, will convert to JPEG`);
      metadata.format = 'jpeg'; // Force a known format if none detected
    }
    
    // Resize if dimensions are specified
    if (options.width || options.height) {
      try {
        imageProcessor = imageProcessor.resize({
          width: options.width,
          height: options.height,
          fit: options.fit || 'cover',
          withoutEnlargement: true
        });
      } catch (err) {
        console.error(`Failed to resize image ${filePath}:`, err);
        throw new Error(`Image resize operation failed: ${err.message}`);
      }
    }
    
    // Quality and compression settings
    const quality = options.quality || DEFAULT_QUALITY;
    
    // Apply format-specific compression with better error handling
    let buffer: Buffer;
    
    try {
      switch (metadata.format?.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          buffer = await imageProcessor.jpeg({ quality }).toBuffer();
          break;
        case 'png':
          buffer = await imageProcessor.png({ quality }).toBuffer();
          break;
        case 'webp':
          buffer = await imageProcessor.webp({ quality }).toBuffer();
          break;
        case 'heic':
        case 'heif':
          // Mobile devices often use HEIC/HEIF format
          console.log(`Converting HEIC/HEIF image to JPEG for better compatibility`);
          buffer = await imageProcessor.jpeg({ quality }).toBuffer();
          break;
        default:
          // For other formats or if format is unknown, convert to JPEG
          console.log(`Converting unknown format to JPEG for compatibility`);
          buffer = await imageProcessor.jpeg({ quality }).toBuffer();
      }
    } catch (err) {
      console.error(`Failed to process ${metadata.format} image ${filePath}:`, err);
      throw new Error(`Image format conversion failed: ${err.message}`);
    }
    
    // Further compression if needed to meet size limit
    if (options.maxSizeKB) {
      const maxSizeBytes = options.maxSizeKB * 1024;
      
      // Check if we need to compress more
      if (buffer.length > maxSizeBytes) {
        console.log(`Image size ${buffer.length} bytes exceeds target size ${maxSizeBytes} bytes. Further compressing...`);
        
        // Start with initial quality and step it down until we hit target size or minimum quality
        let currentQuality = quality;
        const minQuality = 50; // Don't go below 50% quality to maintain reasonable image appearance
        const stepSize = 5;
        
        while (buffer.length > maxSizeBytes && currentQuality > minQuality) {
          currentQuality -= stepSize;
          
          // Apply appropriate compression based on format
          switch (metadata.format?.toLowerCase()) {
            case 'jpeg':
            case 'jpg':
              buffer = await imageProcessor.jpeg({ quality: currentQuality }).toBuffer();
              break;
            case 'png':
              buffer = await imageProcessor.png({ quality: currentQuality }).toBuffer();
              break;
            case 'webp':
              buffer = await imageProcessor.webp({ quality: currentQuality }).toBuffer();
              break;
            default:
              buffer = await imageProcessor.jpeg({ quality: currentQuality }).toBuffer();
          }
          
          console.log(`Compressed to quality ${currentQuality}, new size: ${buffer.length} bytes`);
        }
      }
    }
    
    // Write the processed image to file
    await fs.promises.writeFile(outputPath, buffer);
    
    // Log results
    console.log(`Image processed and saved to: ${outputPath}, Size: ${buffer.length} bytes`);
    
    return outputPath;
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Error processing image:', error);
    throw new Error(`Failed to process image: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Process menu item images to the recommended size and quality
 */
export async function processMenuItemImage(filePath: string): Promise<string> {
  return processImage(filePath, {
    width: 600,      // Width suitable for menu items
    height: 400,     // Height suitable for menu items
    fit: 'cover',    // Crop to fill the dimensions
    quality: 80,     // Good image quality
    maxSizeKB: 150   // Max 150KB as requested
  });
}

/**
 * Process banner images to the recommended size and quality
 */
export async function processBannerImage(filePath: string): Promise<string> {
  return processImage(filePath, {
    width: 1200,     // Width for banner image (maintains aspect while respecting 320 height)
    height: 320,     // Height for banner as requested
    fit: 'cover',    // Crop to fill the dimensions
    quality: 80,     // Good image quality
    maxSizeKB: 200   // Max 200KB as requested
  });
}

/**
 * Process logo images to the recommended size and quality
 */
export async function processLogoImage(filePath: string): Promise<string> {
  return processImage(filePath, {
    width: 400,      // Width suitable for logos
    height: 400,     // Height suitable for logos
    fit: 'contain',  // Maintain aspect ratio without cropping
    quality: 85,     // Slightly higher quality for logos
    maxSizeKB: 100   // Max 100KB for logos
  });
}