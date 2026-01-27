import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { normalizeImageUrl, getFallbackImage } from "@/lib/imageUtils";
import { useFileUpload } from "@/lib/upload-utils";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";

interface MenuItemImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  existingImageUrl?: string;
}

const MenuItemImageUpload = ({ onImageUploaded, existingImageUrl }: MenuItemImageUploadProps) => {
  const { toast } = useToast();
  const { uploadFile } = useFileUpload();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { subscriptionStatus } = useSubscriptionStatus();
  const bannerOnlyPlan = !subscriptionStatus || !subscriptionStatus.isPaid;

  const handleUploadClick = () => {
    if (bannerOnlyPlan) {
      toast({
        title: "Menu item uploads unavailable",
        description: "Free plan accounts can only upload banner images. Upgrade to add menu photos.",
        variant: "destructive",
      });
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (bannerOnlyPlan) {
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    console.log(`Starting upload process for file: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);
    setError(null);

    // Validate file size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      console.warn(`File too large: ${file.size} bytes`);
      setError("Image must be less than 3MB in size.");
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
      setError("Please upload a JPEG, PNG, WebP, or GIF image.");
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
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Use the enhanced upload utility with progress tracking
      const result = await uploadFile(file, "/api/upload/menuitem", {
        maxRetries: 2,
        verifyUrl: true,
        showToasts: false, // We'll handle toasts ourselves
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
        // Make sure we're sending the expected field name 'image'
        additionalFormData: {
          fieldName: "image"
        }
      });
      
      if (result.success && result.url) {
        console.log("Upload successful:", result.url);
        onImageUploaded(result.url);
        toast({
          title: "Upload successful",
          description: "The image has been uploaded successfully.",
        });
      } else {
        console.error("Upload failed:", result.message);
        setError(result.message);
        setPreviewUrl(existingImageUrl || null);
        toast({
          title: "Upload failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      setPreviewUrl(existingImageUrl || null);
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    if (bannerOnlyPlan) {
      return;
    }
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
              className={`w-full h-48 object-cover rounded-md dark:brightness-90 dark:contrast-110 ${isUploading ? 'opacity-50' : ''}`}
              onError={(e) => {
                console.error("Failed to load menu item image:", previewUrl);
                e.currentTarget.src = getFallbackImage('menu');
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
                  {uploadProgress}% uploaded
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
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              disabled={isUploading || bannerOnlyPlan}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={handleUploadClick}
            className={`w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md flex flex-col items-center justify-center transition-colors bg-white dark:bg-gray-700 ${bannerOnlyPlan ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            <ImageIcon className="h-10 w-10 text-gray-400 dark:text-gray-300 mb-2" />
            <p className="text-gray-500 dark:text-gray-300 text-sm">Click to upload menu item image</p>
            <p className="text-gray-400 dark:text-gray-400 text-xs mt-1">(Max size: 3MB)</p>
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
          disabled={isUploading || bannerOnlyPlan}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading... {uploadProgress > 0 && `${uploadProgress}%`}
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
        disabled={isUploading || bannerOnlyPlan}
      />
      {bannerOnlyPlan && (
        <p className="text-xs text-amber-600 text-center">
          Menu item image uploads are available on paid plans. Free plan accounts can only upload a banner image.
        </p>
      )}
    </div>
  );
};

export default MenuItemImageUpload;