import { useLocation } from "wouter";
import { PlusCircle, Share, Eye } from "lucide-react";
import { useRestaurant } from "@/hooks/use-restaurant";

const QuickActions = () => {
  const [, setLocation] = useLocation();
  const { activeRestaurant } = useRestaurant();
  const restaurantId = activeRestaurant?.id;

  const handleAddMenuItem = () => {
    if (restaurantId) {
      setLocation(`/create-menu/${restaurantId}`);
    } else {
      setLocation("/create-menu");
    }
  };

  const handleShareMenu = () => {
    if (restaurantId) {
      setLocation(`/share-menu/${restaurantId}`);
    } else {
      setLocation("/share-menu");
    }
  };

  const handlePreviewMenu = () => {
    if (restaurantId) {
      setLocation(`/menu-preview/${restaurantId}`);
    } else {
      setLocation("/menu-preview");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-heading font-semibold mb-4 dark:text-white">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div 
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900/30 hover:shadow-lg transition-shadow flex flex-col items-center text-center cursor-pointer dark:border dark:border-gray-700"
          onClick={handleAddMenuItem}
        >
          <div className="bg-primary bg-opacity-10 dark:bg-primary-dark/20 p-4 rounded-full mb-3">
            <PlusCircle className="h-6 w-6 text-primary dark:text-primary-light" />
          </div>
          <h3 className="font-heading font-medium mb-2 dark:text-white">Add Menu Item</h3>
          <p className="text-sm text-midgray dark:text-gray-300">Create new dishes or specials</p>
        </div>
        
        <div 
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900/30 hover:shadow-lg transition-shadow flex flex-col items-center text-center cursor-pointer dark:border dark:border-gray-700"
          onClick={handleShareMenu}
        >
          <div className="bg-secondary bg-opacity-10 dark:bg-secondary-dark/20 p-4 rounded-full mb-3">
            <Share className="h-6 w-6 text-secondary dark:text-secondary-light" />
          </div>
          <h3 className="font-heading font-medium mb-2 dark:text-white">Share Menu</h3>
          <p className="text-sm text-midgray dark:text-gray-300">Generate QR code or share link</p>
        </div>
        
        <div 
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900/30 hover:shadow-lg transition-shadow flex flex-col items-center text-center cursor-pointer dark:border dark:border-gray-700"
          onClick={handlePreviewMenu}
        >
          <div className="bg-dark bg-opacity-10 dark:bg-gray-700 p-4 rounded-full mb-3">
            <Eye className="h-6 w-6 text-dark dark:text-gray-300" />
          </div>
          <h3 className="font-heading font-medium mb-2 dark:text-white">Preview Menu</h3>
          <p className="text-sm text-midgray dark:text-gray-300">See how your menu looks to customers</p>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
