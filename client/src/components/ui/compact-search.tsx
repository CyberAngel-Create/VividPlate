import { useState, useEffect } from "react";
import { MenuItem } from "@shared/schema";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface CompactSearchProps {
  menuItems: MenuItem[];
}

interface DetailedItemViewProps {
  item: MenuItem;
  onClose: () => void;
}

const DetailedItemView = ({ item, onClose }: DetailedItemViewProps) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl animate-scaleIn" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Item header with close button */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold text-dark">{item.name}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-primary transition-colors rounded-full hover:bg-gray-100 p-1"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Item image (enlarged) */}
        {item.imageUrl && (
          <div className="w-full h-64 sm:h-72 overflow-hidden">
            <img 
              src={item.imageUrl} 
              alt={item.name} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Item details */}
        <div className="p-5">
          {/* Price */}
          <div className="mb-4 bg-gray-50 p-3 rounded-lg inline-block">
            <span className="text-primary font-semibold text-xl">
              {formatCurrency(item.price)}
            </span>
          </div>
          
          {/* Description */}
          {item.description && (
            <div className="mb-5">
              <h4 className="text-sm font-medium mb-2 text-dark">Description</h4>
              <p className="text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          )}
          
          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 text-dark">Tags</h4>
              <div className="flex flex-wrap">
                {item.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="inline-block mr-2 mb-2 px-3 py-1 bg-gray-50 text-sm border-gray-200"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CompactSearch: React.FC<CompactSearchProps> = ({ menuItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<MenuItem[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (searchTerm === '') {
      setSearchResults([]);
      return;
    }

    const results = menuItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );
    
    setSearchResults(results);
  }, [searchTerm, menuItems]);

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleCloseItemView = () => {
    setSelectedItem(null);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (searchTerm === '') {
      setIsSearchActive(false);
    }
  };

  return (
    <>
      <div className="px-4 py-2 border-t border-b bg-gray-50">
        {isSearchActive ? (
          <div className="relative flex items-center">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search items..."
              className="pl-8 pr-8 py-1 text-sm h-9 rounded-full border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        ) : (
          <button 
            className="flex items-center gap-2 text-gray-500 hover:text-primary text-sm w-full justify-center py-1"
            onClick={() => setIsSearchActive(true)}
          >
            <Search className="h-4 w-4" />
            <span>Search menu</span>
          </button>
        )}
        
        {searchTerm && searchResults.length > 0 && (
          <div className="mt-2 bg-white rounded-lg shadow-lg border max-h-[50vh] overflow-y-auto">
            <div className="p-2 space-y-2">
              {searchResults.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center p-2 hover:bg-gray-100 border border-gray-100 rounded-lg cursor-pointer"
                  onClick={() => handleSelectItem(item)}
                >
                  {item.imageUrl ? (
                    <div className="w-12 h-12 mr-3 rounded overflow-hidden flex-shrink-0 border border-gray-100">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 mr-3 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center">
                      <span className="text-xs text-gray-500">No img</span>
                    </div>
                  )}
                  <div className="flex-grow min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-primary text-xs font-medium">
                        {formatCurrency(item.price)}
                      </span>
                      {item.tags && item.tags.length > 0 && (
                        <span className="text-xs text-gray-500 truncate">
                          {item.tags.slice(0, 2).join(', ')}
                          {item.tags.length > 2 && '...'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedItem && (
        <DetailedItemView 
          item={selectedItem} 
          onClose={handleCloseItemView} 
        />
      )}
    </>
  );
};

export default CompactSearch;