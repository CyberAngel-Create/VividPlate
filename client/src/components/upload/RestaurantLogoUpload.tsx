import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { normalizeImageUrl, getFallbackImage } from '@/lib/imageUtils';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useFileUpload } from '@/lib/upload-utils';
import { useSubscriptionStatus } from '@/hooks/use-subscription-status';

interface RestaurantLogoUploadProps {
  restaurantId: number;
  currentLogoUrl?: string;
  onSuccess?: (logoUrl: string) => void;
}

const RestaurantLogoUpload = ({ restaurantId, currentLogoUrl, onSuccess }: RestaurantLogoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { uploadFile } = useFileUpload();
  const { subscriptionStatus } = useSubscriptionStatus();
  const bannerOnlyPlan = !subscriptionStatus || !subscriptionStatus.isPaid;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (bannerOnlyPlan) {
      toast({
        title: 'Logo uploads unavailable',
        description: 'Free plan accounts can only upload banner images. Upgrade to change your logo.',
        variant: 'destructive',
      });
      return;
    }

    const file = e.target.files?.[0];
    
    if (!file) return;

    console.log(`Starting logo upload process for restaurant ID: ${restaurantId}, File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);
    
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      console.warn(`Invalid logo file type: ${file.type}`);
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, GIF, or WebP image',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate file size (3MB max)
    if (file.size > 3 * 1024 * 1024) {
      console.warn(`Logo too large: ${file.size} bytes`);
      toast({
        title: 'File too large',
        description: 'Image must be less than 3MB',
        variant: 'destructive',
      });
      return;
    }
    
    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    console.log("Created local preview blob URL:", objectUrl);
    
    // Upload file
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Use enhanced upload utility
      const result = await uploadFile(file, `/api/restaurants/${restaurantId}/upload-logo`, {
        maxRetries: 2,
        verifyUrl: true,
        showToasts: true,
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });
      
      if (result.success && result.url) {
        console.log("Logo upload successful:", result.url);
        
        // Invalidate restaurant cache to update logo
        queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
        
        if (onSuccess) {
          onSuccess(result.url);
        }
      } else {
        console.error("Logo upload failed:", result.message);
        
        // Reset preview if upload failed
        if (currentLogoUrl) {
          setPreviewUrl(currentLogoUrl);
        } else {
          setPreviewUrl(null);
        }
      }
    } catch (error) {
      console.error("Logo upload error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload logo';
      
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // Reset preview if upload failed
      setPreviewUrl(currentLogoUrl || null);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveLogo = () => {
    setPreviewUrl(null);
    // Here you would typically update the restaurant to remove the logo
    // For now, we'll just reset the preview
  };
  
  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="text-sm font-medium mb-2">{t('restaurant.uploadLogo')}</div>
        <div className="text-xs text-gray-500 mb-4">{t('restaurant.logoSize')}</div>
        
        {previewUrl ? (
          <div className="relative w-32 h-32 mb-4">
            <img 
              src={previewUrl.startsWith('blob:') ? previewUrl : normalizeImageUrl(previewUrl)}
              alt="Restaurant logo preview" 
              className={`w-full h-full object-cover rounded-md dark:brightness-90 dark:contrast-110 ${isUploading ? 'opacity-50' : ''}`}
              onError={(e) => {
                console.error("Failed to load logo image:", previewUrl);
                e.currentTarget.src = getFallbackImage('logo');
              }}
            />
            {isUploading && uploadProgress > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 rounded-md">
                <div className="w-3/4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs mt-2 font-medium text-white bg-black/30 px-2 py-1 rounded">
                  {uploadProgress}%
                </p>
              </div>
            )}
            {isUploading && uploadProgress === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-md">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
              aria-label="Remove logo"
              disabled={isUploading || bannerOnlyPlan}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="w-32 h-32 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md mb-4">
            <span className="text-gray-500 text-sm">No logo</span>
          </div>
        )}
        
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(`logo-upload-${restaurantId}`)?.click()}
            disabled={isUploading || bannerOnlyPlan}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading... {uploadProgress > 0 && `${uploadProgress}%`}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Logo
              </>
            )}
          </Button>
          <input
            type="file"
            id={`logo-upload-${restaurantId}`}
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            disabled={isUploading || bannerOnlyPlan}
          />
        </div>
        {bannerOnlyPlan && (
          <p className="text-xs text-amber-600 mt-3">
            Logo uploads are available on paid plans. Free plan accounts can only upload a banner image.
          </p>
        )}
      </div>
    </div>
  );
};

export default RestaurantLogoUpload;