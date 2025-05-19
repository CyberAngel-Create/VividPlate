
import { S3Client } from '@aws-sdk/client-s3';

const backblazeClient = new S3Client({
  endpoint: 'https://s3.us-west-004.backblazeb2.com',
  region: 'us-west-004',
  credentials: {
    accessKeyId: '0054e0e4718ce770000000001',
    secretAccessKey: 'K005gcdqA9PuLOSs8oQH5SS/Zmreihs'
  }
});

export default backblazeClient;
