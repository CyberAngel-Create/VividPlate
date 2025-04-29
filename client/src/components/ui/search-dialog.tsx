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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold">{item.name}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {item.imageUrl && (
          <div className="w-full h-56 bg-neutral rounded-md overflow-hidden mb-4">
            <img 
              src={item.imageUrl} 
              alt={item.name} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="mb-4">
          <span className="text-primary font-medium text-lg">
            {formatCurrency(item.price)}
          </span>
        </div>
        
        {item.description && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-1">Description</h4>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        )}
        
        {item.tags && item.tags.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-1">Tags</h4>
            <div className="flex flex-wrap">
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
          </div>
        )}
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
                          {formatCurrency(item.price)}
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