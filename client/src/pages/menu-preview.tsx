import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import TabNavigation from "@/components/layout/TabNavigation";
import RestaurantOwnerHeader from "@/components/layout/RestaurantOwnerHeader";
import RestaurantOwnerFooter from "@/components/layout/RestaurantOwnerFooter";
import CustomerMenuPreview from "@/components/preview/CustomerMenuPreview";
import { MenuCategory, MenuItem } from "@shared/schema";
import { Edit, Eye } from "lucide-react";
import { useRestaurant } from "@/hooks/use-restaurant";
import { useMenu } from "@/hooks/use-menu";

interface CategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

const MenuPreview = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { activeRestaurant } = useRestaurant();
  const { categories, menuItems, isLoading } = useMenu();
  
  // Combine categories with their items
  const [menuData, setMenuData] = useState<CategoryWithItems[]>([]);
  
  useEffect(() => {
    if (categories && menuItems) {
      const data = categories.map(category => {
        const items = menuItems
          .filter(item => item.categoryId === category.id)
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        
        return {
          ...category,
          items
        };
      }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      
      setMenuData(data);
    }
  }, [categories, menuItems]);
  
  const handleEditMenu = () => {
    setLocation("/create-menu");
  };
  
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };
  
  if (!activeRestaurant) {
    return (
      <div className="flex flex-col min-h-screen">
        <RestaurantOwnerHeader onLogout={handleLogout} />
        
        {/* Main content with padding for fixed header */}
        <div className="pt-16 flex-grow">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-heading font-bold mb-6">Menu Preview</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center dark:border dark:border-gray-700">
              <p className="text-lg mb-4">You haven't created a restaurant yet.</p>
              <p className="mb-6">Create your restaurant profile first before previewing your menu.</p>
              <button 
                onClick={() => setLocation("/edit-restaurant")}
                className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
              >
                Create Restaurant
              </button>
            </div>
          </div>
        </div>
        
        <RestaurantOwnerFooter />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <RestaurantOwnerHeader onLogout={handleLogout} />
        <TabNavigation />
        
        {/* Main content with padding for fixed header */}
        <div className="pt-16 flex-grow">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
            <h1 className="text-2xl font-heading font-bold mb-4 sm:mb-6">Menu Preview</h1>
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
        
        <RestaurantOwnerFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <RestaurantOwnerHeader onLogout={handleLogout} />
      <TabNavigation />
      
      {/* Main content with padding for fixed header */}
      <div className="pt-16 flex-grow">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <h1 className="text-2xl font-heading font-bold mb-4 sm:mb-6">Menu Preview</h1>
          
          <div className="flex justify-center mb-8">
            <div className="inline-block px-3 py-1 rounded-md bg-neutral text-midgray text-sm flex items-center">
              <Eye className="mr-1 h-4 w-4" />
              <span>Preview Mode: This is how customers will see your menu</span>
            </div>
          </div>
          
          {menuData.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center mb-8 dark:border dark:border-gray-700">
              <p className="text-lg mb-4">You haven't created any menu items yet.</p>
              <p className="mb-6">Start by adding categories and menu items to your menu.</p>
              <button 
                onClick={() => setLocation("/create-menu")}
                className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
              >
                Create Menu
              </button>
            </div>
          ) : (
            <>
              <div className="w-full flex justify-center px-0 sm:px-4">
                <CustomerMenuPreview 
                  restaurant={activeRestaurant}
                  menuData={menuData}
                  previewMode={true}
                />
              </div>
              
              <div className="flex justify-center mt-8">
                <Button 
                  className="bg-secondary hover:bg-secondary/90 text-white"
                  onClick={handleEditMenu}
                >
                  <Edit className="mr-1 h-4 w-4" /> Edit Menu
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      
      <RestaurantOwnerFooter />
    </div>
  );
};

export default MenuPreview;