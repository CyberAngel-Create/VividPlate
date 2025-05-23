import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';

// Backblaze B2 configuration (compatible with S3)
let s3Client: S3Client | null = null;

// Initialize Backblaze B2 client
export function getBackblazeClient(): S3Client {
  if (!s3Client) {
    const region = process.env.BACKBLAZE_BUCKET_REGION || 'us-west-002';
    const keyId = process.env.BACKBLAZE_APPLICATION_KEY_ID || '';
    const applicationKey = process.env.BACKBLAZE_APPLICATION_KEY || '';
    const endpoint = `https://s3.${region}.backblazeb2.com`;
    
    if (!keyId || !applicationKey) {
      throw new Error('Backblaze configuration is incomplete. Using local storage instead.');
    }
    
    s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: applicationKey
      }
    });
  }
  
  return s3Client;
}

// Upload a file to Backblaze
export async function uploadToBackblaze(
  filePath: string, 
  folderPath: string, 
  fileName: string, 
  contentType: string = 'image/jpeg'
): Promise<string> {
  try {
    const client = getBackblazeClient();
    const bucketName = process.env.BACKBLAZE_BUCKET_NAME || '';
    
    if (!bucketName) {
      throw new Error('Backblaze bucket name is not configured');
    }
    
    const fileStream = fs.createReadStream(filePath);
    const key = `${folderPath}/${fileName}`;
    
    // Use the Upload utility for multipart uploads
    const upload = new Upload({
      client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: fileStream,
        ContentType: contentType
      }
    });
    
    await upload.done();
    
    const fileUrl = `${process.env.BACKBLAZE_PUBLIC_URL}/${key}`;
    return fileUrl;
  } catch (error) {
    console.error('Error uploading to Backblaze:', error);
    throw new Error(`Failed to upload file to Backblaze: ${error.message}`);
  }
}

// Check if Backblaze configuration is available
export function isBackblazeConfigured(): boolean {
  try {
    const endpoint = process.env.BACKBLAZE_ENDPOINT;
    const region = process.env.BACKBLAZE_REGION;
    const keyId = process.env.BACKBLAZE_KEY_ID;
    const applicationKey = process.env.BACKBLAZE_APPLICATION_KEY;
    const bucketName = process.env.BACKBLAZE_BUCKET_NAME;
    
    return !!(endpoint && region && keyId && applicationKey && bucketName);
  } catch (error) {
    return false;
  }
}