import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import StatCard from "@/components/dashboard/StatCard";
import RestaurantInfoCard from "@/components/dashboard/RestaurantInfoCard";
import QuickActions from "@/components/dashboard/QuickActions";
import FeedbackSummary from "@/components/dashboard/FeedbackSummary";
import GlobalMenuSearch from "@/components/ui/global-menu-search";
import RestaurantOwnerLayout from "@/components/layout/RestaurantOwnerLayout";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { Eye, QrCode, Utensils, Calendar, CreditCard, AlertCircle, Lock, Zap, Star } from "lucide-react";
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
  hasAgentPremiumRestaurant?: boolean;
  agentId?: number | null;
  agentName?: string | null;
}

const Dashboard = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAgent = (user as any)?.role === 'agent';
  const isOwner = !isAgent;
  
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

  // LS live subscription details (only for paid users)
  const { data: lsStatus } = useQuery<{ status: string; subscription: { tier: string; expiry: string | null; lsSubscriptionId: string | null; lsStatus: string | null; renewsAt: string | null } }>({
    queryKey: ['/api/ls/subscription-status'],
    enabled: !!subscriptionStatus?.isPaid,
    staleTime: 60_000,
  });

  const agentAssigned = Boolean(subscriptionStatus?.agentId);
  const canRequestAgentSupport = agentAssigned && (subscriptionStatus?.currentRestaurants ?? 0) === 0;

  // Effect for auto-select restaurant - only run when restaurants length changes
  useEffect(() => {
    if (restaurants && restaurants.length > 0 && !activeRestaurant) {
      refetchActiveRestaurant();
    }
  }, [restaurants?.length]);

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
    // For agent-premium users without a restaurant, they need to contact their agent
    const hasAgentPremium = subscriptionStatus?.hasAgentPremiumRestaurant;
    
    return (
      <RestaurantOwnerLayout>
        <h1 className="text-2xl font-heading font-bold mb-6">Restaurant Dashboard</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          {hasAgentPremium ? (
            <>
              <p className="text-lg mb-4">You haven't created a restaurant yet.</p>
              <p className="mb-6">Your restaurant was set up by an agent. Please contact your agent if you need assistance.</p>
            </>
          ) : (
            <>
              <p className="text-lg mb-4">You haven't created a restaurant yet.</p>
              <p className="mb-6">Create your first restaurant to get started with VividPlate.</p>
              <button 
                onClick={() => setLocation("/edit-restaurant")}
                className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
              >
                Create Restaurant
              </button>
            </>
          )}
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
      
        {/* Subscription Status Card — only for restaurant owners, not agents */}
        {!isLoadingSubscription && subscriptionStatus && isOwner && (() => {
          // Case A: Agent created a premium restaurant for this owner
          if (subscriptionStatus.hasAgentPremiumRestaurant) {
            return (
              <div className="mb-6 p-4 rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-800">
                    <Star className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-200">🏆 Agent Premium Active</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Your restaurant was set up and is managed by{" "}
                      <span className="font-medium">{subscriptionStatus.agentName || 'your agent'}</span>.
                      No subscription payment is needed from you.
                    </p>
                  </div>
                  <button
                    onClick={() => setLocation("/request-restaurant")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Contact Agent
                  </button>
                </div>
              </div>
            );
          }

          // Case B: Owner has an active self-paid premium subscription
          if (subscriptionStatus.isPaid) {
            const lsSub = lsStatus?.subscription;
            const renewalDate = lsSub?.renewsAt || lsSub?.expiry || subscriptionStatus.expiresAt;
            const lsLiveStatus = lsSub?.lsStatus;
            const isCancelled = lsLiveStatus === 'cancelled';
            const isExpiringSoon = renewalDate && new Date(renewalDate).getTime() - Date.now() < 7 * 86400000;
            return (
              <div className="mb-6 p-4 rounded-lg border bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-800">
                    <CreditCard className="h-5 w-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <PremiumBadge size="sm" />
                      {isCancelled && (
                        <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-700 px-2 py-0.5 rounded-full font-medium">
                          Cancelled — active until expiry
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {isCancelled
                        ? 'Your subscription has been cancelled but remains active until the end of the billing period.'
                        : 'Your premium subscription is active.'}
                    </p>
                    {renewalDate && (
                      <div className="mt-1 flex items-center gap-2 text-sm flex-wrap">
                        <Calendar className="h-4 w-4 text-green-600 dark:text-green-300 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {isCancelled ? 'Access until: ' : 'Renews: '}
                          {new Date(renewalDate).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </span>
                        {isExpiringSoon && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">(Soon)</span>
                        )}
                      </div>
                    )}
                    {lsSub?.lsSubscriptionId && (
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        Subscription ID: {lsSub.lsSubscriptionId}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/ls/customer-portal', { credentials: 'include' });
                        const data = await res.json();
                        if (data.portalUrl) {
                          window.open(data.portalUrl, '_blank', 'noopener,noreferrer');
                        }
                      } catch {
                        setLocation('/ls-subscribe');
                      }
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 whitespace-nowrap"
                  >
                    Manage Billing
                  </button>
                </div>
              </div>
            );
          }

          // Case C: Free owner — show upgrade CTA
          return (
            <div className="mb-6 p-4 rounded-lg border bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-800">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Free Plan</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Upgrade to unlock full features — analytics, custom themes, priority support, and more.
                  </p>
                  {subscriptionStatus.agentId && (
                    <p className="mt-1 text-sm text-gray-500">
                      Assigned agent: <span className="font-medium">{subscriptionStatus.agentName || 'Agent1'}</span>
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setLocation("/ls-subscribe")}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-md text-sm font-bold hover:from-orange-600 hover:to-amber-600 shadow-md"
                  >
                    <Zap className="h-4 w-4" />
                    Upgrade Now · $25/mo
                  </button>
                  {subscriptionStatus.agentId && (
                    <button
                      onClick={() => setLocation("/request-restaurant")}
                      className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
                    >
                      Request from Agent
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Inactive Restaurant Warning */}
        {activeRestaurant && !activeRestaurant.isActive && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Restaurant Inactive
                </h3>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  This restaurant is currently inactive due to your subscription plan. 
                  {subscriptionStatus?.hasAgentPremiumRestaurant ? (
                    <>Contact your agent to activate this restaurant.</>
                  ) : (
                    <>Free users can only access their first restaurant. 
                    <button 
                      onClick={() => setLocation("/request-restaurant")}
                      className="underline hover:no-underline ml-1"
                    >
                      Contact your agent
                    </button> to activate all your restaurants.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={<Eye className="h-6 w-6" />} 
            value={stats?.viewCount ?? defaultStats.viewCount} 
            label="Menu Views" 
          />
          <StatCard 
            icon={<QrCode className="h-6 w-6" />} 
            value={stats?.directQrScans ?? defaultStats.directQrScans} 
            label="QR Code Scans" 
            tooltip="Number of times your QR code has been scanned"
          />
          <StatCard 
            icon={<Utensils className="h-6 w-6" />} 
            value={stats?.menuItemCount ?? defaultStats.menuItemCount} 
            label="Menu Items" 
          />
          <StatCard 
            icon={<Calendar className="h-6 w-6" />} 
            value={stats?.daysActive ?? defaultStats.daysActive} 
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
