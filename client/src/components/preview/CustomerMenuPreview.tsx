import { Restaurant, MenuCategory, MenuItem } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Facebook, Instagram, Globe } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

interface CategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

interface CustomerMenuPreviewProps {
  restaurant: Restaurant;
  menuData: CategoryWithItems[];
  previewMode?: boolean;
}

const CustomerMenuPreview = ({ 
  restaurant, 
  menuData,
  previewMode = false
}: CustomerMenuPreviewProps) => {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  // Filter items based on selected category
  const filteredMenuData = activeCategory === "all" 
    ? menuData 
    : menuData.filter(category => category.id.toString() === activeCategory);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl overflow-hidden menu-preview-shadow">
      {/* Restaurant header */}
      <div className="relative">
        <div className="h-40 bg-gray-300 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        </div>
        <div className="absolute bottom-4 left-4 text-white">
          <h2 className="text-2xl font-heading font-bold">{restaurant.name}</h2>
          <p className="text-sm opacity-90">{restaurant.cuisine || "Restaurant Menu"}</p>
        </div>
      </div>
      
      {/* Menu Categories Tabs */}
      <div className="border-b">
        <div className="flex overflow-x-auto py-2 px-4 space-x-4">
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
                    <div key={item.id} className="flex flex-col sm:flex-row border-b pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                      {item.imageUrl && (
                        <div className="w-full h-36 sm:w-20 sm:h-20 bg-neutral rounded-md overflow-hidden mb-3 sm:mb-0 sm:mr-3 flex-shrink-0">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-grow">
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <h4 className="font-medium text-dark mb-1 sm:mb-0">{item.name}</h4>
                          <span className="text-primary font-medium mb-2 sm:mb-0">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                        <p className="text-sm text-midgray">
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
  );
};

export default CustomerMenuPreview;
