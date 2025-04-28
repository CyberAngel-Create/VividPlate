import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, Frown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { Feedback } from '@shared/schema';

interface RestaurantFeedbackProps {
  restaurantId: number;
}

const RestaurantFeedback: React.FC<RestaurantFeedbackProps> = ({ restaurantId }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const response = await apiRequest(
          'GET',
          `/api/restaurants/${restaurantId}/feedback`
        );
        const data: Feedback[] = await response.json();
        setFeedbacks(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load customer feedback',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [restaurantId, toast]);

  const getFeedbackStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
          }`}
        />
      ));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('restaurant.feedback')}</CardTitle>
        <CardDescription>
          View feedback from your customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Frown className="h-12 w-12 mb-2" />
            <p>{t('restaurant.noFeedback')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    {renderStars(feedback.rating)}
                    <span className="ml-2 text-sm text-gray-600">
                      {feedback.rating}/5
                    </span>
                  </div>
                  <Badge className={getFeedbackStatusColor(feedback.status || 'pending')}>
                    {feedback.status || 'pending'}
                  </Badge>
                </div>
                {feedback.comment && (
                  <div className="flex items-start mt-2">
                    <MessageSquare className="h-4 w-4 mr-2 mt-1 text-gray-500" />
                    <p className="text-sm text-gray-700">{feedback.comment || ''}</p>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  <span>
                    {feedback.customerName
                      ? `From: ${feedback.customerName}`
                      : 'Anonymous feedback'}
                  </span>
                  <span className="ml-4">
                    {feedback.createdAt ? new Date(feedback.createdAt.toString()).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RestaurantFeedback;