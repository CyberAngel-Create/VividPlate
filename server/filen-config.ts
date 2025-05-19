import * as FilenSDK from '@filen/sdk';

// Filen configuration
let filenClient: any = null;

export function initializeFilenClient(email: string, password: string): any {
  if (!filenClient) {
    try {
      // First try the latest SDK version
      filenClient = new FilenSDK.default({
        email,
        password,
        twoFactorCode: null
      });
      console.log('Filen client initialized with latest SDK version');
    } catch (error) {
      console.error('Error initializing Filen client with latest SDK version, trying fallback:', error);
      
      // Fallback for older SDK versions
      try {
        const SDK = require('@filen/sdk');
        filenClient = new SDK({
          email, 
          password,
          twoFactorCode: null
        });
        console.log('Filen client initialized with fallback SDK version');
      } catch (fallbackError) {
        console.error('Fallback Filen initialization also failed:', fallbackError);
        throw fallbackError;
      }
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