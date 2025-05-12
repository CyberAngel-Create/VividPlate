import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { MenuCategory, MenuItem } from "@shared/schema";
import { useRestaurant } from "./use-restaurant";

export function useMenu() {
  const { activeRestaurant } = useRestaurant();
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  
  // This key helps ensure each restaurant's menu data is cached separately
  const menuDataKey = activeRestaurant ? `/api/restaurants/${activeRestaurant.id}/categories` : null;
  
  // Fetch categories for the active restaurant
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useQuery<MenuCategory[]>({
    queryKey: [menuDataKey],
    enabled: !!activeRestaurant,
    staleTime: 10000, // Cache valid for 10 seconds to avoid excessive refetching
  });
  
  // Clear menu items when restaurant changes to avoid showing previous restaurant's items
  useEffect(() => {
    setAllMenuItems([]);
  }, [activeRestaurant?.id]);
  
  // Fetch menu items for each category
  useEffect(() => {
    if (categories.length > 0 && activeRestaurant) {
      const fetchAllMenuItems = async () => {
        try {
          const allItems: MenuItem[] = [];
          
          for (const category of categories) {
            // Make sure we're getting items for the current restaurant's categories
            if (category.restaurantId === activeRestaurant.id) {
              const items = await queryClient.fetchQuery({
                queryKey: [`/api/categories/${category.id}/items`]
              }) as MenuItem[];
              
              allItems.push(...items);
            }
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
  }, [categories, activeRestaurant]);
  
  // Function to refresh all menu data
  const refreshMenuData = useCallback(async () => {
    if (activeRestaurant) {
      await refetchCategories();
      // After refetching categories, the useEffect will handle fetching items
    }
  }, [activeRestaurant, refetchCategories]);
  
  return {
    categories: categories.filter(category => activeRestaurant && category.restaurantId === activeRestaurant.id),
    menuItems: allMenuItems,
    isLoading: isLoadingCategories || (categories.length > 0 && allMenuItems.length === 0),
    isError: isCategoriesError,
    refreshMenuData,
    restaurantId: activeRestaurant?.id
  };
}
