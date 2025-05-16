import React, { useState } from 'react';
import { MessageCircle, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface FeedbackDialogProps {
  menuItemId?: number;
  menuItemName?: string;
  restaurantId: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  position?: 'bottom-right' | 'inline';
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  menuItemId,
  menuItemName,
  restaurantId,
  variant = 'default',
  size = 'default',
  position = 'bottom-right'
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleStarHover = (value: number) => {
    setHoveredRating(value);
  };
  
  const handleStarLeave = () => {
    setHoveredRating(null);
  };
  
  const handleStarClick = (value: number) => {
    setRating(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // For now, we're just simulating the API call
      // In the future, this would connect to a real feedback endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      setName('');
      setEmail('');
      setFeedback('');
      setRating(0);
      setIsOpen(false);
      
      toast({
        title: t('feedback.success', 'Feedback sent!'),
        description: t('feedback.thankYou', 'Thank you for your feedback.'),
      });
    } catch (error) {
      toast({
        title: t('feedback.error', 'Error sending feedback'),
        description: t('feedback.tryAgain', 'Please try again later.'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic class based on position prop
  const buttonPositionClass = position === 'bottom-right' 
    ? 'fixed bottom-24 right-4 z-40 shadow-lg' 
    : '';

  // Dynamic sizing based on size prop
  const buttonSizeClass = size === 'sm' 
    ? 'h-9 px-3' 
    : size === 'lg' 
      ? 'h-11 px-5' 
      : 'h-10 px-4';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {position === 'bottom-right' ? (
          <Button 
            variant={variant} 
            className={`${buttonPositionClass} ${buttonSizeClass} rounded-full`}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {t('feedback.sendFeedback', 'Send Feedback')}
          </Button>
        ) : (
          <div className="text-blue-500 hover:text-blue-700 text-sm cursor-pointer flex items-center">
            <MessageCircle className="h-4 w-4 mr-1" />
            {t('menu.clickToLeaveFeedback', 'Click to leave feedback')}
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {menuItemName 
              ? t('feedback.aboutItem', 'Feedback for {{item}}', { item: menuItemName })
              : t('feedback.sendFeedback', 'Send Feedback')}
          </DialogTitle>
          <DialogDescription>
            {t('feedback.shareYourThoughts', 'Share your thoughts with the restaurant')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="rating">{t('feedback.yourRating', 'Your Rating')}</Label>
            <div className="flex items-center gap-1">
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
                    size={32}
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
            <Label htmlFor="name">{t('feedback.name', 'Name')}</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={t('feedback.yourName', 'Your name')}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">{t('feedback.email', 'Email')}</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder={t('feedback.yourEmail', 'Your email')}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="feedback">{t('feedback.message', 'Message')}</Label>
            <Textarea 
              id="feedback" 
              value={feedback} 
              onChange={(e) => setFeedback(e.target.value)} 
              placeholder={t('feedback.yourFeedback', 'Your feedback here...')}
              className="min-h-[100px]"
              required
            />
          </div>
          
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('feedback.sending', 'Sending...') : t('feedback.send', 'Send Feedback')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;