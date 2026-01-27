import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

interface MenuItemData {
  id: number;
  name: string;
  imageUrl?: string | null;
}

interface ItemFeedbackDialogProps {
  children: React.ReactNode;
  menuItem: MenuItemData;
  restaurantId: number;
}

const ItemFeedbackDialog: React.FC<ItemFeedbackDialogProps> = ({
  children,
  menuItem,
  restaurantId
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
      // Send the feedback to the API endpoint
      const response = await apiRequest('POST', `/api/restaurants/${restaurantId}/feedbacks`, {
        menuItemId: menuItem.id,
        customerName: name,
        customerEmail: email,
        rating,
        comment: feedback
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      
      // Reset form
      setName('');
      setEmail('');
      setFeedback('');
      setRating(0);
      setIsOpen(false);
      
      toast({
        title: t('feedback.success', 'Feedback sent!'),
        description: t('feedback.thankYou', 'Thank you for your feedback. The restaurant owner will receive your comments.'),
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: t('feedback.error', 'Error sending feedback'),
        description: t('feedback.tryAgain', 'Please try again later.'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t('feedback.aboutItem', 'Feedback for {{item}}', { item: menuItem.name })}
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
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSubmitting ? t('feedback.sending', 'Sending...') : t('feedback.send', 'Send Feedback')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ItemFeedbackDialog;