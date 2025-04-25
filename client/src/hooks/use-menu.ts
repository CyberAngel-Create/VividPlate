import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { MenuCategory, MenuItem } from "@shared/schema";
import { useRestaurant } from "./use-restaurant";

export function useMenu() {
  const { activeRestaurant } = useRestaurant();
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  
  // Fetch categories for the active restaurant
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useQuery<MenuCategory[]>({
    queryKey: [activeRestaurant ? `/api/restaurants/${activeRestaurant.id}/categories` : null],
    enabled: !!activeRestaurant,
  });
  
  // Fetch menu items for each category
  useEffect(() => {
    if (categories.length > 0) {
      const fetchAllMenuItems = async () => {
        try {
          const allItems: MenuItem[] = [];
          
          for (const category of categories) {
            const items = await queryClient.fetchQuery({
              queryKey: [`/api/categories/${category.id}/items`]
            }) as MenuItem[];
            
            allItems.push(...items);
          }
          
          setAllMenuItems(allItems);
        } catch (error) {
          console.error("Error fetching menu items", error);
        }
      };
      
      fetchAllMenuItems();
    } else {
      setAllMenuItems([]);
    }
  }, [categories]);
  
  // Function to refresh all menu data
  const refreshMenuData = async () => {
    if (activeRestaurant) {
      await refetchCategories();
      // After refetching categories, the useEffect will handle fetching items
    }
  };
  
  return {
    categories,
    menuItems: allMenuItems,
    isLoading: isLoadingCategories || (categories.length > 0 && allMenuItems.length === 0),
    isError: isCategoriesError,
    refreshMenuData,
  };
}
