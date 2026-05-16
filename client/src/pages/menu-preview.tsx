import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import RestaurantOwnerLayout from "@/components/layout/RestaurantOwnerLayout";
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
      <RestaurantOwnerLayout>
        <div className="px-4 py-6">
          <h1 className="text-2xl font-heading font-bold mb-6">Menu Preview</h1>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
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
      </RestaurantOwnerLayout>
    );
  }

  // Skip loading state

  return (
    <RestaurantOwnerLayout>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-heading font-bold mb-6">Menu Preview</h1>
        
        <div className="flex justify-center mb-8">
          <div className="inline-block px-3 py-1 rounded-md bg-neutral text-gray-600 dark:text-gray-300 text-sm flex items-center">
            <Eye className="mr-1 h-4 w-4" />
            <span>Preview Mode: This is how customers will see your menu</span>
          </div>
        </div>
        
        {menuData.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center mb-8">
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
    </RestaurantOwnerLayout>
  );
};

export default MenuPreview;
