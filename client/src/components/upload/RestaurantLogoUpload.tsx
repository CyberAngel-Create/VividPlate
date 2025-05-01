import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { normalizeImageUrl, getFallbackImage } from '@/lib/imageUtils';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

interface RestaurantLogoUploadProps {
  restaurantId: number;
  currentLogoUrl?: string;
  onSuccess?: (logoUrl: string) => void;
}

const RestaurantLogoUpload = ({ restaurantId, currentLogoUrl, onSuccess }: RestaurantLogoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, GIF, or WebP image',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate file size (3MB max)
    if (file.size > 3 * 1024 * 1024) {
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
    
    // Upload file
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await apiRequest(
        'POST', 
        `/api/restaurants/${restaurantId}/upload-logo`, 
        formData,
        true // Use FormData
      );
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Logo uploaded',
          description: 'Restaurant logo has been updated',
        });
        
        // Invalidate restaurant cache to update logo
        queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
        
        if (onSuccess) {
          onSuccess(data.logoUrl);
        }
      } else {
        throw new Error(data.message || 'Failed to upload logo');
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An error occurred while uploading your logo',
        variant: 'destructive',
      });
      
      // Reset preview if upload failed
      if (currentLogoUrl) {
        setPreviewUrl(currentLogoUrl);
      } else {
        setPreviewUrl(null);
      }
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
              className="w-full h-full object-cover rounded-md"
              onError={(e) => {
                console.error("Failed to load logo image:", previewUrl);
                e.currentTarget.src = getFallbackImage('logo');
              }}
            />
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
              aria-label="Remove logo"
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
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload Logo'}
          </Button>
          <input
            type="file"
            id={`logo-upload-${restaurantId}`}
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
      </div>
    </div>
  );
};

export default RestaurantLogoUpload;