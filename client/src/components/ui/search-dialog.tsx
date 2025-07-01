import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from 'lucide-react';
import { MenuItem } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
              {formatCurrency(item.price, item.currency || "ETB")}
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

const SearchDialog = ({ open, onOpenChange, menuItems }: SearchDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<MenuItem[]>([]);
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Search Menu Items</DialogTitle>
            <DialogDescription>Find your favorite dishes easily</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
            <Input
              type="search"
              placeholder="Search by name, description or tags..."
              className="pl-10 py-6 text-base rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto mt-2">
            {searchResults.length === 0 ? (
              searchTerm ? (
                <p className="text-center text-gray-500 py-4">No menu items found</p>
              ) : (
                <p className="text-center text-gray-500 py-4">Start typing to search...</p>
              )
            ) : (
              <div className="space-y-3">
                {searchResults.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center p-3 hover:bg-gray-100 border border-gray-200 rounded-lg cursor-pointer transition-all transform hover:scale-[1.02]"
                    onClick={() => handleSelectItem(item)}
                  >
                    {item.imageUrl ? (
                      <div className="w-16 h-16 mr-4 rounded overflow-hidden flex-shrink-0 border border-gray-100">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 mr-4 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                        <span className="text-xs text-gray-500">No image</span>
                      </div>
                    )}
                    <div className="flex-grow min-w-0">
                      <h4 className="font-medium text-base truncate">{item.name}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-primary text-sm font-medium">
                          {formatCurrency(item.price, item.currency || "ETB")}
                        </span>
                        {item.tags && item.tags.length > 0 && (
                          <span className="text-xs text-gray-500 truncate">
                            {item.tags.slice(0, 2).join(', ')}
                            {item.tags.length > 2 && '...'}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {selectedItem && (
        <DetailedItemView 
          item={selectedItem} 
          onClose={handleCloseItemView} 
        />
      )}
    </>
  );
};

export default SearchDialog;