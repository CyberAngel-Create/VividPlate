import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

interface MenuItemImageUploadProps {
  itemId: number;
  currentImageUrl?: string;
  onSuccess?: (imageUrl: string) => void;
}

const MenuItemImageUpload = ({ itemId, currentImageUrl, onSuccess }: MenuItemImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
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
      formData.append('image', file);
      
      const response = await apiRequest(
        'POST', 
        `/api/items/${itemId}/upload-image`, 
        formData,
        true // Use FormData
      );
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Image uploaded',
          description: 'Menu item image has been updated',
        });
        
        // Invalidate menu item cache to update image
        queryClient.invalidateQueries({ queryKey: [`/api/items/${itemId}`] });
        
        if (onSuccess) {
          onSuccess(data.imageUrl);
        }
      } else {
        throw new Error(data.message || 'Failed to upload image');
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An error occurred while uploading your image',
        variant: 'destructive',
      });
      
      // Reset preview if upload failed
      if (currentImageUrl) {
        setPreviewUrl(currentImageUrl);
      } else {
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveImage = () => {
    setPreviewUrl(null);
    // Here you would typically update the menu item to remove the image
    // For now, we'll just reset the preview
  };
  
  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="text-sm font-medium mb-2">{t('menu.uploadImage')}</div>
        <div className="text-xs text-gray-500 mb-4">{t('menu.imageSize')}</div>
        
        {previewUrl ? (
          <div className="relative w-full max-w-xs mb-4">
            <img 
              src={previewUrl}
              alt="Menu item image preview" 
              className="w-full h-auto object-cover rounded-md"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="w-full max-w-xs h-40 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md mb-4">
            <span className="text-gray-500 text-sm">No image</span>
          </div>
        )}
        
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(`item-image-upload-${itemId}`)?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </Button>
          <input
            type="file"
            id={`item-image-upload-${itemId}`}
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

export default MenuItemImageUpload;