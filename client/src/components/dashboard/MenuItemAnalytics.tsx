import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Eye, BarChart3, MousePointer } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface MenuItemAnalytics {
  itemId: number;
  itemName: string;
  clickCount: number;
}

interface MenuItemAnalyticsProps {
  restaurantId: number;
}

export function MenuItemAnalytics({ restaurantId }: MenuItemAnalyticsProps) {
  const { data: analytics, isLoading, error } = useQuery<MenuItemAnalytics[]>({
    queryKey: ['/api/restaurants', restaurantId, 'menu-analytics'],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${restaurantId}/menu-analytics`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch menu analytics');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading menu analytics...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-red-500">
            Failed to load menu analytics. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalClicks = analytics?.reduce((sum, item) => sum + item.clickCount, 0) || 0;
  const topItems = analytics?.slice(0, 5) || [];
  const mostPopular = analytics?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        <h3 className="text-xl font-semibold">Menu Item Analytics</h3>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-blue-500" />
              <div className="text-sm font-medium text-muted-foreground">Total Clicks</div>
            </div>
            <div className="text-2xl font-bold mt-2">{totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-500" />
              <div className="text-sm font-medium text-muted-foreground">Items Tracked</div>
            </div>
            <div className="text-2xl font-bold mt-2">{analytics?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div className="text-sm font-medium text-muted-foreground">Most Popular</div>
            </div>
            <div className="text-lg font-bold mt-2 truncate">
              {mostPopular ? mostPopular.itemName : 'No data yet'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Menu Items
          </CardTitle>
          <CardDescription>
            See which menu items customers are most interested in viewing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MousePointer className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No clicks recorded yet</p>
              <p className="text-sm">Analytics will appear as customers view your menu items</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topItems.map((item, index) => {
                const percentage = totalClicks > 0 ? (item.clickCount / totalClicks) * 100 : 0;
                
                return (
                  <div key={item.itemId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{item.itemName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.clickCount} {item.clickCount === 1 ? 'click' : 'clicks'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? 'default' : 'secondary'}>
                          {percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          index === 0 ? 'bg-primary' : 
                          index === 1 ? 'bg-blue-500' :
                          index === 2 ? 'bg-green-500' :
                          'bg-muted-foreground/50'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    
                    {index < topItems.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Items Table */}
      {analytics && analytics.length > 5 && (
        <Card>
          <CardHeader>
            <CardTitle>All Menu Items Performance</CardTitle>
            <CardDescription>
              Complete view of all menu item interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {analytics.map((item, index) => (
                  <div key={item.itemId} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <span className="font-medium">{item.itemName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {item.clickCount} {item.clickCount === 1 ? 'click' : 'clicks'}
                      </span>
                      <Badge variant="outline" className="min-w-[60px] justify-center">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <Eye className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Analytics Insights</h4>
              <p className="text-sm text-blue-700 mt-1">
                Track which menu items customers view most to optimize your menu layout and highlight popular dishes. 
                Items with more clicks indicate higher customer interest.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}