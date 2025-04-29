import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MenuItem } from "@shared/schema";

interface FeedbackDialogProps {
  menuItem: MenuItem;
  restaurantId: number;
  trigger: React.ReactNode;
}

const FeedbackDialog = ({ menuItem, restaurantId, trigger }: FeedbackDialogProps) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [open, setOpen] = useState(false);
  
  const { toast } = useToast();
  
  const handleStarHover = (value: number) => {
    setHoveredRating(value);
  };
  
  const handleStarLeave = () => {
    setHoveredRating(null);
  };
  
  const handleStarClick = (value: number) => {
    setRating(value);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Error',
        description: 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare form data
      const formData = {
        rating,
        comment: comment.trim() || null,
        customerName: name.trim() || null,
        customerEmail: email.trim() || null,
        menuItemId: menuItem.id
      };
      
      // Send to server
      const response = await apiRequest(
        'POST',
        `/api/restaurants/${restaurantId}/feedback`,
        formData
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit feedback');
      }
      
      // Reset form
      setRating(5);
      setComment('');
      setName('');
      setEmail('');
      setIsSubmitted(true);
      
      toast({
        title: 'Success',
        description: 'Thank you for your feedback!',
      });

      // Close dialog after a short delay
      setTimeout(() => {
        setOpen(false);
        // Reset the submitted state after dialog is closed
        setTimeout(() => setIsSubmitted(false), 300);
      }, 1500);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit feedback',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {!isSubmitted ? (
          <>
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
                      onClick={() => handleStarClick(value)}
                      onMouseEnter={() => handleStarHover(value)}
                      onMouseLeave={handleStarLeave}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        size={28}
                        className={`${
                          (hoveredRating !== null
                            ? value <= hoveredRating
                            : value <= rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        } transition-colors`}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name (optional)</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
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
          </>
        ) : (
          <div className="py-6 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-medium mb-2">Thank You!</h3>
            <p className="text-muted-foreground">Your feedback helps improve the dining experience for everyone.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;