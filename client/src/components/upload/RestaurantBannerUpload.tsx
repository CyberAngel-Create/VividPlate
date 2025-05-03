import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Image, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';
import { normalizeImageUrl, getFallbackImage } from '@/lib/imageUtils';
import { useFileUpload } from '@/lib/upload-utils';

interface RestaurantBannerUploadProps {
  restaurantId: number;
  currentBannerUrl?: string;
  onSuccess?: (bannerUrl: string) => void;
}

const RestaurantBannerUpload: React.FC<RestaurantBannerUploadProps> = ({ 
  restaurantId, 
  currentBannerUrl, 
  onSuccess 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentBannerUrl || null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { uploadFile } = useFileUpload();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log(`Starting banner upload process for restaurant ID: ${restaurantId}, File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);
    
    // Check file size (max 3MB)
    const maxSize = 3 * 1024 * 1024; // 3MB in bytes
    if (file.size > maxSize) {
      console.warn(`Banner too large: ${file.size} bytes`);
      setError(`File size exceeds the limit of 3MB.`);
      toast({
        title: 'Error',
        description: 'File size exceeds the limit of 3MB.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.warn(`Invalid banner file type: ${file.type}`);
      setError('Only JPEG, PNG, GIF, and WebP images are allowed.');
      toast({
        title: 'Error',
        description: 'Only JPEG, PNG, GIF, and WebP images are allowed.',
        variant: 'destructive',
      });
      return;
    }
    
    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    console.log("Created local preview blob URL:", objectUrl);
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Use enhanced upload utility
      const result = await uploadFile(file, `/api/restaurants/${restaurantId}/upload-banner`, {
        maxRetries: 2,
        verifyUrl: true,
        showToasts: false, // We'll handle our own toast notifications
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });
      
      if (result.success && result.url) {
        console.log("Banner upload successful:", result.url);
        
        toast({
          title: 'Success',
          description: 'Banner uploaded successfully.',
        });
        
        if (onSuccess) {
          onSuccess(result.url);
        }
      } else {
        console.error("Banner upload failed:", result.message);
        
        setError(result.message);
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
        
        // Revert to previous image if upload failed
        setPreviewUrl(currentBannerUrl || null);
      }
    } catch (error) {
      console.error("Banner upload error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload banner';
      
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // Revert to previous image if upload failed
      setPreviewUrl(currentBannerUrl || null);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Card className="w-full overflow-hidden border">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">{t('restaurant.uploadBanner')}</h3>
            <p className="text-xs text-muted-foreground">{t('restaurant.bannerSize')}</p>
          </div>
          
          {previewUrl ? (
            <div className="relative aspect-[3/1] w-full rounded-md overflow-hidden bg-muted">
              <img 
                src={previewUrl.startsWith('blob:') ? previewUrl : normalizeImageUrl(previewUrl)} 
                alt="Restaurant banner preview" 
                className={`object-cover w-full h-full ${isUploading ? 'opacity-60' : ''}`}
                onError={(e) => {
                  console.error("Failed to load banner image:", previewUrl);
                  e.currentTarget.src = getFallbackImage('banner');
                }}
              />
              {isUploading && uploadProgress > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-3/4 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm mt-3 font-medium text-white bg-black/50 px-3 py-1 rounded">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
              {isUploading && uploadProgress === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              )}
              <div className="absolute inset-0 flex items-end justify-end p-2">
                <label 
                  htmlFor="bannerImage" 
                  className={`bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-md text-sm transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  tabIndex={isUploading ? -1 : 0}
                >
                  {isUploading ? 'Uploading...' : 'Change Banner'}
                </label>
              </div>
            </div>
          ) : (
            <label
              htmlFor="bannerImage"
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md border-muted-foreground/20 ${isUploading ? '' : 'hover:border-muted-foreground/40 cursor-pointer'} transition-colors`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Loader2 className="w-8 h-8 mb-2 text-primary animate-spin" />
                  <p className="mb-1 text-sm">
                    <span className="font-medium">Uploading banner...</span>
                  </p>
                  {uploadProgress > 0 && (
                    <>
                      <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden my-2">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {uploadProgress}% complete
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-1 text-sm">
                    <span className="font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, GIF, WEBP (MAX 3MB)
                  </p>
                </div>
              )}
            </label>
          )}
          
          <input
            id="bannerImage"
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
        
        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
            <span>Uploading banner{uploadProgress > 0 ? ` (${uploadProgress}%)` : '...'}</span>
            {uploadProgress > 0 && (
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden ml-2">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}
        
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        
        {!error && previewUrl && !isUploading && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Banner ready</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RestaurantBannerUpload;