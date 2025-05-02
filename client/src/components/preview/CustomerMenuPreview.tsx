import { Restaurant, MenuCategory, MenuItem } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Facebook, Instagram, Globe, MessageSquare } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { normalizeImageUrl, getFallbackImage } from "@/lib/imageUtils";
import { useState, useMemo } from "react";
import ImageViewDialog from "@/components/ui/image-view-dialog";
import FeedbackDialog from "@/components/ui/feedback-dialog";
import CompactSearch from "@/components/ui/compact-search";
import MenuItemDietaryOverlay from "@/components/dietary/MenuItemDietaryOverlay";

interface CategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

interface CustomerMenuPreviewProps {
  restaurant: Restaurant;
  menuData: CategoryWithItems[];
  previewMode?: boolean;
}

const CustomerMenuPreview: React.FC<CustomerMenuPreviewProps> = ({ 
  restaurant, 
  menuData,
  previewMode = false
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  // Collect all menu items for search functionality
  const allMenuItems = useMemo(() => {
    return menuData.flatMap(category => category.items);
  }, [menuData]);

  // Filter items based on selected category
  const filteredMenuData = activeCategory === "all" 
    ? menuData 
    : menuData.filter(category => category.id.toString() === activeCategory);

  return (
    <>
      <div className="w-full max-w-2xl mx-auto bg-white rounded-xl overflow-hidden menu-preview-shadow">
        {/* Restaurant header */}
        <div className="relative">
          <div className="h-40 bg-gray-300 relative">
            {restaurant.bannerUrl ? (
              <img 
                src={normalizeImageUrl(restaurant.bannerUrl)}
                alt={`${restaurant.name} banner`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Failed to load banner image:", restaurant.bannerUrl);
                  e.currentTarget.src = getFallbackImage('banner');
                }}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          </div>
          <div className="absolute bottom-4 left-4 text-white">
            <h2 className="text-2xl font-heading font-bold">{restaurant.name}</h2>
            <p className="text-sm opacity-90">{restaurant.cuisine || "Restaurant Menu"}</p>
          </div>
        </div>
        
        {/* Menu Categories Tabs and Search */}
        <div className="border-b">
          <div className="flex justify-between items-center px-4">
            <div className="flex overflow-x-auto py-2 space-x-4 flex-grow">
              <button 
                className={`px-1 py-2 font-medium whitespace-nowrap ${
                  activeCategory === "all" 
                    ? "text-primary border-b-2 border-primary" 
                    : "text-dark hover:text-primary"
                }`}
                onClick={() => handleCategoryClick("all")}
              >
                All
              </button>
              
              {menuData.map((category) => (
                <button 
                  key={category.id}
                  className={`px-1 py-2 font-medium whitespace-nowrap ${
                    activeCategory === category.id.toString() 
                      ? "text-primary border-b-2 border-primary" 
                      : "text-dark hover:text-primary"
                  }`}
                  onClick={() => handleCategoryClick(category.id.toString())}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Compact Search Component */}
        {allMenuItems.length > 0 && (
          <CompactSearch menuItems={allMenuItems} />
        )}
        
        {/* Menu Items */}
        <div className="p-4">
          {menuData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-midgray">No menu items yet</p>
            </div>
          ) : (
            filteredMenuData.map((category) => (
              <div key={category.id} className="mb-6">
                <h3 className="text-lg font-heading font-semibold mb-3 text-dark">
                  {category.name}
                </h3>
                
                {category.items.length === 0 ? (
                  <p className="text-sm text-midgray italic">No items in this category</p>
                ) : (
                  <div className="space-y-4">
                    {category.items.map((item) => (
                      <div 
                        key={item.id}
                        className="flex flex-row border-b pb-4 mb-4 last:border-0 last:pb-0 last:mb-0 rounded-md p-2 -m-2"
                      >
                        {/* Image on left side with click to view */}
                        {item.imageUrl ? (
                          <div className="w-1/3 pr-4 relative">
                            {/* Dietary Overlay positioned on the image */}
                            <MenuItemDietaryOverlay item={item} />
                            
                            <ImageViewDialog 
                              imageSrc={normalizeImageUrl(item.imageUrl)} 
                              imageAlt={item.name}
                            >
                              <div className="w-full h-24 sm:h-28 bg-neutral rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                                <img 
                                  src={normalizeImageUrl(item.imageUrl)} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error("Failed to load menu item image:", item.imageUrl);
                                    e.currentTarget.src = getFallbackImage('menu');
                                  }}
                                />
                              </div>
                            </ImageViewDialog>
                          </div>
                        ) : (
                          <div className="w-1/3 pr-4 relative">
                            {/* Dietary Overlay positioned even when there's no image */}
                            <MenuItemDietaryOverlay item={item} />
                            
                            <div className="w-full h-24 sm:h-28 bg-neutral rounded-md flex items-center justify-center">
                              <span className="text-xs text-gray-500">No image</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Details on right side */}
                        <div className="flex-grow w-2/3">
                          <FeedbackDialog
                            menuItemId={item.id}
                            menuItemName={item.name}
                            restaurantId={restaurant.id}
                            trigger={
                              <div className="flex flex-col cursor-pointer relative group">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium text-dark">{item.name}</h4>
                                  <span className="text-primary font-medium">
                                    {formatCurrency(item.price)}
                                  </span>
                                </div>
                                <p className="text-sm text-midgray mt-2">
                                  {item.description || ""}
                                </p>
                                {item.tags && item.tags.length > 0 && (
                                  <div className="mt-2 flex flex-wrap">
                                    {item.tags.map((tag, index) => (
                                      <Badge 
                                        key={index} 
                                        variant="outline" 
                                        className="inline-block mr-1 mb-1 px-2 py-0.5 bg-neutral text-xs text-midgray"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Feedback button indicator - always visible */}
                                <div className="mt-2 text-xs flex items-center text-primary">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  <span>Click to leave feedback</span>
                                </div>
                              </div>
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          
          {/* Restaurant info footer */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <div className="text-center">
              <h3 className="font-heading font-medium text-dark">{restaurant.name}</h3>
              {restaurant.address && (
                <p className="text-sm text-midgray">{restaurant.address}</p>
              )}
              {restaurant.phone && (
                <p className="text-sm text-midgray">{restaurant.phone}</p>
              )}
              <div className="flex justify-center space-x-2 mt-2">
                <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                  <Globe className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {previewMode && (
          <div className="bg-neutral text-midgray text-sm py-2 px-4 text-center">
            Preview Mode
          </div>
        )}
      </div>
    </>
  );
};

export default CustomerMenuPreview;
