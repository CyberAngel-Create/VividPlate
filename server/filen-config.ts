
import { FilenSDK } from '@filen/sdk';

// Filen configuration
let filenClient: any = null;

export async function initializeFilenClient(email: string = 'michaellegesse.gh@gmail.com', password: string = '@Mike@Leg#1746'): Promise<any> {
  if (!filenClient) {
    try {
      filenClient = new FilenSDK({
        email,
        password,
        twoFactorCode: null
      });
      console.log('Filen client initialized successfully');
    } catch (error) {
      console.error('Error initializing Filen client:', error);
      throw error;
    }
  }
  return filenClient;
}

export function getFilenClient(): any {
  return filenClient;
}

export default {
  initializeFilenClient,
  getFilenClient
};
