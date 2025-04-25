import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import StatCard from "@/components/dashboard/StatCard";
import RestaurantInfoCard from "@/components/dashboard/RestaurantInfoCard";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentUpdates from "@/components/dashboard/RecentUpdates";
import TabNavigation from "@/components/layout/TabNavigation";
import { Eye, QrCode, Utensils, Calendar, CreditCard, Check, AlertCircle } from "lucide-react";
import { Restaurant } from "@shared/schema";
import { useRestaurant } from "@/hooks/use-restaurant";
import AdBanner from "@/components/ads/AdBanner";

interface Stats {
  viewCount: number;
  qrScanCount: number;
  menuItemCount: number;
  daysActive: number;
}

// Default stats when data is not available
const defaultStats: Stats = {
  viewCount: 0,
  qrScanCount: 0,
  menuItemCount: 0,
  daysActive: 0
};

interface Update {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
}

// Interface for subscription status
interface SubscriptionStatus {
  tier: string;
  isPaid: boolean;
  maxRestaurants: number;
  currentRestaurants: number;
  expiresAt: string | null;
}

const Dashboard = () => {
  const { toast } = useToast();
  // Get restaurant data
  const { activeRestaurant, restaurants, isLoading: isLoadingRestaurants, refetchActiveRestaurant } = useRestaurant();
  
  // Generate some recent updates based on activities
  const [updates, setUpdates] = useState<Update[]>([]);
  
  // Stats query
  const { data: stats, isLoading: isLoadingStats } = useQuery<Stats>({
    queryKey: [activeRestaurant ? `/api/restaurants/${activeRestaurant.id}/stats` : null],
    enabled: !!activeRestaurant,
  });
  
  // Subscription status query
  const { data: subscriptionStatus, isLoading: isLoadingSubscription } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/user/subscription-status'],
  });
  
  // Effect for setting updates
  useEffect(() => {
    if (activeRestaurant) {
      // This would ideally come from an API, but for now we'll generate some dummy updates
      setUpdates([
        {
          id: "1",
          title: "Added New Item: Truffle Pasta",
          description: "Added to Main Courses category",
          timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
        },
        {
          id: "2",
          title: "Updated Restaurant Hours",
          description: "Changed Friday closing time to 11:00 PM",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
        },
        {
          id: "3",
          title: "Menu Link Shared",
          description: "Shared menu link via email to 5 recipients",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
        }
      ]);
    }
  }, [activeRestaurant]);

  // Effect for auto-select restaurant
  useEffect(() => {
    if (restaurants && restaurants.length > 0 && !activeRestaurant) {
      refetchActiveRestaurant();
    }
  }, [restaurants, activeRestaurant, refetchActiveRestaurant]);

  if (isLoadingRestaurants) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-heading font-bold mb-6">Restaurant Dashboard</h1>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeRestaurant) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-heading font-bold mb-6">Restaurant Dashboard</h1>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-lg mb-4">You haven't created a restaurant yet.</p>
            <p className="mb-6">Create your first restaurant to get started with MenuMate.</p>
            <button 
              onClick={() => window.location.href = "/edit-restaurant"}
              className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
            >
              Create Restaurant
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TabNavigation />
      
      {/* Top ad banner for free users */}
      <div className="w-full flex justify-center">
        <AdBanner position="top" className="w-full max-w-screen-lg my-3" />
      </div>
      
      <section className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-heading font-bold mb-6">Restaurant Dashboard</h1>
        
        {/* Subscription Status Card */}
        {!isLoadingSubscription && subscriptionStatus && (
          <div className={`mb-6 p-4 rounded-lg border ${subscriptionStatus.isPaid ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${subscriptionStatus.isPaid ? 'bg-green-100' : 'bg-amber-100'}`}>
                {subscriptionStatus.isPaid ? (
                  <CreditCard className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {subscriptionStatus.isPaid ? 'Premium Subscription' : 'Free Plan'}
                </h3>
                <p className="text-sm text-gray-600">
                  {subscriptionStatus.isPaid ? (
                    <>You can create up to {subscriptionStatus.maxRestaurants} restaurants with no ads.</>
                  ) : (
                    <>You can create {subscriptionStatus.maxRestaurants} restaurant with the free plan. Upgrade to create more.</>
                  )}
                </p>
                <div className="mt-1 flex items-center gap-1 text-sm">
                  <span>Restaurants: {subscriptionStatus.currentRestaurants}/{subscriptionStatus.maxRestaurants}</span>
                  {subscriptionStatus.currentRestaurants >= subscriptionStatus.maxRestaurants && (
                    <span className="text-red-500 font-medium">Limit reached</span>
                  )}
                </div>
              </div>
              {!subscriptionStatus.isPaid && (
                <button 
                  onClick={() => window.location.href = "/subscription"}
                  className="ml-auto bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90"
                >
                  Upgrade Now
                </button>
              )}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={<Eye className="h-6 w-6" />} 
            value={isLoadingStats ? "..." : (stats?.viewCount ?? defaultStats.viewCount)} 
            label="Menu Views" 
          />
          <StatCard 
            icon={<QrCode className="h-6 w-6" />} 
            value={isLoadingStats ? "..." : (stats?.qrScanCount ?? defaultStats.qrScanCount)} 
            label="QR Scans" 
          />
          <StatCard 
            icon={<Utensils className="h-6 w-6" />} 
            value={isLoadingStats ? "..." : (stats?.menuItemCount ?? defaultStats.menuItemCount)} 
            label="Menu Items" 
          />
          <StatCard 
            icon={<Calendar className="h-6 w-6" />} 
            value={isLoadingStats ? "..." : (stats?.daysActive ?? defaultStats.daysActive)} 
            label="Days Active" 
          />
        </div>
        
        <RestaurantInfoCard restaurant={activeRestaurant} />
        
        <QuickActions />
        
        <RecentUpdates updates={updates} />
        
        {/* Bottom ad banner for free users */}
        <div className="w-full flex justify-center mt-6">
          <AdBanner position="bottom" className="w-full max-w-screen-lg my-3" />
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
