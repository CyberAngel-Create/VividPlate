import { Restaurant, MenuCategory, MenuItem } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Facebook, Instagram, Globe, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { normalizeImageUrl, getFallbackImage } from "@/lib/imageUtils";
import { useState, useMemo, useEffect, CSSProperties } from "react";
import ImageViewDialog from "@/components/ui/image-view-dialog";
import FeedbackDialog from "@/components/ui/feedback-dialog";
import CompactSearch from "@/components/ui/compact-search";
import MenuItemDietaryOverlay from "@/components/dietary/MenuItemDietaryOverlay";
import PersonalizedDietaryOverlay from "@/components/dietary/PersonalizedDietaryOverlay";
import { DietaryPreferencesProvider } from "@/hooks/use-dietary-preferences";

// Banner slideshow component
interface BannerSlideshowProps {
  bannerUrls: string[];
  restaurantName: string;
  interval?: number; // milliseconds
}

const BannerSlideshow: React.FC<BannerSlideshowProps> = ({ 
  bannerUrls, 
  restaurantName,
  interval = 5000 // default to 5 seconds
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Automatic slideshow
  useEffect(() => {
    if (bannerUrls.length <= 1) return;
    
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev === bannerUrls.length - 1 ? 0 : prev + 1));
    }, interval);
    
    return () => clearInterval(timer);
  }, [bannerUrls.length, interval]);
  
  const prevSlide = () => {
    setActiveIndex((prev) => (prev === 0 ? bannerUrls.length - 1 : prev - 1));
  };
  
  const nextSlide = () => {
    setActiveIndex((prev) => (prev === bannerUrls.length - 1 ? 0 : prev + 1));
  };
  
  return (
    <div className="relative w-full h-full">
      {bannerUrls.map((url, index) => (
        <img
          key={index}
          src={normalizeImageUrl(url)}
          alt={`${restaurantName} banner ${index + 1}`}
          className={`w-full h-full object-cover absolute top-0 left-0 transition-opacity duration-1000 ${
            index === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
          onError={(e) => {
            console.error("Failed to load banner image:", url);
            e.currentTarget.src = getFallbackImage('banner');
          }}
        />
      ))}
      
      {bannerUrls.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/25 text-white p-1 rounded-full hover:bg-black/40 z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/25 text-white p-1 rounded-full hover:bg-black/40 z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
            {bannerUrls.map((_, index) => (
              <button 
                key={index}
                className={`w-2 h-2 rounded-full bg-white ${
                  index === activeIndex ? 'opacity-100' : 'opacity-50'
                }`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

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
  
  // Get theme settings from restaurant or use defaults
  const defaultTheme = {
    backgroundColor: "#ffffff",
    textColor: "#000000",
    headerColor: "#f5f5f5",
    accentColor: "#4f46e5", 
    fontFamily: "Inter, sans-serif",
    menuItemColor: "#333333",
    menuDescriptionColor: "#666666",
    menuPriceColor: "#111111"
  };
  
  // Parse theme settings from JSON string if necessary or use the provided object
  let themeSettings = defaultTheme;
  try {
    if (restaurant.themeSettings) {
      if (typeof restaurant.themeSettings === 'string') {
        themeSettings = { ...defaultTheme, ...JSON.parse(restaurant.themeSettings) };
      } else if (typeof restaurant.themeSettings === 'object') {
        themeSettings = { ...defaultTheme, ...restaurant.themeSettings as Record<string, string> };
      }
    }
  } catch (e) {
    console.error('Error parsing theme settings:', e);
  }
  
  const theme = themeSettings;

  // Collect all menu items for search functionality
  const allMenuItems = useMemo(() => {
    return menuData.flatMap(category => category.items);
  }, [menuData]);

  // Filter items based on selected category
  const filteredMenuData = activeCategory === "all" 
    ? menuData 
    : menuData.filter(category => category.id.toString() === activeCategory);

  // Create styles based on theme
  const containerStyle: CSSProperties = {
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    fontFamily: theme.fontFamily
  };
  
  const headerContainerStyle: CSSProperties = {
    backgroundColor: theme.headerColor
  };
  
  const categoryNameStyle: CSSProperties = {
    color: theme.menuItemColor
  };
  
  const menuItemNameStyle: CSSProperties = {
    color: theme.menuItemColor
  };
  
  const menuItemDescriptionStyle: CSSProperties = {
    color: theme.menuDescriptionColor
  };
  
  const menuItemPriceStyle: CSSProperties = {
    color: theme.menuPriceColor
  };

  return (
    <DietaryPreferencesProvider>
      <div 
        className="w-full max-w-2xl mx-auto rounded-xl overflow-hidden menu-preview-shadow"
        style={containerStyle}>
        {/* Restaurant header with banner slideshow */}
        <div className="relative">
          <div className="h-40 bg-gray-300 relative">
            {restaurant.bannerUrls && Array.isArray(restaurant.bannerUrls) && restaurant.bannerUrls.length > 0 ? (
              <BannerSlideshow 
                bannerUrls={restaurant.bannerUrls as string[]} 
                restaurantName={restaurant.name} 
              />
            ) : restaurant.bannerUrl ? (
              // Fallback to legacy single banner image
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
        <div className="border-b dark:border-gray-700" style={headerContainerStyle}>
          <div className="flex justify-between items-center px-4">
            <div className="flex overflow-x-auto py-2 space-x-4 flex-grow">
              <button 
                className={`px-1 py-2 font-medium whitespace-nowrap ${
                  activeCategory === "all" 
                    ? `border-b-2 border-[${theme.accentColor}]` 
                    : ""
                }`}
                style={{ color: activeCategory === "all" ? theme.accentColor : theme.menuItemColor }}
                onClick={() => handleCategoryClick("all")}
              >
                All
              </button>
              
              {menuData.map((category) => (
                <button 
                  key={category.id}
                  className={`px-1 py-2 font-medium whitespace-nowrap ${
                    activeCategory === category.id.toString() 
                      ? `border-b-2 border-[${theme.accentColor}]` 
                      : ""
                  }`}
                  style={{ 
                    color: activeCategory === category.id.toString() 
                      ? theme.accentColor 
                      : theme.menuItemColor 
                  }}
                  onClick={() => handleCategoryClick(category.id.toString())}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Personalized Dietary Overlay */}
        {!previewMode && allMenuItems.length > 0 && (
          <div className="p-4 pb-0">
            <PersonalizedDietaryOverlay 
              restaurantId={restaurant.id} 
              menuItems={allMenuItems}
            />
          </div>
        )}
        
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
                <h3 
                  className="text-lg font-heading font-semibold mb-3" 
                  style={categoryNameStyle}
                >
                  {category.name}
                </h3>
                
                {category.items.length === 0 ? (
                  <p className="text-sm italic" style={menuItemDescriptionStyle}>No items in this category</p>
                ) : (
                  <div className="space-y-4">
                    {category.items.map((item) => (
                      <div 
                        key={item.id}
                        className="flex flex-row border-b dark:border-gray-700 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0 rounded-md p-2 -m-2"
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
                            
                            <div className="w-full h-24 sm:h-28 bg-neutral dark:bg-gray-800 rounded-md flex items-center justify-center">
                              <span className="text-xs text-gray-500 dark:text-gray-400">No image</span>
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
                                  <h4 className="font-medium" style={menuItemNameStyle}>{item.name}</h4>
                                  <span className="font-medium" style={menuItemPriceStyle}>
                                    {formatCurrency(item.price)}
                                  </span>
                                </div>
                                <p className="text-sm mt-2" style={menuItemDescriptionStyle}>
                                  {item.description || ""}
                                </p>
                                {item.tags && item.tags.length > 0 && (
                                  <div className="mt-2 flex flex-wrap">
                                    {item.tags.map((tag, index) => (
                                      <Badge 
                                        key={index} 
                                        variant="outline" 
                                        className="inline-block mr-1 mb-1 px-2 py-0.5 bg-neutral dark:bg-gray-800 text-xs text-midgray dark:text-gray-300"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Feedback button indicator - always visible */}
                                <div 
                                  className="mt-2 text-xs flex items-center" 
                                  style={{ color: theme.accentColor }}
                                >
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
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <h3 className="font-heading font-medium" style={menuItemNameStyle}>{restaurant.name}</h3>
              {restaurant.address && (
                <p className="text-sm" style={menuItemDescriptionStyle}>{restaurant.address}</p>
              )}
              {restaurant.phone && (
                <p className="text-sm" style={menuItemDescriptionStyle}>{restaurant.phone}</p>
              )}
              <div className="flex justify-center space-x-2 mt-2">
                <a 
                  href="#" 
                  style={{ color: theme.accentColor }}
                  className="hover:opacity-80 transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a 
                  href="#" 
                  style={{ color: theme.accentColor }}
                  className="hover:opacity-80 transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a 
                  href="#" 
                  style={{ color: theme.accentColor }}
                  className="hover:opacity-80 transition-colors"
                >
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
    </DietaryPreferencesProvider>
  );
};

export default CustomerMenuPreview;
