
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Image } from "lucide-react";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { MenuItem } from "@shared/schema";

interface ItemFeedbackDialogProps {
  menuItem: MenuItem;
  restaurantId: number;
  children: React.ReactNode;
}

const ItemFeedbackDialog = ({ menuItem, restaurantId, children }: ItemFeedbackDialogProps) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!menuItem) return;
    
    setIsSubmitting(true);

    try {
      await apiRequest('POST', `/api/restaurants/${restaurantId}/feedback`, {
        menuItemId: menuItem.id,
        rating,
        comment
      });

      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
        variant: "default",
      });

      setRating(5);
      setComment("");
      setOpen(false);
    } catch (error) {
      toast({
        title: "Failed to submit feedback",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!menuItem) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{menuItem.name}</DialogTitle>
          <DialogDescription>
            {menuItem.description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 relative aspect-video overflow-hidden rounded-lg">
          <ResponsiveImage
            src={menuItem.imageUrl}
            alt={menuItem.name}
            className="object-cover"
          />
        </div>

        <DialogFooter className="mt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemFeedbackDialog;
