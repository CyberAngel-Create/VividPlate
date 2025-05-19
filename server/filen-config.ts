import FilenSDK from '@filen/sdk';

// Filen configuration
let filenClient: FilenSDK | null = null;

export function initializeFilenClient(email: string, password: string): FilenSDK {
  if (!filenClient) {
    filenClient = new FilenSDK({
      email,
      password,
      masterKeys: [] // Will be fetched automatically
    });
    console.log('Filen client initialized');
  }
  
  return filenClient;
}

export function getFilenClient(): FilenSDK | null {
  return filenClient;
}

export default {
  initializeFilenClient,
  getFilenClient
};