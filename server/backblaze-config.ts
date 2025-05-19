
import { S3Client } from '@aws-sdk/client-s3';

const backblazeClient = new S3Client({
  endpoint: process.env.BACKBLAZE_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com',
  region: 'us-west-004',
  credentials: {
    accessKeyId: process.env.BACKBLAZE_KEY_ID || '',
    secretAccessKey: process.env.BACKBLAZE_APP_KEY || ''
  }
});

export default backblazeClient;
