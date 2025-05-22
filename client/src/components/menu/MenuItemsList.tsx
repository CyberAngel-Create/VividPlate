
import { useState, useEffect, useMemo } from "react";
import { MenuCategory, MenuItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger, 
  DialogTitle,
  DialogHeader,
  DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash, Search, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import MenuItemForm from "./MenuItemForm";
import { formatCurrency } from "@/lib/utils";
import { normalizeImageUrl, getFallbackImage } from "@/lib/imageUtils";
import ImageViewDialog from "@/components/ui/image-view-dialog";

interface MenuItemsListProps {
  category: MenuCategory | null;
  items: MenuItem[];
  selectedItemId?: number | null;
  onAddItem: (item: Omit<MenuItem, "id">) => Promise<void>;
  onEditItem: (id: number, item: Partial<MenuItem>) => Promise<void>;
  onDeleteItem: (id: number) => Promise<void>;
}

const MenuItemsList = ({
  category,
  items,
  selectedItemId,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: MenuItemsListProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-open the edit dialog if a specific item ID is passed
  useEffect(() => {
    if (selectedItemId && items.length > 0) {
      const itemToEdit = items.find(item => item.id === selectedItemId);
      if (itemToEdit) {
        setEditingItem(itemToEdit);
        setIsEditDialogOpen(true);
      }
    }
  }, [selectedItemId, items]);

  const handleAddItem = async (newItem: Omit<MenuItem, "id">) => {
    await onAddItem(newItem);
    setIsAddDialogOpen(false);
  };

  const handleEditItem = async (updatedItem: Partial<MenuItem>) => {
    if (editingItem) {
      await onEditItem(editingItem.id, updatedItem);
      setEditingItem(null);
      setIsEditDialogOpen(false);
    }
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingItem) {
      await onDeleteItem(deletingItem.id);
      setDeletingItem(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const openDeleteDialog = (item: MenuItem) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase().trim();
    return items.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(query);
      const descMatch = item.description?.toLowerCase().includes(query);
      const tagMatch = item.tags?.some(tag => tag.toLowerCase().includes(query));

      return nameMatch || descMatch || tagMatch;
    });
  }, [items, searchQuery]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h2 className="text-xl font-heading font-semibold dark:text-white">
          {category ? category.name : "Select a Category"}
        </h2>

        {category && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white flex items-center">
                <PlusCircle className="mr-1 h-4 w-4" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white">{category.name} - Add Menu Item</DialogTitle>
                <DialogDescription className="dark:text-gray-300">
                  Add a new item to the "{category.name}" category
                </DialogDescription>
              </DialogHeader>
              <MenuItemForm 
                categoryId={category.id} 
                onSubmit={handleAddItem} 
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search bar for menu items */}
      {category && items.length > 0 && (
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <Input
            type="search"
            placeholder="Search menu items by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </div>
      )}

      {!category ? (
        <div className="text-center py-12">
          <p className="text-midgray mb-2">No category selected</p>
          <p className="text-sm text-midgray">Select a category to manage menu items</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-midgray mb-2">No items in this category yet</p>
          <p className="text-sm text-midgray mb-4">Add your first menu item to get started</p>
          <Button 
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircle className="mr-1 h-4 w-4" /> Add First Item
          </Button>
        </div>
      ) : filteredItems.length === 0 && searchQuery.trim() !== "" ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-midgray mb-2">No matching items found</p>
          <p className="text-sm text-midgray mb-4">Try adjusting your search criteria</p>
          <Button 
            variant="outline"
            onClick={() => setSearchQuery("")}
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-32 h-32 bg-neutral dark:bg-gray-700 rounded-md overflow-hidden flex items-center justify-center">
                  {item.imageUrl ? (
                    <img 
                      src={normalizeImageUrl(item.imageUrl)} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Failed to load menu item image:", item.imageUrl);
                        e.currentTarget.src = getFallbackImage('menu');
                      }}
                    />
                  ) : (
                    <div className="text-midgray dark:text-gray-400 text-center">
                      <PlusCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No image</p>
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <h3 className="font-heading font-semibold dark:text-white">{item.name}</h3>
                    <div className="text-primary dark:text-primary-light font-semibold">{formatCurrency(item.price)}</div>
                  </div>
                  <p className="text-midgray dark:text-gray-300 text-sm mt-1 mb-3">
                    {item.description || "No description provided."}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.tags && item.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="bg-neutral text-xs text-midgray font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {(!item.tags || item.tags.length === 0) && (
                      <span className="text-xs text-midgray italic">No tags</span>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-secondary hover:text-secondary/80 hover:bg-secondary/10 flex items-center"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 flex items-center"
                      onClick={() => openDeleteDialog(item)}
                    >
                      <Trash className="mr-1 h-4 w-4" /> Delete
                    </Button>
                    <ImageViewDialog 
                      imageSrc={normalizeImageUrl(item.imageUrl)} 
                      imageAlt={item.name}
                      description={item.description}
                    >
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-secondary hover:text-secondary/80 hover:bg-secondary/10 flex items-center"
                      >
                        <Image className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </ImageViewDialog>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingItem && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Edit Menu Item</DialogTitle>
              <DialogDescription className="dark:text-gray-300">
                Make changes to your menu item below
              </DialogDescription>
            </DialogHeader>
            <MenuItemForm 
              categoryId={editingItem.categoryId} 
              item={editingItem}
              onSubmit={handleEditItem} 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-300">
              This will permanently delete the menu item "{deletingItem?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MenuItemsList;
