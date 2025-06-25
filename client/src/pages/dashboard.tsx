import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import StatCard from "@/components/dashboard/StatCard";
import RestaurantInfoCard from "@/components/dashboard/RestaurantInfoCard";
import QuickActions from "@/components/dashboard/QuickActions";
import FeedbackSummary from "@/components/dashboard/FeedbackSummary";
import GlobalMenuSearch from "@/components/ui/global-menu-search";
import RestaurantOwnerLayout from "@/components/layout/RestaurantOwnerLayout";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { Eye, QrCode, Utensils, Calendar, CreditCard, AlertCircle } from "lucide-react";
import { useRestaurant } from "@/hooks/use-restaurant";
import { useMenu } from "@/hooks/use-menu";
import AdBanner from "@/components/ads/AdBanner";
import { useLocation } from "wouter";

interface Stats {
  viewCount: number;
  qrScanCount: number;
  directQrScans: number;
  menuItemCount: number;
  daysActive: number;
}

// Default stats when data is not available
const defaultStats: Stats = {
  viewCount: 0,
  qrScanCount: 0,
  directQrScans: 0,
  menuItemCount: 0,
  daysActive: 0
};

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
  const [, setLocation] = useLocation();
  
  // Get restaurant data
  const { 
    activeRestaurant, 
    restaurants, 
    isLoading: isLoadingRestaurants, 
    refetchActiveRestaurant 
  } = useRestaurant();
  
  // Get menu data using our hook
  const { categories, menuItems, isLoading: isLoadingMenu } = useMenu();
  
  // Stats query
  const { data: stats, isLoading: isLoadingStats } = useQuery<Stats>({
    queryKey: [activeRestaurant ? `/api/restaurants/${activeRestaurant.id}/stats` : null],
    enabled: !!activeRestaurant,
  });
  
  // Subscription status query
  const { data: subscriptionStatus, isLoading: isLoadingSubscription } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/user/subscription-status'],
  });

  // Effect for auto-select restaurant
  useEffect(() => {
    if (restaurants && restaurants.length > 0 && !activeRestaurant) {
      refetchActiveRestaurant();
    }
  }, [restaurants, activeRestaurant, refetchActiveRestaurant]);

  // Loading and empty state handlers
  if (isLoadingRestaurants) {
    return (
      <RestaurantOwnerLayout>
        <h1 className="text-2xl font-heading font-bold mb-6">Restaurant Dashboard</h1>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </RestaurantOwnerLayout>
    );
  }

  if (!activeRestaurant) {
    return (
      <RestaurantOwnerLayout>
        <h1 className="text-2xl font-heading font-bold mb-6">Restaurant Dashboard</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <p className="text-lg mb-4">You haven't created a restaurant yet.</p>
          <p className="mb-6">Create your first restaurant to get started with VividPlate.</p>
          <button 
            onClick={() => window.location.href = "/edit-restaurant"}
            className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
          >
            Create Restaurant
          </button>
        </div>
      </RestaurantOwnerLayout>
    );
  }

  // Main dashboard render
  return (
    <RestaurantOwnerLayout>
      <div className="px-4 py-6">
        {/* Top ad banner for free users - only show for non-premium users */}
        {(!subscriptionStatus?.isPaid) && (
          <div className="w-full flex justify-center mb-6">
            <AdBanner position="top" className="w-full max-w-screen-lg" />
          </div>
        )}
        
        <h1 className="text-2xl font-heading font-bold mb-6">Restaurant Dashboard</h1>
      
        {/* Subscription Status Card */}
        {!isLoadingSubscription && subscriptionStatus && (
          <div className={`mb-6 p-4 rounded-lg border ${
            subscriptionStatus.isPaid 
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900' 
              : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className={`p-2 rounded-full ${
                subscriptionStatus.isPaid 
                  ? 'bg-green-100 dark:bg-green-800' 
                  : 'bg-amber-100 dark:bg-amber-800'
              }`}>
                {subscriptionStatus.isPaid ? (
                  <CreditCard className="h-5 w-5 text-green-600 dark:text-green-300" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  {subscriptionStatus.isPaid ? (
                    <PremiumBadge size="sm" />
                  ) : (
                    <h3 className="font-semibold text-lg">Free Plan</h3>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {subscriptionStatus.isPaid ? (
                    <>You can create up to {subscriptionStatus.maxRestaurants} restaurants with no ads.</>
                  ) : (
                    <>You can create {subscriptionStatus.maxRestaurants} restaurant with the free plan. Upgrade to create more.</>
                  )}
                </p>
                <div className="mt-1 flex items-center gap-1 text-sm">
                  <span>Restaurants: {subscriptionStatus.currentRestaurants}/{subscriptionStatus.maxRestaurants}</span>
                  {subscriptionStatus.currentRestaurants >= subscriptionStatus.maxRestaurants && (
                    <span className="text-red-500 dark:text-red-400 font-medium">Limit reached</span>
                  )}
                </div>
              </div>
              <div className="mt-2 sm:mt-0 sm:ml-auto flex flex-col sm:flex-row gap-2">
                {subscriptionStatus.isPaid && subscriptionStatus.currentRestaurants < subscriptionStatus.maxRestaurants && (
                  <button 
                    onClick={() => window.location.href = "/edit-restaurant"}
                    className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90"
                  >
                    Create New Restaurant
                  </button>
                )}
                {!subscriptionStatus.isPaid && (
                  <button 
                    onClick={() => window.location.href = "/subscribe"}
                    className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90"
                  >
                    Upgrade Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={<Eye className="h-6 w-6" />} 
            value={isLoadingStats ? "..." : (stats?.viewCount ?? defaultStats.viewCount)} 
            label="Menu Views" 
          />
          <StatCard 
            icon={<QrCode className="h-6 w-6" />} 
            value={isLoadingStats ? "..." : (stats?.directQrScans ?? defaultStats.directQrScans)} 
            label="QR Code Scans" 
            tooltip="Number of times your QR code has been scanned"
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
        
        {/* Restaurant Info */}
        <RestaurantInfoCard restaurant={activeRestaurant} />
        
        {/* Quick Actions */}
        <QuickActions />
        
        {/* Menu Search - Only show if there are menu items */}
        {!isLoadingMenu && menuItems && menuItems.length > 0 && categories && categories.length > 0 && (
          <GlobalMenuSearch 
            categories={categories} 
            menuItems={menuItems}
            onEditItem={(id) => {
              // Find the menu item to get its category ID
              const menuItem = menuItems.find(item => item.id === id);
              if (menuItem) {
                setLocation(`/create-menu?category=${menuItem.categoryId}&item=${id}`);
              }
            }}
            onDeleteItem={(id) => {
              // We'll navigate to the create-menu page where the user can delete the item
              // This avoids having to implement deletion logic here too
              const menuItem = menuItems.find(item => item.id === id);
              if (menuItem) {
                setLocation(`/create-menu?category=${menuItem.categoryId}`);
              }
            }}
          />
        )}
        
        {/* Feedback Summary */}
        <FeedbackSummary />
        
        {/* Bottom ad banner for free users */}
        <div className="w-full flex justify-center mt-6">
          <AdBanner position="bottom" className="w-full max-w-screen-lg my-3" />
        </div>
      </div>
    </RestaurantOwnerLayout>
  );
};

export default Dashboard;
