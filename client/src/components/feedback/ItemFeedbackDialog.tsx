import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
    setIsSubmitting(true);
    
    try {
      // In a real app, we would send this to the server
      // await apiRequest('POST', `/api/restaurants/${restaurantId}/feedback`, {
      //   menuItemId: menuItem.id,
      //   rating,
      //   comment
      // });
      
      // For now, just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
        variant: "default",
      });
      
      // Reset form and close dialog
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate this dish</DialogTitle>
          <DialogDescription>
            Please share your feedback about <span className="font-medium">{menuItem.name}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      value <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comment">Comments</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this item..."
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemFeedbackDialog;