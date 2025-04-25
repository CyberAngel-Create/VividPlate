import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import CustomerMenuPreview from "@/components/preview/CustomerMenuPreview";
import { apiRequest } from "@/lib/queryClient";
import { Restaurant, MenuCategory, MenuItem } from "@shared/schema";

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
    <div className="flex justify-center py-8 px-4">
      <CustomerMenuPreview 
        restaurant={restaurant}
        menuData={menu}
      />
    </div>
  );
};

export default ViewMenu;
