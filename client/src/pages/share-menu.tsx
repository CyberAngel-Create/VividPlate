import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import TabNavigation from "@/components/layout/TabNavigation";
import RestaurantOwnerHeader from "@/components/layout/RestaurantOwnerHeader";
import RestaurantOwnerFooter from "@/components/layout/RestaurantOwnerFooter";
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
  
  // Generate the menu URL
  const hostname = window.location.origin;
  const menuUrl = activeRestaurant 
    ? `${hostname}/menu/${activeRestaurant.id}` 
    : "";
  
  // Check if there are menu items
  const hasMenuItems = menuItems && menuItems.length > 0;
  
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
            <h1 className="text-2xl font-heading font-bold mb-6">Share Menu</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center dark:border dark:border-gray-700">
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
        </div>
        
        <RestaurantOwnerFooter />
      </div>
    );
  }
  
  if (!hasMenuItems) {
    return (
      <div className="flex flex-col min-h-screen">
        <RestaurantOwnerHeader onLogout={handleLogout} />
        <TabNavigation />
        
        {/* Main content with padding for fixed header */}
        <div className="pt-16 flex-grow">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-heading font-bold mb-6">Share Menu</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center dark:border dark:border-gray-700">
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
        <div className="container mx-auto px-4 py-6">
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
      </div>
      
      <RestaurantOwnerFooter />
    </div>
  );
};

export default ShareMenu;
