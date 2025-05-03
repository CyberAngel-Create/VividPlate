import { useToast } from '@/hooks/use-toast';
import { apiRequest } from './queryClient';

/**
 * Enhanced file upload utility that includes retries and verification
 */
export const uploadFileWithVerification = async (
  file: File,
  url: string,
  options?: {
    maxRetries?: number;
    verifyUrl?: boolean;
    onProgress?: (progress: number) => void;
    additionalFormData?: Record<string, string>;
  }
): Promise<{ success: boolean; url: string | null; message: string }> => {
  
  const maxRetries = options?.maxRetries || 2;
  const verifyUrl = options?.verifyUrl !== undefined ? options.verifyUrl : true;
  let currentRetry = 0;
  
  const upload = async (): Promise<{ success: boolean; url: string | null; message: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add any additional form data
      if (options?.additionalFormData) {
        Object.entries(options.additionalFormData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      // Create custom XMLHttpRequest to track upload progress
      if (options?.onProgress) {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              options.onProgress?.(progress);
            }
          });
          
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve({
                  success: true,
                  url: response.url,
                  message: 'Upload successful'
                });
              } catch (error) {
                reject(new Error('Invalid response format'));
              }
            } else {
              reject(new Error(`HTTP error ${xhr.status}: ${xhr.statusText}`));
            }
          });
          
          xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
          xhr.addEventListener('abort', () => reject(new Error('Upload was aborted')));
          
          xhr.open('POST', url);
          xhr.send(formData);
        });
      }

      // Use fetch API for upload without progress tracking
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error(`Upload failed with status: ${response.status}`);
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Upload successful:', data);
      
      if (!data.url) {
        throw new Error('Upload response missing URL');
      }
      
      // Verify the uploaded file is accessible
      if (verifyUrl) {
        console.log(`Verifying file accessibility at: ${data.url}`);
        const verifyResult = await verifyFileAccessibility(data.url);
        
        if (!verifyResult.accessible) {
          console.error('File verification failed:', verifyResult.message);
          throw new Error(`Uploaded file is not accessible: ${verifyResult.message}`);
        }
        
        console.log('File verification successful');
      }
      
      return {
        success: true,
        url: data.url,
        message: 'Upload and verification successful'
      };
    } catch (error) {
      console.error(`Upload attempt ${currentRetry + 1} failed:`, error);
      
      if (currentRetry < maxRetries) {
        currentRetry++;
        console.log(`Retrying upload (${currentRetry}/${maxRetries})...`);
        
        // Exponential backoff: 1s, 2s, 4s, etc.
        const backoffTime = 1000 * Math.pow(2, currentRetry - 1);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        
        return upload();
      }
      
      return {
        success: false,
        url: null,
        message: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  };
  
  return upload();
};

/**
 * Verify that an uploaded file is accessible via HTTP
 */
export const verifyFileAccessibility = async (url: string): Promise<{ accessible: boolean; message: string }> => {
  try {
    // Make a HEAD request to check if the file is accessible
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      return {
        accessible: false,
        message: `File not accessible (HTTP ${response.status})`
      };
    }
    
    return {
      accessible: true,
      message: 'File is accessible'
    };
  } catch (error) {
    return {
      accessible: false,
      message: error instanceof Error ? error.message : 'Unknown error during accessibility check'
    };
  }
};

/**
 * Hook for file uploads with toast notifications
 */
export const useFileUpload = () => {
  const { toast } = useToast();
  
  const uploadFile = async (
    file: File,
    url: string,
    options?: {
      maxRetries?: number;
      verifyUrl?: boolean;
      onProgress?: (progress: number) => void;
      showToasts?: boolean;
      additionalFormData?: Record<string, string>;
    }
  ) => {
    const showToasts = options?.showToasts !== undefined ? options.showToasts : true;
    
    try {
      if (showToasts) {
        toast({
          title: 'Uploading file',
          description: 'Please wait while your file is uploaded...',
        });
      }
      
      const result = await uploadFileWithVerification(file, url, options);
      
      if (result.success) {
        if (showToasts) {
          toast({
            title: 'Upload successful',
            description: 'Your file has been uploaded and verified',
          });
        }
        return result;
      } else {
        if (showToasts) {
          toast({
            title: 'Upload failed',
            description: result.message,
            variant: 'destructive'
          });
        }
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during upload';
      console.error('Upload error:', error);
      
      if (showToasts) {
        toast({
          title: 'Upload error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
      
      return {
        success: false,
        url: null,
        message: errorMessage
      };
    }
  };
  
  const checkUploadsStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/system/uploads-diagnostic');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to check uploads status:', error);
      return null;
    }
  };
  
  return {
    uploadFile,
    checkUploadsStatus
  };
};