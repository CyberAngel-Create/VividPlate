import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, Calendar, Clock, Image, AlertTriangle } from "lucide-react";

interface SubscriptionStatus {
  tier: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  daysRemaining?: number;
  limits: {
    maxRestaurants: number;
    maxMenuItemImages: number;
    hasAds: boolean;
  };
  currentRestaurants: number;
  currentMenuItemImages: number;
  notificationSent: boolean;
}

export default function SubscriptionStatus() {
  const { data: subscriptionStatus, isLoading, error } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/user/subscription-status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/subscription-status");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Loading subscription status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !subscriptionStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load subscription status
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isPremium = subscriptionStatus.tier === "premium";
  const isExpiringSoon = subscriptionStatus.daysRemaining !== null && subscriptionStatus.daysRemaining <= 10;
  const imageUsagePercentage = subscriptionStatus.limits.maxMenuItemImages === -1 
    ? 0 
    : (subscriptionStatus.currentMenuItemImages / subscriptionStatus.limits.maxMenuItemImages) * 100;

  const getDurationLabel = (duration?: string) => {
    switch (duration) {
      case "1_month": return "1 Month";
      case "3_months": return "3 Months";
      case "1_year": return "1 Year";
      default: return "N/A";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Main Subscription Card */}
      <Card className={isExpiringSoon ? "border-yellow-300 bg-yellow-50" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className={`h-5 w-5 ${isPremium ? "text-yellow-500" : "text-gray-400"}`} />
              <CardTitle className="text-lg">
                Subscription Status
              </CardTitle>
            </div>
            <Badge variant={isPremium ? "default" : "secondary"} className="text-sm">
              {subscriptionStatus.tier.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPremium && subscriptionStatus.endDate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Duration: {getDurationLabel(subscriptionStatus.duration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {subscriptionStatus.daysRemaining !== null && subscriptionStatus.daysRemaining > 0
                      ? `${subscriptionStatus.daysRemaining} days remaining`
                      : "Expired"
                    }
                  </span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Started: {formatDate(subscriptionStatus.startDate)}</div>
                <div>Expires: {formatDate(subscriptionStatus.endDate)}</div>
              </div>

              {isExpiringSoon && (
                <Alert variant="destructive" className="bg-yellow-50 border-yellow-300">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Your premium subscription expires in {subscriptionStatus.daysRemaining} days. 
                    Contact support to renew your subscription.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Usage Limits */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Usage & Limits</h4>
            
            {/* Restaurant Limit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Restaurants</span>
                <span>
                  {subscriptionStatus.currentRestaurants} / {subscriptionStatus.limits.maxRestaurants}
                </span>
              </div>
              <Progress 
                value={(subscriptionStatus.currentRestaurants / subscriptionStatus.limits.maxRestaurants) * 100} 
                className="h-2"
              />
            </div>

            {/* Image Upload Limit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  <span>Menu Item Images</span>
                </div>
                <span>
                  {subscriptionStatus.currentMenuItemImages} / {
                    subscriptionStatus.limits.maxMenuItemImages === -1 
                      ? "Unlimited" 
                      : subscriptionStatus.limits.maxMenuItemImages
                  }
                </span>
              </div>
              {subscriptionStatus.limits.maxMenuItemImages !== -1 && (
                <Progress 
                  value={imageUsagePercentage} 
                  className={`h-2 ${imageUsagePercentage > 80 ? "text-red-500" : ""}`}
                />
              )}
              {imageUsagePercentage > 80 && subscriptionStatus.limits.maxMenuItemImages !== -1 && (
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800 text-xs">
                    You're approaching the image upload limit. Upgrade to premium for unlimited uploads.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Ads Status */}
            <div className="flex items-center justify-between text-sm">
              <span>Advertisements</span>
              <Badge variant={subscriptionStatus.limits.hasAds ? "destructive" : "default"}>
                {subscriptionStatus.limits.hasAds ? "Shown" : "Hidden"}
              </Badge>
            </div>
          </div>

          {!isPremium && (
            <div className="pt-3 border-t">
              <CardDescription className="text-center">
                Upgrade to Premium for unlimited restaurants, unlimited image uploads, and ad-free experience.
              </CardDescription>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}