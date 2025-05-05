import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import CustomerMenuPreview from "@/components/preview/CustomerMenuPreview";
import { apiRequest } from "@/lib/queryClient";
import { Restaurant, MenuCategory, MenuItem } from "@shared/schema";
import AdBanner from "@/components/ads/AdBanner";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import CustomerHeader from "@/components/layout/CustomerHeader";
import Footer from "@/components/layout/Footer";
import MenuAdvertisement from "@/components/menu/MenuAdvertisement";

interface CategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

interface MenuData {
  restaurant: Restaurant;
  menu: CategoryWithItems[];
}

const ViewMenu = () => {
  const { restaurantId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
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
  const source = new URLSearchParams(window.location.search).get("source") || "link";
  
  // Record menu view
  useEffect(() => {
    if (restaurantId) {
      const recordView = async () => {
        try {
          await apiRequest("POST", `/api/restaurants/${restaurantId}/views`, { source });
        } catch (error) {
          console.error("Failed to record menu view", error);
        }
      };
      
      recordView();
    }
  }, [restaurantId, source]);
  
  // Fetch menu data
  const { data, isLoading, error } = useQuery<MenuData>({
    queryKey: [`/api/restaurants/${restaurantId}/menu`],
    enabled: !!restaurantId,
  });
  
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
  
  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Customer header is now fixed at the top */}
      <CustomerHeader isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      
      {/* Main content with padding for fixed header */}
      <div className="flex flex-col items-center flex-grow pt-16">
        {/* Top advertisement from advertisement management system */}
        <div className="w-full max-w-screen-md px-4">
          <MenuAdvertisement position="top" />
        </div>
        
        {/* Top ad banner for free users */}
        <AdBanner format="horizontal" className="w-full max-w-screen-md my-3" />
        
        <div className="flex justify-center py-4 px-2 sm:py-8 sm:px-4 w-full max-w-screen-xl">
          <div className="flex flex-col lg:flex-row w-full gap-6">
            {/* Sidebar advertisement (left side on larger screens) */}
            <div className="lg:w-1/4 order-2 lg:order-1">
              <MenuAdvertisement position="sidebar" />
            </div>
            
            {/* Main menu content */}
            <div className="lg:w-3/4 order-1 lg:order-2">
              <CustomerMenuPreview 
                restaurant={restaurant}
                menuData={menu}
              />
            </div>
          </div>
        </div>
        
        {/* Bottom advertisement from advertisement management system */}
        <div className="w-full max-w-screen-md px-4 mt-6">
          <MenuAdvertisement position="bottom" />
        </div>
        
        {/* Bottom ad banner for free users */}
        <AdBanner format="rectangle" className="w-full max-w-screen-md my-3" />
      </div>
      
      {/* Footer removed from customer view as requested */}
    </div>
  );
};

export default ViewMenu;
