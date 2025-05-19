import { Filen } from '@filen/sdk';

// Filen configuration
let filenClient: any = null;

export function initializeFilenClient(email: string, password: string): any {
  if (!filenClient) {
    try {
      filenClient = new Filen({
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