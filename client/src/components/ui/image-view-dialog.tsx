import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X, MessageSquare } from 'lucide-react';
import { normalizeImageUrl, getFallbackImage } from '@/lib/imageUtils';
import FeedbackDialog from './feedback-dialog';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";

interface ImageViewDialogProps {
  imageSrc: string;
  imageAlt: string;
  children: React.ReactNode;
  description?: string;
  menuItemId?: number;
  restaurantId?: number;
}

const ImageViewDialog = ({
  imageSrc,
  imageAlt,
  children,
  description,
  menuItemId,
  restaurantId
}: ImageViewDialogProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl p-0 bg-white border rounded-lg overflow-hidden">
        <div className="relative">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Image */}
          <div className="bg-black">
            <img
              src={normalizeImageUrl(imageSrc)}
              alt={imageAlt}
              className="w-full h-auto max-h-[50vh] object-contain mx-auto"
              onError={(e) => {
                console.error("Failed to load image in dialog:", imageSrc);
                e.currentTarget.src = getFallbackImage('menu');
              }}
            />
          </div>

          {/* Description and Feedback */}
          <div className="p-4">
            <h3 className="text-lg font-medium mb-2">{imageAlt}</h3>

            {description && (
              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            )}

            {/* Customer Feedback Section */}
            {menuItemId && restaurantId && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium mb-2">{t("feedback.leaveReview", "Share your thoughts")}</h4>
                <div className="flex justify-start">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => {
                      setOpen(false);
                      setTimeout(() => {
                        const feedbackBtn = document.getElementById(`feedback-btn-${menuItemId}`);
                        if (feedbackBtn) {
                          (feedbackBtn as HTMLButtonElement).click();
                        }
                      }, 100);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t("feedback.leaveFeedback", "Leave Feedback")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewDialog;