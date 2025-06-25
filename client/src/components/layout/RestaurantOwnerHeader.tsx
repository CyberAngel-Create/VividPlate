import { useState, useCallback } from "react";
import { Store, ChevronRight, PlusCircle } from "lucide-react";
import { useRestaurant } from "@/hooks/use-restaurant";
import { useSubscription } from "@/hooks/use-subscription";
import { useTranslation } from "react-i18next";
import { queryClient } from "@/lib/queryClient";
import CreateRestaurantModal from "@/components/restaurant/CreateRestaurantModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const RestaurantOwnerHeader = () => {
  const { restaurants, activeRestaurant, setActiveRestaurant } = useRestaurant();
  const { isPaid } = useSubscription();
  const { t } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Check if the user can add more restaurants (premium users can add up to 3)
  const canAddRestaurant = isPaid && restaurants && restaurants.length < 3;

  // State for tracking restaurant switch loading
  const [isRestaurantSwitching, setIsRestaurantSwitching] = useState(false);

  // Handle restaurant change with proper cache invalidation and page reload
  const handleRestaurantSwitch = useCallback((restaurantId: number) => {
    // Only update if it's different from current
    if (activeRestaurant?.id !== restaurantId) {
      console.log(`Switching to restaurant ID: ${restaurantId}`);
      
      // Show loading state
      setIsRestaurantSwitching(true);
      
      // Clear any cached menu data before switching restaurants
      if (activeRestaurant) {
        // Invalidate all queries related to the old restaurant
        queryClient.invalidateQueries({ 
          queryKey: [`/api/restaurants/${activeRestaurant.id}/categories`] 
        });
        queryClient.invalidateQueries({ 
          queryKey: [`/api/restaurants/${activeRestaurant.id}/stats`] 
        });
        queryClient.invalidateQueries({ 
          queryKey: [`/api/restaurants/${activeRestaurant.id}/menu`] 
        });
        queryClient.invalidateQueries({ 
          queryKey: [`/api/restaurants/${activeRestaurant.id}/feedbacks`] 
        });
      }
      
      // Set the new active restaurant
      setActiveRestaurant(restaurantId);
      
      // Store the current path before reload
      const currentPath = window.location.pathname;
      sessionStorage.setItem('lastPath', currentPath);
      
      // Add reload flag to session storage
      sessionStorage.setItem('shouldReload', 'true');
      
      // Reload the current page to fully refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
  }, [activeRestaurant, setActiveRestaurant]);

  if (!restaurants || restaurants.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 mt-0 lg:mt-0">
      <div className="lg:pl-52">
        <div className="flex flex-col">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Current Restaurant</p>
          <DropdownMenu>
            <DropdownMenuTrigger disabled={isRestaurantSwitching} className="flex items-center justify-between p-2 text-left rounded-md border dark:border-gray-700 bg-white dark:bg-gray-800 w-full lg:max-w-[calc(100%-208px)]">
              <div className="flex items-center gap-2 truncate">
                {isRestaurantSwitching ? (
                  <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-b-2 border-primary"></div>
                ) : (
                  <Store className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="truncate text-sm">
                  {isRestaurantSwitching 
                    ? "Switching..." 
                    : (activeRestaurant ? activeRestaurant.name : t("Select Restaurant"))}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 dark:bg-gray-800 dark:border-gray-700">
              <DropdownMenuLabel className="dark:text-gray-300">{t("Your Restaurants")}</DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:border-gray-700" />
              {restaurants.map((restaurant) => (
                <DropdownMenuItem 
                  key={restaurant.id}
                  onClick={() => handleRestaurantSwitch(restaurant.id)}
                  className={`cursor-pointer ${
                    activeRestaurant?.id === restaurant.id 
                      ? 'bg-gray-100 dark:bg-gray-700 font-medium' 
                      : 'dark:text-gray-200'
                  } cursor-pointer dark:hover:bg-gray-700`}
                >
                  <span className="truncate max-w-[250px]">{restaurant.name}</span>
                </DropdownMenuItem>
              ))}
              {canAddRestaurant && (
                <>
                  <DropdownMenuSeparator className="dark:border-gray-700" />
                  <DropdownMenuItem 
                    className="cursor-pointer text-primary dark:text-primary-light font-medium"
                    onClick={() => {
                      // Remove any existing reset flag to ensure we get a clean form
                      sessionStorage.removeItem("resetRestaurantForm");
                      // Open the create restaurant modal
                      setIsCreateModalOpen(true);
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {t("Create Restaurant")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Create Restaurant Modal */}
      <CreateRestaurantModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
};

export default RestaurantOwnerHeader;