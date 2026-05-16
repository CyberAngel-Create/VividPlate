import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import RestaurantOwnerLayout from "@/components/layout/RestaurantOwnerLayout";
import QRCodeGenerator from "@/components/share/QRCodeGenerator";
import ShareOptions from "@/components/share/ShareOptions";
import { useRestaurant } from "@/hooks/use-restaurant";
import { useMenu } from "@/hooks/use-menu";
import { useLocation } from "wouter";

const ShareMenu = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { activeRestaurant } = useRestaurant();
  const { categories, menuItems } = useMenu();
  
  // Generate the menu URL using restaurant name instead of ID
  const hostname = window.location.origin;
  const menuUrl = activeRestaurant 
    ? `${hostname}/menu/${encodeURIComponent(activeRestaurant.name.toLowerCase().replace(/\s+/g, '-'))}?source=qr` 
    : "";
  
  // Check if there are menu items
  const hasMenuItems = menuItems && menuItems.length > 0;
  
  // Logout is handled by the RestaurantOwnerLayout component

  if (!activeRestaurant) {
    return (
      <RestaurantOwnerLayout>
        <div className="px-4 py-6">
          <h1 className="text-2xl font-heading font-bold mb-6">Share Menu</h1>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <p className="text-lg mb-4">You haven't created a restaurant yet.</p>
            <p className="mb-6">Create your restaurant profile first before sharing your menu.</p>
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
  
  if (!hasMenuItems) {
    return (
      <RestaurantOwnerLayout>
        <div className="px-4 py-6">
          <h1 className="text-2xl font-heading font-bold mb-6">Share Menu</h1>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <p className="text-lg mb-4">You haven't created any menu items yet.</p>
            <p className="mb-6">Create your menu first before sharing it with customers.</p>
            <button 
              onClick={() => setLocation("/create-menu")}
              className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
            >
              Create Menu
            </button>
          </div>
        </div>
      </RestaurantOwnerLayout>
    );
  }

  return (
    <RestaurantOwnerLayout>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-heading font-bold mb-6">Share Your Menu</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <QRCodeGenerator 
            restaurant={activeRestaurant}
            menuUrl={menuUrl}
          />
          
          <ShareOptions 
            menuUrl={menuUrl}
          />
        </div>
      </div>
    </RestaurantOwnerLayout>
  );
};

export default ShareMenu;
