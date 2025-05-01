import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { normalizeImageUrl, getFallbackImage } from "@/lib/imageUtils";

interface MenuItemImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  existingImageUrl?: string;
}

const MenuItemImageUpload = ({ onImageUploaded, existingImageUrl }: MenuItemImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 3MB in size.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, WebP, or GIF image.",
        variant: "destructive",
      });
      return;
    }

    // Generate a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Create form data for upload
    const formData = new FormData();
    formData.append("image", file);
    
    setIsUploading(true);

    try {
      const response = await fetch("/api/upload/menuitem", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      onImageUploaded(data.imageUrl);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setPreviewUrl(existingImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-col items-center">
        {previewUrl ? (
          <div className="relative w-full">
            <img
              src={previewUrl.startsWith('blob:') ? previewUrl : normalizeImageUrl(previewUrl)}
              alt="Menu item"
              className="w-full h-48 object-cover rounded-md"
              onError={(e) => {
                console.error("Failed to load menu item image:", previewUrl);
                e.currentTarget.src = getFallbackImage('menu');
              }}
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={handleUploadClick}
            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">Click to upload menu item image</p>
            <p className="text-gray-400 text-xs mt-1">(Max size: 3MB)</p>
          </div>
        )}
      </div>
      
      {!previewUrl && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUploadClick}
          className="w-full"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </>
          )}
        </Button>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
};

export default MenuItemImageUpload;