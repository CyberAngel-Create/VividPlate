import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Feedback } from '@shared/schema';
import FeedbackItem from './FeedbackItem';
import { MessageSquare } from 'lucide-react';

interface RestaurantFeedbackProps {
  restaurantId: number;
  isOwner?: boolean;
}

const RestaurantFeedback: React.FC<RestaurantFeedbackProps> = ({ 
  restaurantId,
  isOwner = false 
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Fetch feedback data
  const { data, isLoading, error } = useQuery<Feedback[]>({
    queryKey: [`/api/restaurants/${restaurantId}/feedback`],
    enabled: !!restaurantId,
  });
  
  // Filter feedback based on active tab
  const filteredFeedback = data ? data.filter(feedback => {
    if (activeTab === 'all') return true;
    return feedback.status === activeTab;
  }) : [];
  
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
          
          <TabsContent value={activeTab} className="mt-0">
            <div className="space-y-4">
              {filteredFeedback.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No {activeTab} feedback found</p>
                </div>
              ) : (
                filteredFeedback.map((feedback) => (
                  <FeedbackItem 
                    key={feedback.id} 
                    feedback={feedback} 
                    isOwner={isOwner}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RestaurantFeedback;