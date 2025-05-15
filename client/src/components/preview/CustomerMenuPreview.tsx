import { Restaurant, MenuCategory, MenuItem } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Facebook, Instagram, Globe, MessageSquare, ChevronLeft, ChevronRight, Utensils, Coffee, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { normalizeImageUrl, getFallbackImage } from "@/lib/imageUtils";
import React, { useState, useMemo, useEffect, CSSProperties, useRef } from "react";
import { useTranslation } from "react-i18next";
import ImageViewDialog from "@/components/ui/image-view-dialog";
import FeedbackDialog from "@/components/ui/feedback-dialog";
import CompactSearch from "@/components/ui/compact-search";
import MenuLanguageSwitcher from "@/components/ui/menu-language-switcher";
import ResponsiveImage from "@/components/ui/responsive-image";

// Banner slideshow component
interface BannerSlideshowProps {
  bannerUrls: string[];
  restaurantName: string;
  logoUrl?: string | null;
  interval?: number; // milliseconds
}

const BannerSlideshow: React.FC<BannerSlideshowProps> = ({ 
  bannerUrls, 
  restaurantName,
  logoUrl,
  interval = 5000 // default to 5 seconds
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  // Process the banner URLs
  const processedBannerUrls = useMemo(() => {
    if (!bannerUrls || bannerUrls.length === 0) {
      console.warn('No banner URLs provided to BannerSlideshow');
      return [getFallbackImage('banner')];
    }
    // Filter out empty URLs
    return bannerUrls.filter(url => !!url);
  }, [bannerUrls]);
  
  // Automatic slideshow - only runs when not hovering
  useEffect(() => {
    if (processedBannerUrls.length <= 1 || isHovering) return;
    
    console.log('Banner slideshow initiated with interval:', interval);
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = prev === processedBannerUrls.length - 1 ? 0 : prev + 1;
        console.log(`Sliding banner from index ${prev} to ${nextIndex}`);
        return nextIndex;
      });
    }, interval);
    
    return () => {
      console.log('Clearing banner slideshow interval');
      clearInterval(timer);
    };
  }, [processedBannerUrls.length, interval, isHovering]);
  
  const prevSlide = () => {
    setActiveIndex((prev) => {
      const newIndex = prev === 0 ? processedBannerUrls.length - 1 : prev - 1;
      console.log(`Manual slide to previous: ${prev} -> ${newIndex}`);
      return newIndex;
    });
  };
  
  const nextSlide = () => {
    setActiveIndex((prev) => {
      const newIndex = prev === processedBannerUrls.length - 1 ? 0 : prev + 1;
      console.log(`Manual slide to next: ${prev} -> ${newIndex}`);
      return newIndex;
    });
  };
  
  return (
    <div 
      className="relative w-full h-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Banner images */}
      {processedBannerUrls.map((url, index) => {
        const normalizedUrl = normalizeImageUrl(url);
        console.log(`Banner image ${index}: ${normalizedUrl}, active: ${index === activeIndex}`);
        
        return (
          <ResponsiveImage
            key={index}
            src={url}
            alt={`${restaurantName} banner ${index + 1}`}
            fallbackType="banner"
            className={`w-full h-full absolute top-0 left-0 transition-opacity duration-1000 ${
              index === activeIndex ? 'opacity-100' : 'opacity-0'
            }`}
            imgClassName="object-cover w-full h-full"
            onError={() => {
              console.error("Failed to load banner image:", url);
            }}
          />
        );
      })}
      
      {/* Restaurant logo overlay */}
      {logoUrl && (
        <div className="absolute top-4 right-4 z-20 w-16 h-16 md:w-20 md:h-20 bg-white rounded-full p-1 shadow-md">
          <ResponsiveImage
            src={logoUrl}
            alt={`${restaurantName} logo`}
            fallbackType="logo"
            className="w-full h-full rounded-full overflow-hidden"
            imgClassName="object-cover w-full h-full"
            onError={() => {
              console.error("Failed to load logo image:", logoUrl);
            }}
          />
        </div>
      )}
      
      {processedBannerUrls.length > 1 && (
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
            {processedBannerUrls.map((_, index) => (
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
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeMainCategory, setActiveMainCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [headerFixed, setHeaderFixed] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const prevScrollY = useRef(0);
  
  useEffect(() => {
    setMounted(true);
    
    // Set up scroll event listener for fixed header
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only fix header when scrolling up and past a threshold
      if (currentScrollY > 150 && currentScrollY < prevScrollY.current) {
        setHeaderFixed(true);
      } else if (currentScrollY > prevScrollY.current || currentScrollY < 100) {
        setHeaderFixed(false);
      }
      
      prevScrollY.current = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    // Reset main category filter when a specific category is selected
    if (categoryId !== "all") {
      setActiveMainCategory(null);
    }
  };
  
  const handleMainCategoryClick = (mainCategory: string) => {
    if (activeMainCategory === mainCategory) {
      // Toggle off if already selected
      setActiveMainCategory(null);
    } else {
      setActiveMainCategory(mainCategory);
      // Reset to "all" categories when filtering by main category
      setActiveCategory("all");
    }
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
  
  const menuTheme = themeSettings;

  // Collect all menu items for search functionality
  const allMenuItems = useMemo(() => {
    return menuData.flatMap(category => category.items);
  }, [menuData]);
  
  // Image dialog state for menu items
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  // Filter items based on selected category and main category
  const filteredMenuData = useMemo(() => {
    // First filter by main category if selected
    let filtered = menuData;
    
    if (activeMainCategory) {
      filtered = menuData.filter(category => 
        category.mainCategory === activeMainCategory
      );
    }
    
    // Then filter by specific category if not "all"
    if (activeCategory !== "all") {
      filtered = filtered.filter(category => 
        category.id.toString() === activeCategory
      );
    }
    
    return filtered;
  }, [menuData, activeCategory, activeMainCategory]);

  // Create styles based on theme
  const containerStyle: CSSProperties = {
    backgroundColor: menuTheme.backgroundColor,
    color: menuTheme.textColor,
    fontFamily: menuTheme.fontFamily
  };
  
  const headerContainerStyle: CSSProperties = {
    backgroundColor: menuTheme.headerColor
  };
  
  const categoryNameStyle: CSSProperties = {
    color: menuTheme.menuItemColor
  };
  
  const menuItemNameStyle: CSSProperties = {
    color: menuTheme.menuItemColor
  };
  
  const menuItemDescriptionStyle: CSSProperties = {
    color: menuTheme.menuDescriptionColor
  };
  
  const menuItemPriceStyle: CSSProperties = {
    color: menuTheme.menuPriceColor
  };

  return (
    <div 
      className="w-full max-w-2xl mx-auto rounded-xl overflow-hidden menu-preview-shadow"
      style={containerStyle}
    >
      <div ref={topRef} className="absolute top-0 left-0"></div>
      {/* Restaurant header with banner slideshow */}
      <div className="relative">
        <div className="h-40 bg-gray-300 relative">
          {restaurant.bannerUrls && Array.isArray(restaurant.bannerUrls) && restaurant.bannerUrls.length > 0 ? (
            <BannerSlideshow 
              bannerUrls={restaurant.bannerUrls as string[]} 
              restaurantName={restaurant.name}
              logoUrl={restaurant.logoUrl}
            />
          ) : restaurant.bannerUrl ? (
            <>
              {/* Fallback to legacy single banner image */}
              <ResponsiveImage 
                src={restaurant.bannerUrl}
                alt={`${restaurant.name} banner`}
                fallbackType="banner"
                className="w-full h-full"
                imgClassName="object-cover w-full h-full"
                onError={() => {
                  console.error("Failed to load banner image:", restaurant.bannerUrl);
                }}
              />
              
              {/* Restaurant logo overlay for single banner image */}
              {restaurant.logoUrl && (
                <div className="absolute top-4 right-4 z-20 w-16 h-16 md:w-20 md:h-20 bg-white rounded-full p-1 shadow-md">
                  <ResponsiveImage
                    src={restaurant.logoUrl}
                    alt={`${restaurant.name} logo`}
                    fallbackType="logo"
                    className="w-full h-full rounded-full overflow-hidden"
                    imgClassName="object-cover w-full h-full"
                    onError={() => {
                      console.error("Failed to load logo image:", restaurant.logoUrl);
                    }}
                  />
                </div>
              )}
            </>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        </div>
        <div className="absolute bottom-4 left-4 text-white">
          <h2 className="text-2xl font-heading font-bold">{restaurant.name}</h2>
          <p className="text-sm opacity-90">{restaurant.cuisine || "Restaurant Menu"}</p>
        </div>
      </div>
      
      {/* Fixed header section that appears when scrolling up */}
      <div 
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 shadow-md transition-all duration-300 ${
          headerFixed ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
        style={{ maxWidth: '42rem', margin: '0 auto' }}
      >
        <div className="p-3 flex justify-between items-center rounded-b-lg" style={{ backgroundColor: menuTheme.headerColor }}>
          <div className="flex items-center">
            {restaurant.logoUrl && (
              <div className="w-6 h-6 mr-2 rounded-full overflow-hidden">
                <ResponsiveImage
                  src={restaurant.logoUrl}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                  fallbackSrc={getFallbackImage('logo')}
                />
              </div>
            )}
            <div className="text-sm font-medium truncate max-w-[120px]">{restaurant.name}</div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors flex items-center space-x-1 ${
                activeMainCategory === 'Food'
                  ? 'text-white'
                  : 'bg-white hover:bg-gray-200'
              }`}
              style={{ 
                backgroundColor: activeMainCategory === 'Food' ? menuTheme.accentColor : 'white',
                color: activeMainCategory === 'Food' ? 'white' : menuTheme.menuItemColor
              }}
              onClick={() => handleMainCategoryClick('Food')}
            >
              <Utensils className="h-3 w-3 mr-1" />
              <span>{t('menu.food', 'Food')}</span>
            </button>
            <button
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors flex items-center space-x-1 ${
                activeMainCategory === 'Beverage'
                  ? 'text-white'
                  : 'bg-white hover:bg-gray-200'
              }`}
              style={{ 
                backgroundColor: activeMainCategory === 'Beverage' ? menuTheme.accentColor : 'white',
                color: activeMainCategory === 'Beverage' ? 'white' : menuTheme.menuItemColor
              }}
              onClick={() => handleMainCategoryClick('Beverage')}
            >
              <Coffee className="h-3 w-3 mr-1" />
              <span>{t('menu.beverage', 'Beverage')}</span>
            </button>
            <MenuLanguageSwitcher variant="outline" size="xs" />
          </div>
        </div>
      </div>
      
      {/* Main Category Filter (Food/Beverage) with Language Switcher */}
      <div className="p-3 flex justify-center items-center space-x-4" style={{ backgroundColor: menuTheme.headerColor }}>
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
            activeMainCategory === 'Food'
              ? 'text-white'
              : 'bg-white hover:bg-gray-200'
          }`}
          style={{ 
            backgroundColor: activeMainCategory === 'Food' ? menuTheme.accentColor : 'white',
            color: activeMainCategory === 'Food' ? 'white' : menuTheme.menuItemColor
          }}
          onClick={() => handleMainCategoryClick('Food')}
        >
          <Utensils className="h-4 w-4" />
          <span>{t('menu.food', 'Food')}</span>
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
            activeMainCategory === 'Beverage'
              ? 'text-white'
              : 'bg-white hover:bg-gray-200'
          }`}
          style={{ 
            backgroundColor: activeMainCategory === 'Beverage' ? menuTheme.accentColor : 'white',
            color: activeMainCategory === 'Beverage' ? 'white' : menuTheme.menuItemColor
          }}
          onClick={() => handleMainCategoryClick('Beverage')}
        >
          <Coffee className="h-4 w-4" />
          <span>{t('menu.beverage', 'Beverage')}</span>
        </button>
        
        {/* Language switcher moved next to beverage button */}
        <div className="flex-shrink-0">
          <MenuLanguageSwitcher variant="outline" size="sm" />
        </div>
      </div>
      
      {/* Menu Categories Tabs and Search */}
      <div className="border-b" style={headerContainerStyle}>
        <div className="flex justify-between items-center px-4">
          <div className="flex overflow-x-auto py-2 space-x-4 flex-grow">
            <button 
              className={`px-1 py-2 font-medium whitespace-nowrap ${
                activeCategory === "all" 
                  ? "border-b-2" 
                  : ""
              }`}
              style={{ 
                color: activeCategory === "all" ? menuTheme.accentColor : menuTheme.menuItemColor,
                borderColor: activeCategory === "all" ? menuTheme.accentColor : ""
              }}
              onClick={() => handleCategoryClick("all")}
            >
              {t('menu.all', 'All')}
            </button>
            
            {menuData.map((category) => (
              <button 
                key={category.id}
                className={`px-1 py-2 font-medium whitespace-nowrap ${
                  activeCategory === category.id.toString() 
                    ? "border-b-2" 
                    : ""
                }`}
                style={{ 
                  color: activeCategory === category.id.toString() ? menuTheme.accentColor : menuTheme.menuItemColor,
                  borderColor: activeCategory === category.id.toString() ? menuTheme.accentColor : ""
                }}
                onClick={() => handleCategoryClick(category.id.toString())}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Dietary Preferences removed as requested */}
      
      {/* Compact Search Component */}
      {allMenuItems.length > 0 && (
        <CompactSearch menuItems={allMenuItems} />
      )}
      
      {/* Menu Items */}
      <div className="p-4">
        {menuData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-midgray">{t('menu.noMenuItems', 'No menu items yet')}</p>
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
                <p className="text-sm italic" style={menuItemDescriptionStyle}>{t('menu.noItemsInCategory', 'No items in this category')}</p>
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
                          <ImageViewDialog 
                            imageSrc={normalizeImageUrl(item.imageUrl)} 
                            imageAlt={item.name}
                            description={item.description ? item.description : undefined}
                            menuItemId={item.id}
                            restaurantId={restaurant.id}
                          >
                            <div className="w-full h-24 sm:h-28 bg-neutral rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                              <ResponsiveImage 
                                src={item.imageUrl}
                                alt={item.name} 
                                fallbackType="menu"
                                className="w-full h-full"
                                imgClassName="object-cover w-full h-full"
                                onError={() => {
                                  console.error("Failed to load menu item image:", item.imageUrl);
                                }}
                              />
                            </div>
                          </ImageViewDialog>
                        </div>
                      ) : (
                        <div className="w-1/3 pr-4 relative">
                          <div className="w-full h-24 sm:h-28 bg-neutral dark:bg-gray-800 rounded-md flex items-center justify-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{t('menu.noImage', 'No image')}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Details on right side */}
                      <div className="flex-grow w-2/3">
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
                                      className="inline-block mr-1 mb-1 px-2 py-0.5 bg-neutral text-xs text-midgray"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              {/* Feedback button indicator - always visible */}
                              <div 
                                className="mt-2 text-xs flex items-center" 
                                style={{ color: menuTheme.accentColor }}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                <span>{t('menu.clickToLeaveFeedback', 'Click to leave feedback')}</span>
                              </div>
                            </div>
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
                style={{ color: menuTheme.accentColor }}
                className="hover:opacity-80 transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                style={{ color: menuTheme.accentColor }}
                className="hover:opacity-80 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                style={{ color: menuTheme.accentColor }}
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
          {t('menu.previewMode', 'Preview Mode')}
        </div>
      )}
      
      {/* Scroll to top/bottom buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        <button 
          onClick={scrollToTop}
          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors border border-gray-200"
          aria-label={t('menu.scrollToTop', 'Scroll to top')}
          title={t('menu.scrollToTop', 'Scroll to top')}
          style={{ color: menuTheme.accentColor }}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
        <button 
          onClick={scrollToBottom}
          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors border border-gray-200"
          aria-label={t('menu.scrollToBottom', 'Scroll to bottom')}
          title={t('menu.scrollToBottom', 'Scroll to bottom')}
          style={{ color: menuTheme.accentColor }}
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      </div>
      
      <div ref={bottomRef} className="mt-6 pb-24 text-center text-gray-400 text-xs">
        <p>{t('menu.endOfMenu', 'End of menu')}</p>
      </div>
      
      {/* Feedback button at the bottom right */}
      {mounted && restaurant && restaurant.id && (
        <FeedbackDialog
          restaurantId={restaurant.id}
          position="bottom-right"
          variant="default"
          size="default"
        />
      )}
    </div>
  );
};

export default CustomerMenuPreview;