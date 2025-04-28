import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';
import { Star } from 'lucide-react';

interface FeedbackFormProps {
  restaurantId: number;
  menuItemId?: number;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ restaurantId, menuItemId }) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { toast } = useToast();
  const { t } = useTranslation();
  
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
      // Prepare form data
      const formData = {
        rating,
        comment: comment.trim() || null,
        customerName: name.trim() || null,
        customerEmail: email.trim() || null,
      };
      
      // Add menuItemId if provided
      if (menuItemId) {
        Object.assign(formData, { menuItemId });
      }
      
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
      setRating(0);
      setComment('');
      setName('');
      setEmail('');
      setIsSubmitted(true);
      
      toast({
        title: 'Success',
        description: t('feedback.thankYou'),
      });
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
  
  // If feedback was successfully submitted, show thank you message
  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-xl font-medium mb-2">{t('feedback.thankYou')}</h3>
          <p className="text-muted-foreground">Your feedback helps improve the dining experience for everyone.</p>
          <Button 
            className="mt-4" 
            variant="outline"
            onClick={() => setIsSubmitted(false)}
          >
            Submit Another Feedback
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('restaurant.leaveFeedback')}</CardTitle>
        <CardDescription>Share your dining experience with us and other customers</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="rating">{t('feedback.yourRating')}</Label>
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
            <Label htmlFor="comment">{t('feedback.yourComment')}</Label>
            <Textarea
              id="comment"
              placeholder="Tell us what you liked or didn't like"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('feedback.name')}</Label>
              <Input
                id="name"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('feedback.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="Your email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="mr-2">Submitting...</span>
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
              </>
            ) : (
              t('feedback.submit')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FeedbackForm;