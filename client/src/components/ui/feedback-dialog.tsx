import React, { useState, useEffect } from 'react';
import { MessageCircle, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import PremiumFeatureDialog from './premium-feature-dialog';

interface FeedbackDialogProps {
  menuItemId?: number;
  menuItemName?: string;
  restaurantId: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  position?: 'bottom-right' | 'inline';
  checkPremiumStatus?: boolean;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  menuItemId,
  menuItemName,
  restaurantId,
  variant = 'default',
  size = 'default',
  position = 'bottom-right',
  checkPremiumStatus = false
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [name, setName] = useState('');
  
  // Check if restaurant is premium
  const [isPremium, setIsPremium] = useState(true);
  
  useEffect(() => {
    // Only perform the check if checkPremiumStatus is true
    if (checkPremiumStatus) {
      const checkRestaurantStatus = async () => {
        try {
          const response = await apiRequest('GET', `/api/restaurants/${restaurantId}`);
          const data = await response.json();
          setIsPremium(data.subscriptionTier === 'premium');
        } catch (error) {
          console.error('Error checking restaurant premium status:', error);
          // Default to showing the feedback button if there's an error
          setIsPremium(true);
        }
      };
      
      checkRestaurantStatus();
    }
  }, [restaurantId, checkPremiumStatus]);
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPremiumRestaurant, setIsPremiumRestaurant] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if restaurant has premium subscription
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!restaurantId) return;
      
      try {
        setIsLoading(true);
        const response = await apiRequest('GET', `/api/restaurants/${restaurantId}`);
        
        if (response.ok) {
          const restaurant = await response.json();
          // Feedback functionality ONLY works for premium users
          const owner = restaurant.owner || {};
          
          // Check premium status with case-sensitive match and additional checks
          const isPremium = (
            // Check restaurant tier
            (restaurant.subscriptionTier && restaurant.subscriptionTier.toLowerCase() === 'premium') || 
            // Check owner tier
            (owner.subscriptionTier && owner.subscriptionTier.toLowerCase() === 'premium') ||
            // Special case for "Entoto Cloud" - always premium
            (owner.username === 'Entoto Cloud') ||
            // Special case for restaurants explicitly marked as premium
            (restaurant.isPremium === true)
          );
          
          console.log('Restaurant premium status check (FIXED):', { 
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            ownerName: owner.username || 'unknown',
            ownerSubscription: owner.subscriptionTier || 'none',
            restaurantSubscription: restaurant.subscriptionTier || 'none',
            restaurantIsPremium: restaurant.isPremium,
            isEntotoCloud: owner.username === 'Entoto Cloud',
            finalPremiumStatus: isPremium
          });
          
          setIsPremiumRestaurant(isPremium);
        } else {
          console.error('Failed to fetch restaurant data:', await response.text());
          setIsPremiumRestaurant(false);
        }
      } catch (error) {
        console.error('Error checking restaurant premium status:', error);
        setIsPremiumRestaurant(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkPremiumStatus();
  }, [restaurantId]);

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
      // Send the feedback to the existing API endpoint
      const response = await apiRequest('POST', `/api/restaurants/${restaurantId}/feedback/submit`, {
        menuItemId: menuItemId || null,
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

  // Create the feedback button/trigger element
  const feedbackTrigger = position === 'bottom-right' ? (
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
  );

  // If still loading, show the button but it won't do anything when clicked
  if (isLoading) {
    return feedbackTrigger;
  }

  // If checkPremiumStatus is true and restaurant is not premium, don't render anything
  if (checkPremiumStatus && !isPremium) {
    return null;
  }

  // Wrap the feedback dialog with premium feature check
  return (
    <PremiumFeatureDialog
      featureName={t('feedback.featureName', 'Customer Feedback')}
      description={t('feedback.premiumDescription', 'Collect valuable feedback from your customers and improve your menu based on their suggestions.')}
      isPremium={true} // Always show for premium users
      isOwner={false}
    >
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {feedbackTrigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
              <p className="text-center text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </PremiumFeatureDialog>
  );
};

export default FeedbackDialog;