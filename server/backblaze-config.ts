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
      console.error('❌ Backblaze configuration is incomplete');
      throw new Error('Backblaze configuration is incomplete. Using local storage instead.');
    }
    
    try {
      s3Client = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId: keyId,
          secretAccessKey: applicationKey
        }
      });
      console.log('✅ Backblaze client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Backblaze client:', error);
      throw error;
    }
  }
  
  return s3Client;
}

// Test Backblaze connection
export async function testBackblazeConnection(): Promise<boolean> {
  try {
    const client = getBackblazeClient();
    const bucketName = process.env.BACKBLAZE_BUCKET_NAME;
    if (!bucketName) {
      console.error('❌ Backblaze bucket name not configured');
      return false;
    }
    
    // Try to list objects to verify connection
    await client.send(new ListObjectsCommand({ Bucket: bucketName }));
    console.log('✅ Successfully connected to Backblaze B2');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Backblaze:', error);
    return false;
  }
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
    const region = process.env.BACKBLAZE_BUCKET_REGION;
    const keyId = process.env.BACKBLAZE_APPLICATION_KEY_ID;
    const applicationKey = process.env.BACKBLAZE_APPLICATION_KEY;
    const bucketName = process.env.BACKBLAZE_BUCKET_NAME;
    
    const isConfigured = !!(region && keyId && applicationKey && bucketName);
    
    if (isConfigured) {
      console.log('✅ Backblaze B2 configured for permanent image storage');
    } else {
      console.log('⚠️ Backblaze B2 not configured - using local storage');
    }
    
    return isConfigured;
  } catch (error) {
    console.log('❌ Error checking Backblaze configuration:', error);
    return false;
  }
}