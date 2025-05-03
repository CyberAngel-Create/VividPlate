import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TabNavigation from "@/components/layout/TabNavigation";
import RestaurantOwnerHeader from "@/components/layout/RestaurantOwnerHeader";
import RestaurantOwnerFooter from "@/components/layout/RestaurantOwnerFooter";
import MenuCategoriesList from "@/components/menu/MenuCategoriesList";
import MenuItemsList from "@/components/menu/MenuItemsList";
import { MenuCategory, MenuItem, InsertMenuCategory, InsertMenuItem } from "@shared/schema";
import { useRestaurant } from "@/hooks/use-restaurant";

const CreateMenu = () => {
  const { toast } = useToast();
  const { activeRestaurant } = useRestaurant();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  
  // Query for menu categories
  const { 
    data: categories = [],
    isLoading: isLoadingCategories
  } = useQuery({
    queryKey: [activeRestaurant ? `/api/restaurants/${activeRestaurant.id}/categories` : null],
    enabled: !!activeRestaurant,
  });
  
  // Query for menu items in the selected category
  const {
    data: menuItems = [],
    isLoading: isLoadingItems
  } = useQuery({
    queryKey: [selectedCategoryId ? `/api/categories/${selectedCategoryId}/items` : null],
    enabled: !!selectedCategoryId,
  });
  
  // Get selected category
  const selectedCategory = selectedCategoryId 
    ? categories.find((c: MenuCategory) => c.id === selectedCategoryId) || null
    : null;
  
  // Create menu item counts map
  const [menuItemCounts, setMenuItemCounts] = useState<Record<number, number>>({});
  
  useEffect(() => {
    if (categories.length > 0) {
      // If there are categories but none selected, select the first one
      if (!selectedCategoryId && categories.length > 0) {
        setSelectedCategoryId(categories[0].id);
      }
      
      // Create a map of category ID to item count
      const fetchCategoryCounts = async () => {
        const counts: Record<number, number> = {};
        
        for (const category of categories) {
          try {
            const items = await queryClient.fetchQuery({
              queryKey: [`/api/categories/${category.id}/items`],
            }) as MenuItem[];
            counts[category.id] = items.length;
          } catch (error) {
            counts[category.id] = 0;
          }
        }
        
        setMenuItemCounts(counts);
      };
      
      fetchCategoryCounts();
    }
  }, [categories, selectedCategoryId]);
  
  // Mutations
  const addCategoryMutation = useMutation({
    mutationFn: async (newCategory: Omit<InsertMenuCategory, "restaurantId">) => {
      if (!activeRestaurant) {
        throw new Error("No active restaurant");
      }
      
      return apiRequest("POST", `/api/restaurants/${activeRestaurant.id}/categories`, {
        ...newCategory,
        restaurantId: activeRestaurant.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${activeRestaurant?.id}/categories`] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    }
  });
  
  const addItemMutation = useMutation({
    mutationFn: async (newItem: Omit<InsertMenuItem, "categoryId">) => {
      if (!selectedCategoryId) {
        throw new Error("No category selected");
      }
      
      return apiRequest("POST", `/api/categories/${selectedCategoryId}/items`, {
        ...newItem,
        categoryId: selectedCategoryId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${selectedCategoryId}/items`] });
      // Also invalidate the restaurant stats to update menu item count
      if (activeRestaurant) {
        queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${activeRestaurant.id}/stats`] });
      }
      toast({
        title: "Success",
        description: "Menu item added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add menu item",
        variant: "destructive",
      });
    }
  });
  
  const editItemMutation = useMutation({
    mutationFn: async ({ id, item }: { id: number; item: Partial<MenuItem> }) => {
      return apiRequest("PATCH", `/api/items/${id}`, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${selectedCategoryId}/items`] });
      toast({
        title: "Success",
        description: "Menu item updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update menu item",
        variant: "destructive",
      });
    }
  });
  
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${selectedCategoryId}/items`] });
      // Also invalidate the restaurant stats to update menu item count
      if (activeRestaurant) {
        queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${activeRestaurant.id}/stats`] });
      }
      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    }
  });
  
  // Handlers
  const handleAddCategory = async (category: Omit<MenuCategory, "id">) => {
    await addCategoryMutation.mutateAsync(category);
  };
  
  const handleSelectCategory = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
  };
  
  const handleAddItem = async (item: Omit<MenuItem, "id">) => {
    await addItemMutation.mutateAsync(item);
  };
  
  const handleEditItem = async (id: number, item: Partial<MenuItem>) => {
    await editItemMutation.mutateAsync({ id, item });
  };
  
  const handleDeleteItem = async (id: number) => {
    await deleteItemMutation.mutateAsync(id);
  };
  
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  if (!activeRestaurant) {
    return (
      <div className="flex flex-col min-h-screen">
        <RestaurantOwnerHeader onLogout={handleLogout} />
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-heading font-bold mb-6">Create Menu</h1>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-lg mb-4">You haven't created a restaurant yet.</p>
            <p className="mb-6">Create your restaurant profile first before adding menu items.</p>
            <button 
              onClick={() => window.location.href = "/edit-restaurant"}
              className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
            >
              Create Restaurant
            </button>
          </div>
        </div>
        <RestaurantOwnerFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <RestaurantOwnerHeader onLogout={handleLogout} />
      <TabNavigation />
      
      <section className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-heading font-bold mb-6">Create Your Menu</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <MenuCategoriesList 
              categories={categories}
              menuItemCounts={menuItemCounts}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
              onAddCategory={handleAddCategory}
            />
          </div>
          
          <div className="lg:col-span-3">
            <MenuItemsList 
              category={selectedCategory}
              items={menuItems}
              onAddItem={handleAddItem}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
            />
          </div>
        </div>
      </section>
      
      <RestaurantOwnerFooter />
    </div>
  );
};

export default CreateMenu;
