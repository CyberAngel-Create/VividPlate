import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Image, Upload, CheckCircle, AlertCircle, Loader2, X, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';
import { normalizeImageUrl, getFallbackImage } from '@/lib/imageUtils';
import { useFileUpload } from '@/lib/upload-utils';

interface RestaurantBannerUploadProps {
  restaurantId: number;
  currentBannerUrl?: string;
  currentBannerUrls?: string[];
  onSuccess?: (bannerUrl: string, bannerUrls: string[]) => void;
}

const RestaurantBannerUpload: React.FC<RestaurantBannerUploadProps> = ({ 
  restaurantId, 
  currentBannerUrl, 
  currentBannerUrls, 
  onSuccess 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [bannerUrls, setBannerUrls] = useState<string[]>(currentBannerUrls || []);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { uploadFile } = useFileUpload();
  
  // Initialize bannerUrls with currentBannerUrl if it exists and bannerUrls is empty
  useEffect(() => {
    if (currentBannerUrl && bannerUrls.length === 0) {
      setBannerUrls([currentBannerUrl]);
    }
  }, [currentBannerUrl]);
  
  // Add auto-slideshow functionality
  useEffect(() => {
    if (bannerUrls.length <= 1) return;
    
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev === bannerUrls.length - 1 ? 0 : prev + 1));
      console.log('Banner carousel auto-advancing');
    }, 5000); // 5 seconds interval
    
    return () => clearInterval(timer);
  }, [bannerUrls.length]);

  // Go to the previous banner image in the carousel
  const previousImage = () => {
    if (bannerUrls.length <= 1) return;
    console.log('Manual navigation to previous banner image');
    setActiveIndex((prev) => {
      const newIndex = prev === 0 ? bannerUrls.length - 1 : prev - 1;
      console.log(`Changing banner from ${prev} to ${newIndex}`);
      return newIndex;
    });
  };

  // Go to the next banner image in the carousel
  const nextImage = () => {
    if (bannerUrls.length <= 1) return;
    console.log('Manual navigation to next banner image');
    setActiveIndex((prev) => {
      const newIndex = prev === bannerUrls.length - 1 ? 0 : prev + 1;
      console.log(`Changing banner from ${prev} to ${newIndex}`);
      return newIndex;
    });
  };

  // Remove the current banner image
  const removeImage = () => {
    if (bannerUrls.length <= 1) {
      toast({
        title: 'Cannot Remove',
        description: 'You need to have at least one banner image.',
        variant: 'destructive',
      });
      return;
    }

    const newBannerUrls = [...bannerUrls];
    newBannerUrls.splice(activeIndex, 1);
    setBannerUrls(newBannerUrls);
    
    // Adjust the active index if necessary
    if (activeIndex >= newBannerUrls.length) {
      setActiveIndex(newBannerUrls.length - 1);
    }

    // Update parent component
    if (onSuccess && newBannerUrls.length > 0) {
      onSuccess(newBannerUrls[0], newBannerUrls);
    }
  };

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
        
        // Add the new banner to the list
        const newBannerUrls = [...bannerUrls, result.url];
        setBannerUrls(newBannerUrls);
        
        // Set the newly uploaded image as active
        setActiveIndex(newBannerUrls.length - 1);
        
        toast({
          title: 'Success',
          description: 'Banner uploaded successfully.',
        });
        
        // Update parent component with the first image as the main banner and the full array
        if (onSuccess) {
          onSuccess(newBannerUrls[0], newBannerUrls);
        }
      } else {
        console.error("Banner upload failed:", result.message);
        
        setError(result.message);
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
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
          
          {bannerUrls.length > 0 ? (
            <div className="relative aspect-[3/1] w-full rounded-md overflow-hidden bg-muted">
              {/* Banner image carousel */}
              <img 
                src={normalizeImageUrl(bannerUrls[activeIndex])} 
                alt="Restaurant banner preview" 
                className={`object-cover w-full h-full ${isUploading ? 'opacity-60' : ''}`}
                onError={(e) => {
                  console.error("Failed to load banner image:", bannerUrls[activeIndex]);
                  e.currentTarget.src = getFallbackImage('banner');
                }}
              />
              
              {/* Upload progress indicator */}
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
              
              {/* Spinner for loading state */}
              {isUploading && uploadProgress === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              )}
              
              {/* Navigation controls for carousel */}
              {bannerUrls.length > 1 && !isUploading && (
                <>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70 h-8 w-8 rounded-full"
                    onClick={previousImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70 h-8 w-8 rounded-full"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
              
              {/* Indicators showing position in carousel */}
              {bannerUrls.length > 1 && (
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
                  {bannerUrls.map((_, index) => (
                    <button
                      key={index}
                      className={`h-2 rounded-full transition-all ${
                        activeIndex === index ? 'w-4 bg-primary' : 'w-2 bg-white/70 dark:bg-gray-500'
                      }`}
                      onClick={() => setActiveIndex(index)}
                    />
                  ))}
                </div>
              )}
              
              {/* Banner controls */}
              <div className="absolute top-2 right-2 flex space-x-2">
                {!isUploading && (
                  <>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white/50 hover:bg-red-600 hover:text-white text-red-600 dark:bg-black/30"
                      onClick={removeImage}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <label 
                      htmlFor="bannerImage" 
                      className="flex items-center justify-center h-8 w-8 rounded-full bg-white/50 hover:bg-primary hover:text-white text-primary cursor-pointer dark:bg-black/30"
                    >
                      <Plus className="h-4 w-4" />
                    </label>
                  </>
                )}
              </div>
            </div>
          ) : (
            // Empty state - no banner uploaded yet
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
                    <span className="font-medium">Click to upload banner</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, GIF, WEBP (MAX 3MB)
                  </p>
                </div>
              )}
            </label>
          )}
          
          {/* Hidden file input */}
          <input
            id="bannerImage"
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
        
        {/* Upload progress indicator outside of image */}
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
        
        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Banner upload summary */}
        {!error && bannerUrls.length > 0 && !isUploading && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>{bannerUrls.length > 1 ? `${bannerUrls.length} banners uploaded` : 'Banner ready'}</span>
            </div>
            {bannerUrls.length > 1 && (
              <p className="text-xs text-muted-foreground">
                Showing image {activeIndex + 1} of {bannerUrls.length}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RestaurantBannerUpload;