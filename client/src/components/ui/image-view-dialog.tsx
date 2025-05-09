import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X } from 'lucide-react';
import { normalizeImageUrl, getFallbackImage } from '@/lib/imageUtils';

interface ImageViewDialogProps {
  imageSrc: string;
  imageAlt: string;
  children: React.ReactNode;
}

const ImageViewDialog = ({ imageSrc, imageAlt, children }: ImageViewDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl p-0 bg-transparent border-none">
        <div className="relative">
          <button 
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <img 
            src={normalizeImageUrl(imageSrc)} 
            alt={imageAlt} 
            className="w-full h-auto rounded-lg max-h-[80vh] object-contain dark:brightness-90 dark:contrast-110 dark:bg-gray-800"
            onError={(e) => {
              console.error("Failed to load image in dialog:", imageSrc);
              e.currentTarget.src = getFallbackImage('menu');
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewDialog;