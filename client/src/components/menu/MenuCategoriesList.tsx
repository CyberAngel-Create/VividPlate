import { MenuCategory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import CategoryForm from "./CategoryForm";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

interface MenuCategoriesListProps {
  categories: MenuCategory[];
  menuItemCounts: Record<number, number>;
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number) => void;
  onAddCategory: (category: Omit<MenuCategory, "id">) => Promise<void>;
  onEditCategory?: (id: number, category: Partial<MenuCategory>) => Promise<void>;
  onDeleteCategory?: (id: number) => Promise<void>;
}

const MenuCategoriesList = ({
  categories,
  menuItemCounts,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: MenuCategoriesListProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<MenuCategory | null>(null);
  
  const handleAddCategory = async (category: Omit<MenuCategory, "id">) => {
    await onAddCategory(category);
    setIsAddDialogOpen(false);
  };
  
  const handleEditCategory = async (data: Omit<MenuCategory, "id">) => {
    if (editingCategory && onEditCategory) {
      await onEditCategory(editingCategory.id, data);
      setEditingCategory(null);
      setIsEditDialogOpen(false);
    }
  };
  
  const openEditDialog = (category: MenuCategory) => {
    setEditingCategory(category);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteCategory = async () => {
    if (deletingCategory && onDeleteCategory) {
      await onDeleteCategory(deletingCategory.id);
      setDeletingCategory(null);
      setIsDeleteDialogOpen(false);
    }
  };
  
  const openDeleteDialog = (category: MenuCategory) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
      <h2 className="font-heading font-semibold mb-4 pb-2 border-b">Menu Categories</h2>
      
      {categories.length === 0 ? (
        <div className="text-center py-4 mb-4">
          <p className="text-midgray mb-2">No categories yet</p>
          <p className="text-sm text-midgray">Add your first category to get started</p>
        </div>
      ) : (
        <ul className="space-y-2 mb-4">
          {categories.map((category) => (
            <li key={category.id}>
              <div className="flex items-center">
                <button
                  className={`flex-1 flex justify-between items-center p-2 rounded text-left ${
                    selectedCategoryId === category.id
                      ? 'bg-primary/15'
                      : 'hover:bg-neutral group'
                  }`}
                  onClick={() => onSelectCategory(category.id)}
                >
                  <span className={`${
                    selectedCategoryId === category.id
                      ? 'text-primary font-medium'
                      : 'text-dark group-hover:text-primary transition-colors'
                  }`}>
                    {category.name}
                  </span>
                  <Badge className={`${
                    selectedCategoryId === category.id
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'bg-neutral text-midgray'
                  }`}>
                    {menuItemCounts[category.id] || 0}
                  </Badge>
                </button>
                
                {onEditCategory && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 p-0 h-8 w-8 text-secondary hover:text-secondary/80 hover:bg-secondary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(category);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                )}
                
                {onDeleteCategory && menuItemCounts[category.id] === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteDialog(category);
                    }}
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            className="w-full bg-secondary hover:bg-secondary/90 text-white flex items-center justify-center"
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add Category
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Menu Category</DialogTitle>
            <DialogDescription>
              Create a new category to organize your menu items
            </DialogDescription>
          </DialogHeader>
          <CategoryForm onSubmit={handleAddCategory} />
        </DialogContent>
      </Dialog>
      
      {/* Edit Category Dialog */}
      {editingCategory && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Make changes to the "{editingCategory.name}" category
              </DialogDescription>
            </DialogHeader>
            <CategoryForm 
              category={editingCategory} 
              onSubmit={handleEditCategory} 
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{deletingCategory?.name}".
              {menuItemCounts[deletingCategory?.id || 0] > 0 && (
                <span className="block text-destructive font-medium mt-2">
                  This category contains {menuItemCounts[deletingCategory?.id || 0]} menu items that will also be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteCategory}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MenuCategoriesList;
