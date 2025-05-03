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

    console.log(`Starting upload process for file: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);

    // Validate file size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      console.warn(`File too large: ${file.size} bytes`);
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
      console.warn(`Invalid file type: ${file.type}`);
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
    console.log("Created local preview blob URL:", objectUrl);

    // Create form data for upload
    const formData = new FormData();
    formData.append("image", file);
    
    setIsUploading(true);
    console.log("Starting upload to server...");

    let uploadAttempts = 0;
    const maxAttempts = 2;
    
    while (uploadAttempts < maxAttempts) {
      uploadAttempts++;
      try {
        console.log(`Upload attempt ${uploadAttempts} of ${maxAttempts}`);
        
        const response = await fetch("/api/upload/menuitem", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Server responded with status ${response.status}: ${errorText}`);
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Upload successful, received:", data);
        
        if (!data.imageUrl) {
          console.error("Server response missing imageUrl");
          throw new Error("Invalid server response");
        }
        
        // Verify the uploaded image is accessible
        try {
          const verifyResponse = await fetch(data.imageUrl, { method: 'HEAD' });
          if (!verifyResponse.ok) {
            console.warn(`Uploaded image at ${data.imageUrl} not immediately accessible (status: ${verifyResponse.status})`);
          } else {
            console.log(`Verified image is accessible at ${data.imageUrl}`);
          }
        } catch (verifyError) {
          console.warn(`Could not verify image accessibility: ${verifyError}`);
        }
        
        onImageUploaded(data.imageUrl);

        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
        
        return; // Exit the retry loop if successful
      } catch (error) {
        console.error(`Upload attempt ${uploadAttempts} failed:`, error);
        
        // If we've exhausted our retry attempts, show error and reset
        if (uploadAttempts >= maxAttempts) {
          toast({
            title: "Upload failed",
            description: "Failed to upload image after multiple attempts. Please try again.",
            variant: "destructive",
          });
          setPreviewUrl(existingImageUrl || null);
        } else {
          console.log(`Retrying upload in 1 second...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
        }
      }
    }
    
    setIsUploading(false);
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