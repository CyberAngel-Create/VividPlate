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
  const [groupingOption, setGroupingOption] = useState<'rating' | 'item' | 'category'>('rating');
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Fetch feedback data
  const { data, isLoading, error } = useQuery<Feedback[]>({
    queryKey: [`/api/restaurants/${restaurantId}/feedback`],
    enabled: !!restaurantId,
  });
  
  // Fetch menu items and categories for grouping
  const { data: menuItemsData } = useQuery({
    queryKey: [`/api/restaurants/${restaurantId}/menu-items`],
    enabled: !!restaurantId && groupingOption === 'item',
  });
  
  const { data: categoriesData } = useQuery({
    queryKey: [`/api/restaurants/${restaurantId}/menu-categories`],
    enabled: !!restaurantId && groupingOption === 'category',
  });
  
  // Filter and group feedback
  const processedFeedback = useMemo(() => {
    if (!data) return { filtered: [], grouped: {}, groupType: 'rating' };
    
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
    
    // Create grouped object based on selected grouping option
    const grouped: Record<string, Feedback[]> = {};
    
    if (groupingOption === 'rating') {
      // Group by rating
      for (let i = 5; i >= 1; i--) {
        const ratingItems = result.filter(f => f.rating === i);
        if (ratingItems.length > 0) {
          grouped[i.toString()] = ratingItems;
        }
      }
    } 
    else if (groupingOption === 'item' && menuItemsData) {
      // Group by menu item
      const itemMap = new Map(menuItemsData.map(item => [item.id, item]));
      
      // First create "No Item" group for feedback without menuItemId
      const noItemFeedback = result.filter(f => !f.menuItemId);
      if (noItemFeedback.length > 0) {
        grouped['no-item'] = noItemFeedback;
      }
      
      // Then group by menu item
      result.forEach(feedback => {
        if (feedback.menuItemId) {
          const itemId = feedback.menuItemId.toString();
          if (!grouped[itemId]) {
            grouped[itemId] = [];
          }
          grouped[itemId].push(feedback);
        }
      });
    }
    else if (groupingOption === 'category' && categoriesData && menuItemsData) {
      // Create a map of menuItemId to categoryId
      const itemCategoryMap = new Map();
      menuItemsData.forEach(item => {
        if (item.categoryId) {
          itemCategoryMap.set(item.id, item.categoryId);
        }
      });
      
      // Group feedback with no menuItemId
      const noItemFeedback = result.filter(f => !f.menuItemId);
      if (noItemFeedback.length > 0) {
        grouped['no-category'] = noItemFeedback;
      }
      
      // Group feedback by category using the map
      result.forEach(feedback => {
        if (feedback.menuItemId) {
          const categoryId = itemCategoryMap.get(feedback.menuItemId);
          if (categoryId) {
            const catId = categoryId.toString();
            if (!grouped[catId]) {
              grouped[catId] = [];
            }
            grouped[catId].push(feedback);
          } else {
            // Feedback for items without a category
            if (!grouped['uncategorized']) {
              grouped['uncategorized'] = [];
            }
            grouped['uncategorized'].push(feedback);
          }
        }
      });
    }
    
    return {
      filtered: result,
      grouped,
      groupType: groupingOption
    };
  }, [data, activeTab, ratingFilter, searchTerm, groupingOption, menuItemsData, categoriesData]);
  
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
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by rating">
                    {ratingFilter !== 'all' && (
                      <div className="flex items-center">
                        <span className="mr-2">{ratingFilter}</span>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${i < parseInt(ratingFilter) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">
                    <div className="flex items-center">
                      <span className="mr-2">5</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="4">
                    <div className="flex items-center">
                      <span className="mr-2">4</span>
                      <div className="flex">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        ))}
                        <Star className="h-3 w-3 text-gray-300" />
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="3">
                    <div className="flex items-center">
                      <span className="mr-2">3</span>
                      <div className="flex">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        ))}
                        {Array.from({ length: 2 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-gray-300" />
                        ))}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="2">
                    <div className="flex items-center">
                      <span className="mr-2">2</span>
                      <div className="flex">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        ))}
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-gray-300" />
                        ))}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="1">
                    <div className="flex items-center">
                      <span className="mr-2">1</span>
                      <div className="flex">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-gray-300" />
                        ))}
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={groupingOption} 
                onValueChange={(value) => setGroupingOption(value as 'rating' | 'item' | 'category')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Grouping option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Group by Rating</SelectItem>
                  <SelectItem value="item">Group by Menu Item</SelectItem>
                  <SelectItem value="category">Group by Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <TabsContent value={activeTab} className="mt-0">
            {processedFeedback.filtered.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No matching feedback found</p>
              </div>
            ) : (
              <div className="space-y-8">
                {processedFeedback.groupType === 'rating' && (
                  // Display feedback grouped by rating
                  <>
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
                  </>
                )}
                
                {processedFeedback.groupType === 'item' && (
                  // Display feedback grouped by menu item
                  <>
                    {Object.entries(processedFeedback.grouped).map(([itemId, feedbacks]) => {
                      // Get item name
                      let groupTitle = "General Feedback";
                      if (itemId !== 'no-item') {
                        const menuItem = menuItemsData?.find(item => item.id.toString() === itemId);
                        groupTitle = menuItem ? menuItem.name : `Item #${itemId}`;
                      }
                      
                      return (
                        <div key={itemId} className="space-y-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold">{groupTitle}</h3>
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
                      );
                    })}
                  </>
                )}
                
                {processedFeedback.groupType === 'category' && (
                  // Display feedback grouped by category
                  <>
                    {Object.entries(processedFeedback.grouped).map(([categoryId, feedbacks]) => {
                      // Get category name
                      let groupTitle = "Uncategorized";
                      if (categoryId === 'no-category') {
                        groupTitle = "General Feedback";
                      } else if (categoryId !== 'uncategorized') {
                        const category = categoriesData?.find(cat => cat.id.toString() === categoryId);
                        groupTitle = category ? category.name : `Category #${categoryId}`;
                      }
                      
                      return (
                        <div key={categoryId} className="space-y-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold">{groupTitle}</h3>
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
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RestaurantFeedback;