import { useLocation } from "wouter";
import { PlusCircle, Share, Eye, Globe } from "lucide-react";
import { useRestaurant } from "@/hooks/use-restaurant";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";

const QuickActions = () => {
  const [, setLocation] = useLocation();
  const { activeRestaurant } = useRestaurant();
  const { subscriptionStatus } = useSubscriptionStatus();
  const websiteAddonActive = (subscriptionStatus as any)?.websiteAddonActive;
  
  // Function to create URL-friendly restaurant name
  const getRestaurantUrlName = (name: string) => {
    return encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));
  };

  const handleAddMenuItem = () => {
    if (activeRestaurant) {
      // For internal routes, still use ID for simplicity
      setLocation(`/create-menu/${activeRestaurant.id}`);
    } else {
      setLocation("/create-menu");
    }
  };

  const handleShareMenu = () => {
    if (activeRestaurant) {
      setLocation(`/share-menu`);
    } else {
      setLocation("/share-menu");
    }
  };

  const handlePreviewMenu = () => {
    if (activeRestaurant) {
      // For internal routes, still use ID for simplicity
      setLocation(`/menu-preview/${activeRestaurant.id}`);
    } else {
      setLocation("/menu-preview");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-heading font-semibold mb-4 dark:text-white">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

        <div
          className={`p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center text-center cursor-pointer border ${
            websiteAddonActive
              ? "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800"
              : "bg-white dark:bg-gray-800 dark:border-gray-700"
          }`}
          onClick={() => setLocation("/my-website")}
        >
          <div className={`p-4 rounded-full mb-3 ${websiteAddonActive ? "bg-indigo-100 dark:bg-indigo-900/40" : "bg-gray-100 dark:bg-gray-700"}`}>
            <Globe className={`h-6 w-6 ${websiteAddonActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`} />
          </div>
          <h3 className="font-heading font-medium mb-2 dark:text-white">My Website</h3>
          <p className="text-sm text-midgray dark:text-gray-300">
            {websiteAddonActive ? "Manage your public website" : "Build a restaurant website"}
          </p>
          {!websiteAddonActive && (
            <span className="mt-2 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">Add-on</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
