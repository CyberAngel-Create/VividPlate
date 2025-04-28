import { useQuery } from '@tanstack/react-query';
import { Feedback } from '@shared/schema';
import { useRestaurant } from '@/hooks/use-restaurant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Star, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

const FeedbackSummary = () => {
  const { activeRestaurant } = useRestaurant();
  const [, setLocation] = useLocation();
  
  const { data: feedbacks, isLoading } = useQuery<Feedback[]>({
    queryKey: [activeRestaurant ? `/api/restaurants/${activeRestaurant.id}/feedbacks` : null],
    enabled: !!activeRestaurant,
  });
  
  // Helper function to calculate average rating
  const calculateAverageRating = (feedbacks: Feedback[] = []) => {
    if (feedbacks.length === 0) return 0;
    const sum = feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0);
    return (sum / feedbacks.length).toFixed(1);
  };
  
  // Get only approved feedbacks
  const approvedFeedbacks = feedbacks?.filter(feedback => feedback.status === 'approved') || [];
  
  // Get most recent 3 feedbacks
  const recentFeedbacks = [...(approvedFeedbacks || [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };
  
  const handleViewAllFeedback = () => {
    if (activeRestaurant) {
      setLocation(`/edit-restaurant`);
    }
  };
  
  return (
    <Card className="mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <MessageSquare className="mr-2 h-5 w-5 text-primary" />
          Customer Feedback
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !approvedFeedbacks.length ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No customer feedback yet</p>
            <p className="text-sm text-gray-400 mt-1">Feedback will appear here once customers submit reviews</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4 p-3 bg-neutral rounded-md">
              <div>
                <span className="block text-sm text-gray-500">Average Rating</span>
                <div className="flex items-center">
                  <span className="text-2xl font-bold mr-2">{calculateAverageRating(approvedFeedbacks)}</span>
                  {renderStars(Math.round(parseFloat(calculateAverageRating(approvedFeedbacks))))}
                </div>
              </div>
              <div className="text-right">
                <span className="block text-sm text-gray-500">Total Reviews</span>
                <span className="text-xl font-semibold">{approvedFeedbacks.length}</span>
              </div>
            </div>
            
            <h3 className="font-medium text-sm mb-2 text-gray-500">Recent Feedback</h3>
            <div className="space-y-3">
              {recentFeedbacks.map((feedback) => (
                <div key={feedback.id} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium">
                      {feedback.customerName || 'Anonymous'}
                    </div>
                    {renderStars(feedback.rating)}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{feedback.comment}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <Button 
                variant="outline"
                className="text-primary border-primary hover:bg-primary/5"
                onClick={handleViewAllFeedback}
              >
                View All Feedback
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackSummary;