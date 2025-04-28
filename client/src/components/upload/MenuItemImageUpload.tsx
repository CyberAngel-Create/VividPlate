import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Image, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';

interface MenuItemImageUploadProps {
  itemId: number;
  currentImageUrl?: string;
  onSuccess?: (imageUrl: string) => void;
}

const MenuItemImageUpload: React.FC<MenuItemImageUploadProps> = ({ 
  itemId, 
  currentImageUrl, 
  onSuccess 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 3MB)
    const maxSize = 3 * 1024 * 1024; // 3MB in bytes
    if (file.size > maxSize) {
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
    
    // Upload to server
    const formData = new FormData();
    formData.append('image', file);
    
    setIsUploading(true);
    setError(null);
    
    try {
      const response = await apiRequest(
        'POST', 
        `/api/items/${itemId}/upload-image`, 
        formData,
        true // Use FormData
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Success',
        description: 'Image uploaded successfully.',
      });
      
      if (onSuccess) {
        onSuccess(data.imageUrl);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload image');
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
      
      // Revert to previous image if upload failed
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Card className="w-full overflow-hidden border">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">{t('menu.uploadImage')}</h3>
            <p className="text-xs text-muted-foreground">{t('menu.imageSize')}</p>
          </div>
          
          {previewUrl ? (
            <div className="relative aspect-video w-full rounded-md overflow-hidden bg-muted">
              <img 
                src={previewUrl} 
                alt="Menu item preview" 
                className="object-cover w-full h-full" 
              />
              <div className="absolute inset-0 flex items-end justify-end p-2">
                <label 
                  htmlFor="itemImage" 
                  className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors"
                >
                  Change Image
                </label>
              </div>
            </div>
          ) : (
            <label
              htmlFor="itemImage"
              className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-md border-muted-foreground/20 hover:border-muted-foreground/40 cursor-pointer transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="mb-1 text-sm">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, GIF, WEBP (MAX 3MB)
                </p>
              </div>
            </label>
          )}
          
          <input
            id="itemImage"
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
            <span>Uploading image...</span>
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
            <span>Image ready</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MenuItemImageUpload;