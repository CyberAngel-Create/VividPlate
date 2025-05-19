
import fs from 'fs';
import path from 'path';
import { Upload } from '@aws-sdk/lib-storage';
import { processImage, ResizeOptions } from './image-utils';
import backblazeClient from './backblaze-config';

const BUCKET_NAME = 'menumate-images';

class ImageService {
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

      try {
        // Upload to Backblaze B2
        const fileStream = fs.createReadStream(processedPath);
        const key = `${folder}/${path.basename(processedPath)}`;
        
        const upload = new Upload({
          client: backblazeClient,
          params: {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileStream,
            ContentType: 'image/jpeg'
          }
        });

        await upload.done();
        const fileUrl = `https://s3.us-west-004.backblazeb2.com/${BUCKET_NAME}/${key}`;
        
        // Clean up local files after successful upload
        if (fs.existsSync(processedPath)) {
          fs.unlinkSync(processedPath);
          console.log('Cleaned up processed file:', processedPath);
        }
        if (filePath !== processedPath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Cleaned up original file:', filePath);
        }

        return {
          url: fileUrl,
          storagePath: key
        };
      } catch (uploadError) {
        console.warn('Backblaze upload failed, falling back to local storage:', uploadError);
        
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
      if (storagePath.startsWith('http')) {
        // Extract key from URL
        const url = new URL(storagePath);
        storagePath = url.pathname.split('/').slice(2).join('/');
      }

      await backblazeClient.send({
        Bucket: BUCKET_NAME,
        Key: storagePath
      });
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
}

export default ImageService;
