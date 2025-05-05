import React, { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, Plus, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MenuCategory } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";

interface CategoryManagementProps {
  restaurantId: number;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ restaurantId }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    displayOrder: 0,
  });

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<MenuCategory[]>({
    queryKey: ["/api/restaurants", restaurantId, "categories"],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${restaurantId}/categories`);
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (newCategory: any) => {
      const response = await apiRequest(
        "POST",
        `/api/restaurants/${restaurantId}/categories`,
        newCategory
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "categories"] });
      toast({
        title: t("Category Added"),
        description: t("The category has been added successfully"),
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: t("Failed to Add Category"),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (updatedCategory: any) => {
      if (!selectedCategory) return;
      const response = await apiRequest(
        "PUT",
        `/api/categories/${selectedCategory.id}`,
        updatedCategory
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "categories"] });
      toast({
        title: t("Category Updated"),
        description: t("The category has been updated successfully"),
      });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: t("Failed to Update Category"),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCategory) return;
      const response = await apiRequest(
        "DELETE",
        `/api/categories/${selectedCategory.id}`,
        {}
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "categories"] });
      toast({
        title: t("Category Deleted"),
        description: t("The category has been deleted successfully"),
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: t("Failed to Delete Category"),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });
  
  // Move category mutation
  const moveCategoryMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: number; direction: "up" | "down" }) => {
      const categoryToMove = categories.find(cat => cat.id === id);
      if (!categoryToMove) return;
      
      // Sort categories by display order to find adjacent categories
      const sortedCategories = [...categories].sort((a, b) => 
        (a.displayOrder || 0) - (b.displayOrder || 0)
      );
      const currentIndex = sortedCategories.findIndex(cat => cat.id === id);
      
      if (
        (direction === "up" && currentIndex <= 0) || 
        (direction === "down" && currentIndex >= sortedCategories.length - 1)
      ) {
        return; // Already at the top/bottom
      }
      
      const adjacentIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      const adjacentCategory = sortedCategories[adjacentIndex];
      
      // Swap display orders
      const newOrder = adjacentCategory.displayOrder || 0;
      const adjacentNewOrder = categoryToMove.displayOrder || 0;
      
      // Update the category's display order
      await apiRequest(
        "PUT",
        `/api/categories/${categoryToMove.id}`,
        { ...categoryToMove, displayOrder: newOrder }
      );
      
      // Update the adjacent category's display order
      return apiRequest(
        "PUT",
        `/api/categories/${adjacentCategory.id}`,
        { ...adjacentCategory, displayOrder: adjacentNewOrder }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "categories"] });
      toast({
        title: t("Category Order Updated"),
        description: t("The category order has been updated successfully"),
      });
    },
    onError: (error) => {
      toast({
        title: t("Failed to Update Order"),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCategoryForm((prev) => ({
      ...prev,
      [name]: name === "displayOrder" ? parseInt(value) || 0 : value,
    }));
  };

  const handleEditClick = (category: MenuCategory) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      displayOrder: category.displayOrder || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (category: MenuCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    addCategoryMutation.mutate({
      restaurantId,
      ...categoryForm,
    });
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    updateCategoryMutation.mutate(categoryForm);
  };

  const handleDeleteCategory = () => {
    deleteCategoryMutation.mutate();
  };

  const resetForm = () => {
    setCategoryForm({
      name: "",
      description: "",
      displayOrder: 0,
    });
    setSelectedCategory(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{t("Menu Categories")}</CardTitle>
          <CardDescription>
            {t("Manage your restaurant's menu categories")}
          </CardDescription>
        </div>
        <Button onClick={openAddDialog} className="space-x-1">
          <Plus className="h-4 w-4" />
          <span>{t("Add Category")}</span>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t("No categories found")}</p>
            <p>{t("Add a category to get started")}</p>
          </div>
        ) : (
          <Table className="dark:bg-gray-800 dark:border-gray-700">
            <TableHeader className="dark:bg-gray-800">
              <TableRow className="dark:border-gray-700">
                <TableHead className="dark:text-gray-300">{t("Name")}</TableHead>
                <TableHead className="hidden md:table-cell dark:text-gray-300">{t("Description")}</TableHead>
                <TableHead className="dark:text-gray-300">{t("Order")}</TableHead>
                <TableHead className="text-right dark:text-gray-300">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="dark:bg-gray-800">
              {categories.map((category) => (
                <TableRow key={category.id} className="dark:border-gray-700 dark:hover:bg-gray-700">
                  <TableCell className="font-medium dark:text-gray-200">{category.name}</TableCell>
                  <TableCell className="hidden md:table-cell dark:text-gray-300">
                    {category.description || t("No description")}
                  </TableCell>
                  <TableCell className="dark:text-gray-300">{category.displayOrder}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <div className="flex space-x-1 mr-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveCategoryMutation.mutate({ id: category.id, direction: "up" })}
                          disabled={moveCategoryMutation.isPending}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveCategoryMutation.mutate({ id: category.id, direction: "down" })}
                          disabled={moveCategoryMutation.isPending}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditClick(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add Category Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="dark:bg-gray-800 dark:text-gray-100">
            <DialogHeader>
              <DialogTitle>{t("Add New Category")}</DialogTitle>
              <DialogDescription>
                {t("Create a new menu category for your restaurant")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCategory}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">{t("Category Name")}</Label>
                  <Input
                    id="name"
                    name="name"
                    value={categoryForm.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">{t("Description (Optional)")}</Label>
                  <Input
                    id="description"
                    name="description"
                    value={categoryForm.description}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="displayOrder">{t("Display Order")}</Label>
                  <Input
                    id="displayOrder"
                    name="displayOrder"
                    type="number"
                    value={categoryForm.displayOrder}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  {t("Cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={addCategoryMutation.isPending || !categoryForm.name}
                >
                  {addCategoryMutation.isPending ? t("Adding...") : t("Add Category")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Edit Category")}</DialogTitle>
              <DialogDescription>
                {t("Update the details of this menu category")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateCategory}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">{t("Category Name")}</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={categoryForm.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">{t("Description (Optional)")}</Label>
                  <Input
                    id="edit-description"
                    name="description"
                    value={categoryForm.description}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-displayOrder">{t("Display Order")}</Label>
                  <Input
                    id="edit-displayOrder"
                    name="displayOrder"
                    type="number"
                    value={categoryForm.displayOrder}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  {t("Cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={updateCategoryMutation.isPending || !categoryForm.name}
                >
                  {updateCategoryMutation.isPending ? t("Updating...") : t("Update Category")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Category Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("Are you sure?")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  "This will permanently delete the category and all associated menu items. This action cannot be undone."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCategory}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteCategoryMutation.isPending}
              >
                {deleteCategoryMutation.isPending ? t("Deleting...") : t("Delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default CategoryManagement;