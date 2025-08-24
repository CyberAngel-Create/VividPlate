import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image } from "lucide-react";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { successful: Array<{ uploadURL: string }> }) => void;
  buttonClassName?: string;
  children?: ReactNode;
  accept?: string;
}

/**
 * A file upload component that renders as a button and provides a simple interface for
 * file upload.
 * 
 * Features:
 * - Renders as a customizable button that opens a file selection dialog
 * - Direct file upload to object storage via presigned URLs
 * - Progress indication during upload
 * - Error handling for failed uploads
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL)
 * @param props.onComplete - Callback function called when upload is complete
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 * @param props.accept - File input accept attribute for file type filtering
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  accept = "image/*",
}: ObjectUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size
    if (file.size > maxFileSize) {
      alert(`File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Get upload parameters
      const { method, url } = await onGetUploadParameters();

      // Upload file
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(progress);
        }
      });

      xhr.open(method, url);
      xhr.setRequestHeader('Content-Type', file.type);

      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            resolve(url);
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
      });

      xhr.send(file);
      
      const uploadURL = await uploadPromise;
      
      // Call completion callback
      if (onComplete) {
        onComplete({
          successful: [{ uploadURL }]
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input safely
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const triggerFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = maxNumberOfFiles > 1;
    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      
      // Create a synthetic React event-like object
      const syntheticEvent = {
        target: event.target as HTMLInputElement,
        currentTarget: event.target as HTMLInputElement,
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleFileUpload(syntheticEvent);
    };
    input.click();
  };

  return (
    <div className="relative">
      <Button 
        onClick={triggerFileSelect} 
        className={buttonClassName}
        disabled={uploading}
      >
        {uploading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{uploadProgress}%</span>
          </div>
        ) : (
          children || (
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Upload Image</span>
            </div>
          )
        )}
      </Button>
    </div>
  );
}