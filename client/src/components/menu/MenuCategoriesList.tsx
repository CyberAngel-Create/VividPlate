import { MenuCategory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import CategoryForm from "./CategoryForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface MenuCategoriesListProps {
  categories: MenuCategory[];
  menuItemCounts: Record<number, number>;
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number) => void;
  onAddCategory: (category: Omit<MenuCategory, "id">) => Promise<void>;
}

const MenuCategoriesList = ({
  categories,
  menuItemCounts,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
}: MenuCategoriesListProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleCategorySubmit = async (category: Omit<MenuCategory, "id">) => {
    await onAddCategory(category);
    setIsDialogOpen(false);
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
              <button
                className={`flex justify-between items-center p-2 rounded w-full text-left ${
                  selectedCategoryId === category.id
                    ? 'bg-primary bg-opacity-10'
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
                    ? 'bg-primary bg-opacity-20 text-primary'
                    : 'bg-neutral text-midgray'
                }`}>
                  {menuItemCounts[category.id] || 0}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            className="w-full bg-secondary hover:bg-secondary/90 text-white flex items-center justify-center"
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add Category
          </Button>
        </DialogTrigger>
        <DialogContent>
          <CategoryForm onSubmit={handleCategorySubmit} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuCategoriesList;
