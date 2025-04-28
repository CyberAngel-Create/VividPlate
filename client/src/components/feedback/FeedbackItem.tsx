import React from 'react';
import { Feedback } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FeedbackItemProps {
  feedback: Feedback;
  restaurantId: number;
  showControls?: boolean;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({ 
  feedback,
  restaurantId,
  showControls = true
}) => {
  const { toast } = useToast();

  const approveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/feedback/${feedback.id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/feedback`] });
      toast({
        title: 'Feedback approved',
        description: 'The feedback has been approved and is now public',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to approve feedback',
        variant: 'destructive',
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/feedback/${feedback.id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/feedback`] });
      toast({
        title: 'Feedback rejected',
        description: 'The feedback has been rejected and will not be displayed',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to reject feedback',
        variant: 'destructive',
      });
    }
  });

  const getStatusColor = (status: string) => {
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
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            {renderStars(feedback.rating)}
            <span className="ml-2 text-sm text-gray-600">
              {feedback.rating}/5
            </span>
          </div>
          <Badge className={getStatusColor(feedback.status || 'pending')}>
            {feedback.status || 'pending'}
          </Badge>
        </div>
        
        {feedback.comment && (
          <div className="flex items-start mt-3">
            <MessageSquare className="h-4 w-4 mr-2 mt-1 text-gray-500" />
            <p className="text-sm text-gray-700">{feedback.comment || ''}</p>
          </div>
        )}
        
        <div className="mt-3 text-xs text-gray-500">
          <span>
            {feedback.customerName
              ? `From: ${feedback.customerName}`
              : 'Anonymous feedback'}
          </span>
          <span className="ml-4">
            {feedback.createdAt 
              ? new Date(feedback.createdAt.toString()).toLocaleDateString() 
              : ''}
          </span>
        </div>
        
        {showControls && feedback.status === 'pending' && (
          <div className="flex justify-end mt-3 space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackItem;