import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";
import CustomerMenuPreview from "@/components/preview/CustomerMenuPreview";
import { apiRequest } from "@/lib/queryClient";
import { Restaurant, MenuCategory, MenuItem } from "@shared/schema";
import AdBanner from "@/components/ads/AdBanner";
import ContentValidator from "@/components/ads/ContentValidator";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import CustomerHeader from "@/components/layout/CustomerHeader";
import Footer from "@/components/layout/Footer";
import MenuAdvertisement from "@/components/menu/MenuAdvertisement";
import { WaiterCall } from "../../components/WaiterCall";

interface CategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

interface RestaurantWithSubscription extends Restaurant {
  subscriptionTier?: string;
  isPremium?: boolean;
}

interface MenuData {
  restaurant: RestaurantWithSubscription;
  menu: CategoryWithItems[];
}

const ViewMenu = () => {
  const { restaurantName } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiRequest("GET", "/api/auth/me");
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setIsAuthenticated(false);
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  // Get source parameter from URL (e.g., qr or link)
  // Get source parameter from URL (e.g. ?source=qr), with strong default to "qr" if coming from a QR code scan
  const sourceParam = new URLSearchParams(window.location.search).get("source");
  const source = sourceParam || (window.location.search.includes("qr") ? "qr" : "link");
  console.log("Menu view source detected:", source);

  // First lookup restaurant ID by name using the dedicated API endpoint
  useEffect(() => {
    if (restaurantName) {
      const fetchRestaurantIdByName = async () => {
        try {
          // Use the new dedicated API endpoint for looking up restaurant by name
          const response = await apiRequest("GET", `/api/restaurants/name/${restaurantName}`);
          const restaurant = await response.json();

          console.log("Restaurant lookup result:", restaurant);
          setRestaurantId(restaurant.id);
        } catch (error) {
          console.error("Failed to fetch restaurant by name:", error);
          setLocation("/");
        }
      };

      fetchRestaurantIdByName();
    }
  }, [restaurantName, setLocation]);

  // Record menu view and make sure QR code scans are counted properly
  useEffect(() => {
    if (restaurantId) {
      const recordView = async () => {
        try {
          console.log(`Recording view for restaurant ${restaurantId} from source ${source}`);

          // First attempt - using the regular view endpoint
          let response = await apiRequest("POST", `/api/restaurants/${restaurantId}/views`, { source });
          console.log("View recorded successfully:", response);

          // For QR code scans, make an additional separate request to ensure the counter increments
          if (source === 'qr') {
        try {
          // Make a dedicated API call to increment QR scans
          const response = await apiRequest("POST", `/api/restaurants/${restaurantId}/qr-scan`);
          if (response.ok) {
            console.log(`QR code scan successfully recorded for restaurant ${restaurantId}`);
          } else {
            console.error(`Failed to record QR code scan for restaurant ${restaurantId}`);
          }
        } catch (qrError) {
          console.error("Failed to record QR code scan:", qrError);
        }
      }
        } catch (error) {
          console.error("Failed to record menu view:", error);
        }
      };

      recordView();
    }
  }, [restaurantId, source]);

  // Fetch menu data
  const { data, isLoading, error } = useQuery<MenuData>({
    queryKey: [`/api/restaurants/${restaurantId}/menu`],
    enabled: !!restaurantId,
    retry: 3,
    refetchOnWindowFocus: false,
  });

  // Debug logging
  console.log("ViewMenu Debug:", {
    restaurantName,
    restaurantId, 
    isLoading,
    error: error?.message,
    hasData: !!data,
    queryEnabled: !!restaurantId,
    dataStructure: data ? {
      restaurant: !!data.restaurant,
      menu: data.menu?.length,
      menuCategories: data.menu?.map(cat => ({ name: cat.name, itemCount: cat.items?.length }))
    } : null
  });

  // Log when restaurantId changes
  React.useEffect(() => {
    console.log("RestaurantId changed:", restaurantId);
  }, [restaurantId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-heading font-bold mb-4">Menu Not Found</h1>
        <p className="text-midgray mb-6">The menu you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => setLocation("/")}
          className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const { restaurant, menu } = data;

  // Debug logging for menu data flow
  console.log("ViewMenu - Menu data received:", {
    restaurantId: restaurant?.id,
    restaurantName: restaurant?.name,
    menuLength: menu?.length,
    menuCategories: menu?.map(cat => ({
      id: cat.id,
      name: cat.name,
      itemCount: cat.items?.length || 0
    }))
  });

  // Import the useSubscription hook for ad display control
  const { isPaid: isCurrentUserPaid } = useSubscription();

  // Check if the restaurant owner has a premium subscription
  // If the server explicitly tells us the restaurant is premium, use that value
  // Otherwise fall back to checking if the restaurant's owner subscription tier is premium
  const isRestaurantPremium = restaurant.isPremium !== undefined 
    ? restaurant.isPremium 
    : (restaurant.userId && restaurant.subscriptionTier === "premium");

  // Show ads only if the restaurant owner doesn't have a premium subscription
  const showAds = !isRestaurantPremium;

  console.log("Restaurant subscription status:", {
    restaurantId: restaurant.id,
    restaurantUserId: restaurant.userId,
    restaurantSubscriptionTier: restaurant.subscriptionTier,
    isRestaurantPremium,
    isPremiumFromServer: restaurant.isPremium,
    showAds
  });

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Add a spacer to prevent content from being hidden by mobile header/restaurant switcher */}
      <div className="h-16 md:h-0 w-full"></div>

      <div className="flex flex-col items-center flex-grow pt-4 tablet:pt-2">
        {/* Top advertisement from advertisement management system - only shown if restaurant is not premium */}
        {/* AdSense Policy Compliance: Ads only displayed on pages with sufficient content */}
        {showAds && (
          <ContentValidator route={window.location.pathname}>
            <div className="w-full max-w-screen-md px-4">
              <MenuAdvertisement position="top" restaurantId={restaurant.id} />
            </div>
          </ContentValidator>
        )}

        {/* Top ad banner for free users - only shown if restaurant is not premium */}
        {/* AdSense Policy Compliance: Content validation ensures meaningful page content */}
        {showAds && (
          <ContentValidator route={window.location.pathname}>
            <AdBanner format="horizontal" className="w-full max-w-screen-md my-3" />
          </ContentValidator>
        )}

        <div className="flex justify-center py-4 px-2 sm:py-8 sm:px-4 md:px-4 md:py-4 tablet:px-6 tablet:py-2 w-full md:max-w-none lg:max-w-screen-xl tablet:max-w-full">
          <div className="flex flex-col lg:flex-row w-full gap-0 md:gap-0 lg:gap-6">
            {/* Sidebar advertisement (left side on larger screens) - only shown if restaurant is not premium */}
            {/* AdSense Policy Compliance: Sidebar ads require content validation */}
            {showAds && (
              <ContentValidator route={window.location.pathname}>
                <div className="lg:w-1/4 order-2 lg:order-1">
                  <MenuAdvertisement position="sidebar" restaurantId={restaurant.id} />
                </div>
              </ContentValidator>
            )}

            {/* Main menu content - takes full width when ads are not shown */}
            <div className={`${showAds ? 'lg:w-3/4' : 'w-full'} order-1 lg:order-2`}>
              <CustomerMenuPreview 
                restaurant={restaurant}
                menuData={menu}
                previewMode={false}
              />
            </div>
          </div>
        </div>

        {/* Floating Waiter Call Button */}
        <WaiterCall restaurantId={restaurant.id} restaurantName={restaurant.name} />

        {/* Bottom advertisement from advertisement management system - only shown if restaurant is not premium */}
        {/* AdSense Policy Compliance: Bottom ads require content validation */}
        {showAds && (
          <ContentValidator route={window.location.pathname}>
            <div className="w-full max-w-screen-md px-4 mt-6">
              <MenuAdvertisement position="bottom" restaurantId={restaurant.id} />
            </div>
          </ContentValidator>
        )}

        {/* Bottom ad banner for free users - only shown if restaurant is not premium */}
        {/* AdSense Policy Compliance: Rectangle ads need sufficient content */}
        {showAds && (
          <ContentValidator route={window.location.pathname}>
            <AdBanner format="rectangle" className="w-full max-w-screen-md my-3" />
          </ContentValidator>
        )}
      </div>

      {/* Footer removed from customer view as requested */}
    </div>
  );
};

export default ViewMenu;