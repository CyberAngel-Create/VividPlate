import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Feedback } from '@shared/schema';
import FeedbackItem from './FeedbackItem';
import { MessageSquare, Search, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RestaurantFeedbackProps {
  restaurantId: number;
  isOwner?: boolean;
}

const RestaurantFeedback: React.FC<RestaurantFeedbackProps> = ({ 
  restaurantId,
  isOwner = false 
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [groupByRating, setGroupByRating] = useState<boolean>(true);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Fetch feedback data
  const { data, isLoading, error } = useQuery<Feedback[]>({
    queryKey: [`/api/restaurants/${restaurantId}/feedback`],
    enabled: !!restaurantId,
  });
  
  // Filter and group feedback
  const processedFeedback = useMemo(() => {
    if (!data) return { filtered: [], grouped: {} };
    
    // First apply status filter
    let result = data.filter(feedback => {
      if (activeTab === 'all') return true;
      return feedback.status === activeTab;
    });
    
    // Then apply rating filter
    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter);
      result = result.filter(f => f.rating === rating);
    }
    
    // Then apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(f => 
        (f.comment && f.comment.toLowerCase().includes(term)) ||
        (f.customerName && f.customerName.toLowerCase().includes(term)) ||
        (f.customerEmail && f.customerEmail.toLowerCase().includes(term))
      );
    }
    
    // Group by rating
    const grouped: Record<string, Feedback[]> = {};
    for (let i = 5; i >= 1; i--) {
      const ratingItems = result.filter(f => f.rating === i);
      if (ratingItems.length > 0) {
        grouped[i.toString()] = ratingItems;
      }
    }
    
    return {
      filtered: result,
      grouped
    };
  }, [data, activeTab, ratingFilter, searchTerm]);
  
  // Count feedback by status
  const counts = {
    all: data?.length || 0,
    pending: data?.filter(f => f.status === 'pending').length || 0,
    approved: data?.filter(f => f.status === 'approved').length || 0,
    rejected: data?.filter(f => f.status === 'rejected').length || 0,
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Failed to load feedback data</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('restaurant.feedback')}</CardTitle>
          <CardDescription>View and manage customer feedback</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
            <h3 className="text-lg font-medium mb-1">{t('restaurant.noFeedback')}</h3>
            <p className="text-muted-foreground text-sm">
              When customers leave feedback, it will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('restaurant.feedback')}</CardTitle>
        <CardDescription>View and manage customer feedback</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All
              <span className="ml-1.5 bg-muted text-muted-foreground text-xs py-0.5 px-1.5 rounded-full">
                {counts.all}
              </span>
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              <span className="ml-1.5 bg-yellow-100 text-yellow-800 text-xs py-0.5 px-1.5 rounded-full">
                {counts.pending}
              </span>
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              <span className="ml-1.5 bg-green-100 text-green-800 text-xs py-0.5 px-1.5 rounded-full">
                {counts.approved}
              </span>
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected
              <span className="ml-1.5 bg-red-100 text-red-800 text-xs py-0.5 px-1.5 rounded-full">
                {counts.rejected}
              </span>
            </TabsTrigger>
          </TabsList>
          
          {/* Filter and search controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Input
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    id="groupByRating"
                    checked={groupByRating}
                    onChange={() => setGroupByRating(!groupByRating)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="groupByRating" className="text-sm font-medium">
                    Group by rating
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <TabsContent value={activeTab} className="mt-0">
            {processedFeedback.filtered.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No matching feedback found</p>
              </div>
            ) : groupByRating ? (
              // Display feedback grouped by rating
              <div className="space-y-8">
                {Object.entries(processedFeedback.grouped).map(([rating, feedbacks]) => (
                  <div key={rating} className="space-y-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold">{rating} Star{parseInt(rating) !== 1 ? 's' : ''}</h3>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i}
                            className={`h-4 w-4 ${i < parseInt(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">({feedbacks.length})</span>
                    </div>
                    
                    <div className="space-y-4 pl-2 border-l-2 border-muted">
                      {feedbacks.map((feedback) => (
                        <FeedbackItem 
                          key={feedback.id} 
                          feedback={feedback} 
                          isOwner={isOwner}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Display feedback without grouping
              <div className="space-y-4">
                {processedFeedback.filtered.map((feedback) => (
                  <FeedbackItem 
                    key={feedback.id} 
                    feedback={feedback} 
                    isOwner={isOwner}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RestaurantFeedback;