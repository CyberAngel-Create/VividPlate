import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Star, CalendarIcon, User, Utensils } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDate } from '@/lib/utils';
import { Feedback, MenuItem } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

interface FeedbackItemProps {
  feedback: Feedback;
  isOwner?: boolean;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({ feedback, isOwner = false }) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isApproving, setIsApproving] = React.useState(false);
  const [isRejecting, setIsRejecting] = React.useState(false);
  
  // Fetch menu item details if feedback is for a specific menu item
  const { data: menuItem, isLoading: isLoadingMenuItem } = useQuery<MenuItem>({
    queryKey: [feedback.menuItemId ? `/api/menu-items/${feedback.menuItemId}` : null],
    enabled: !!feedback.menuItemId,
  });
  
  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const response = await apiRequest(
        'POST',
        `/api/feedback/${feedback.id}/approve`,
        {}
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve feedback');
      }
      
      // Invalidate feedback queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${feedback.restaurantId}/feedback`] });
      
      toast({
        title: 'Success',
        description: 'Feedback approved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve feedback',
        variant: 'destructive',
      });
    } finally {
      setIsApproving(false);
    }
  };
  
  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const response = await apiRequest(
        'POST',
        `/api/feedback/${feedback.id}/reject`,
        {}
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject feedback');
      }
      
      // Invalidate feedback queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${feedback.restaurantId}/feedback`] });
      
      toast({
        title: 'Success',
        description: 'Feedback rejected successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject feedback',
        variant: 'destructive',
      });
    } finally {
      setIsRejecting(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex space-x-2 items-center mb-1.5">
              {/* Rating stars */}
              <div className="flex">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={18}
                    className={`${
                      index < feedback.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              
              {/* Status badge */}
              {feedback.status === 'approved' && (
                <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">
                  Approved
                </span>
              )}
              {feedback.status === 'rejected' && (
                <span className="bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded-full">
                  Rejected
                </span>
              )}
              {feedback.status === 'pending' && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full">
                  Pending
                </span>
              )}
            </div>
            
            {/* Customer name */}
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <User size={14} />
              <span>{feedback.customerName || 'Anonymous'}</span>
            </div>
          </div>
          
          {/* Date */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarIcon size={12} />
            <span>{feedback.createdAt ? formatDate(new Date(feedback.createdAt)) : 'Unknown date'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Comment */}
        <p className="text-sm">
          {feedback.comment || <em className="text-muted-foreground">No comment provided</em>}
        </p>
        
        {/* Menu item reference if available */}
        {feedback.menuItemId && (
          <div className="mt-2 text-sm border-t pt-2">
            {isLoadingMenuItem ? (
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : menuItem ? (
              <div className="flex items-center space-x-3">
                {menuItem.imageUrl ? (
                  <div className="h-12 w-12 relative rounded overflow-hidden border">
                    <img 
                      src={menuItem.imageUrl} 
                      alt={menuItem.name} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                    <Utensils size={18} className="text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{menuItem.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {menuItem.price && (
                      <span>{menuItem.currency || 'USD'} {menuItem.price}</span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                Feedback for menu item (ID: {feedback.menuItemId})
              </span>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Action buttons for restaurant owners */}
      {isOwner && feedback.status === 'pending' && (
        <CardFooter className="pt-0 flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-red-600"
            onClick={handleReject}
            disabled={isRejecting || isApproving}
          >
            {isRejecting ? (
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
            ) : (
              <X size={16} className="mr-1" />
            )}
            {t('admin.rejectFeedback')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-green-600"
            onClick={handleApprove}
            disabled={isRejecting || isApproving}
          >
            {isApproving ? (
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
            ) : (
              <Check size={16} className="mr-1" />
            )}
            {t('admin.approveFeedback')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default FeedbackItem;