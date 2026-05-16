import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const MAX_FILE_SIZE_KB = 100; // Target compressed size
const MIN_FILE_SIZE_KB = 70;  // Minimum acceptable size
const MAX_UPLOAD_SIZE_MB = 1;  // Maximum upload size

/**
 * Validates file size before processing
 */
function validateFileSize(filePath: string): void {
  const stats = fs.statSync(filePath);
  const fileSizeMB = stats.size / (1024 * 1024);
  
  if (fileSizeMB > MAX_UPLOAD_SIZE_MB) {
    throw new Error(`File size ${fileSizeMB.toFixed(2)}MB exceeds maximum allowed size of ${MAX_UPLOAD_SIZE_MB}MB`);
  }
}

/**
 * Smart image compression that achieves target file size (70-100KB)
 */
async function compressToTargetSize(
  imageProcessor: sharp.Sharp,
  format: string,
  targetSizeKB: number = MAX_FILE_SIZE_KB,
  minSizeKB: number = MIN_FILE_SIZE_KB
): Promise<Buffer> {
  let quality = 85;
  let width = undefined;
  let height = undefined;
  let buffer: Buffer;
  
  // Get original dimensions
  const metadata = await imageProcessor.metadata();
  const originalWidth = metadata.width || 1920;
  const originalHeight = metadata.height || 1080;
  
  // Start with reasonable dimensions - max 1200px width for web optimization
  if (originalWidth > 1200) {
    width = 1200;
    height = Math.round((originalHeight * 1200) / originalWidth);
  }
  
  const maxIterations = 15;
  let iteration = 0;
  
  console.log(`🎯 Starting smart compression with target: ${minSizeKB}-${targetSizeKB}KB`);
  
  while (iteration < maxIterations) {
    iteration++;
    
    try {
      let processor = imageProcessor.clone();
      
      // Apply resizing if needed
      if (width && height) {
        processor = processor.resize(width, height, {
          fit: 'cover',
          withoutEnlargement: true
        });
      }
      
      // Apply format-specific compression with optimizations
      if (format === 'jpeg' || format === 'jpg') {
        processor = processor.jpeg({ 
          quality, 
          progressive: true,
          mozjpeg: true // Better compression
        });
      } else if (format === 'png') {
        processor = processor.png({ 
          compressionLevel: 9,
          quality,
          progressive: true,
          adaptiveFiltering: true
        });
      } else if (format === 'webp') {
        processor = processor.webp({ 
          quality,
          effort: 6 // Higher effort for better compression
        });
      } else {
        // Convert to JPEG for better compression
        processor = processor.jpeg({ 
          quality, 
          progressive: true,
          mozjpeg: true
        });
      }
      
      buffer = await processor.toBuffer();
      const currentSizeKB = buffer.length / 1024;
      
      console.log(`📸 Iteration ${iteration}: Quality ${quality}, Size: ${Math.round(width || originalWidth)}x${Math.round(height || originalHeight)}, File: ${currentSizeKB.toFixed(1)}KB`);
      
      // Check if we hit our target range
      if (currentSizeKB >= minSizeKB && currentSizeKB <= targetSizeKB) {
        console.log(`✅ Perfect! Achieved target size: ${currentSizeKB.toFixed(1)}KB`);
        return buffer;
      }
      
      // If file is too large, reduce quality or size
      if (currentSizeKB > targetSizeKB) {
        if (quality > 20) {
          // Reduce quality more aggressively if file is much larger
          const reductionFactor = currentSizeKB > targetSizeKB * 2 ? 0.75 : 0.9;
          quality = Math.max(20, Math.round(quality * reductionFactor));
        } else if (width && height) {
          // Reduce dimensions if quality is already low
          const scaleFactor = Math.sqrt(targetSizeKB / currentSizeKB);
          width = Math.max(300, Math.round(width * scaleFactor));
          height = Math.max(200, Math.round(height * scaleFactor));
        } else {
          // Start reducing dimensions
          width = Math.round(originalWidth * 0.8);
          height = Math.round(originalHeight * 0.8);
        }
      } 
      // If file is too small, increase quality carefully
      else if (currentSizeKB < minSizeKB && quality < 95) {
        quality = Math.min(95, quality + 5);
      } else {
        // Close enough, accept it
        console.log(`✅ Acceptable size: ${currentSizeKB.toFixed(1)}KB`);
        return buffer;
      }
      
    } catch (error) {
      console.error(`❌ Compression iteration ${iteration} failed:`, error);
      if (iteration === 1) {
        throw error; // Re-throw if first attempt fails
      }
      // For subsequent iterations, try reducing parameters more aggressively
      quality = Math.max(15, quality - 10);
      if (width && height) {
        width = Math.round(width * 0.7);
        height = Math.round(height * 0.7);
      }
    }
  }
  
  // If we couldn't achieve target size, return the last result
  console.log(`⚠️ Max iterations reached. Final size: ${(buffer!.length / 1024).toFixed(1)}KB`);
  return buffer!;
}

/**
 * Enhanced image compression for MenuMate platform
 * Automatically compresses images to 70-100KB target size
 */
export async function compressImageSmart(filePath: string): Promise<string> {
  try {
    console.log(`🚀 Processing image for MenuMate: ${filePath}`);
    
    // Validate file size first
    validateFileSize(filePath);
    
    // Generate output filename
    const parsedPath = path.parse(filePath);
    const outputPath = path.join(
      parsedPath.dir, 
      `${parsedPath.name}-compressed${parsedPath.ext}`
    );
    
    // Create Sharp instance
    let imageProcessor;
    try {
      imageProcessor = sharp(filePath);
      imageProcessor.timeout({ seconds: 30 });
    } catch (err) {
      console.error(`Failed to create image processor for ${filePath}:`, err);
      throw new Error(`Cannot process this image file: ${err.message}`);
    }
    
    // Get image metadata
    let metadata;
    try {
      metadata = await imageProcessor.metadata();
      const originalSizeKB = fs.statSync(filePath).size / 1024;
      console.log(`📊 Original: ${metadata.width}x${metadata.height}, ${metadata.format}, ${originalSizeKB.toFixed(1)}KB`);
    } catch (err) {
      console.error(`Failed to read image metadata for ${filePath}:`, err);
      throw new Error(`Invalid image file: ${err.message}`);
    }
    
    if (!metadata.width || !metadata.height) {
      throw new Error(`Invalid image dimensions: ${metadata.width}x${metadata.height}`);
    }
    
    // Use smart compression to achieve target size
    const format = metadata.format || 'jpeg';
    const buffer = await compressToTargetSize(imageProcessor, format, MAX_FILE_SIZE_KB, MIN_FILE_SIZE_KB);
    
    // Write compressed image
    try {
      await fs.promises.writeFile(outputPath, buffer);
      const finalSizeKB = buffer.length / 1024;
      const compressionRatio = ((1 - finalSizeKB / (fs.statSync(filePath).size / 1024)) * 100);
      
      console.log(`🎉 Image compressed successfully!`);
      console.log(`📁 Output: ${outputPath}`);
      console.log(`📏 Final size: ${finalSizeKB.toFixed(1)}KB (${compressionRatio.toFixed(1)}% compression)`);
      
      return outputPath;
    } catch (err) {
      console.error(`Failed to save compressed image to ${outputPath}:`, err);
      throw new Error(`Could not save compressed image: ${err.message}`);
    }
    
  } catch (error) {
    console.error(`💥 Error compressing image ${filePath}:`, error);
    throw error;
  }
}

export { MAX_FILE_SIZE_KB, MIN_FILE_SIZE_KB, MAX_UPLOAD_SIZE_MB };