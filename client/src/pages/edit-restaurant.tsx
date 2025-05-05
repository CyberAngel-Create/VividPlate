import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TabNavigation from "@/components/layout/TabNavigation";
import RestaurantOwnerHeader from "@/components/layout/RestaurantOwnerHeader";
import RestaurantOwnerFooter from "@/components/layout/RestaurantOwnerFooter";
import RestaurantProfileForm from "@/components/restaurant/RestaurantProfileForm";
import { Restaurant, InsertRestaurant } from "@shared/schema";
import { useRestaurant } from "@/hooks/use-restaurant";
import RestaurantLogoUpload from "@/components/upload/RestaurantLogoUpload";
import RestaurantBannerUpload from "@/components/upload/RestaurantBannerUpload";
import RestaurantThemeEditor from "@/components/restaurant/RestaurantThemeEditor";
import RestaurantFeedback from "@/components/feedback/RestaurantFeedback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EditRestaurant = () => {
  const { toast } = useToast();
  const { 
    activeRestaurant, 
    isLoading: isLoadingRestaurant,
    refetchActiveRestaurant 
  } = useRestaurant();
  
  // Mutation to create/update restaurant
  const createRestaurantMutation = useMutation({
    mutationFn: async (restaurant: InsertRestaurant) => {
      return apiRequest("POST", "/api/restaurants", restaurant);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      refetchActiveRestaurant();
      toast({
        title: "Success",
        description: "Restaurant created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create restaurant",
        variant: "destructive",
      });
    }
  });
  
  const updateRestaurantMutation = useMutation({
    mutationFn: async ({ id, restaurant }: { id: number; restaurant: Partial<Restaurant> }) => {
      return apiRequest("PATCH", `/api/restaurants/${id}`, restaurant);
    },
    onSuccess: () => {
      if (activeRestaurant) {
        queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
        queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${activeRestaurant.id}`] });
        refetchActiveRestaurant();
      }
      toast({
        title: "Success",
        description: "Restaurant updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update restaurant",
        variant: "destructive",
      });
    }
  });
  
  // Handlers
  const handleSubmit = async (restaurantData: Partial<Restaurant>) => {
    if (activeRestaurant) {
      // Update existing restaurant
      await updateRestaurantMutation.mutateAsync({
        id: activeRestaurant.id,
        restaurant: restaurantData
      });
    } else {
      // Create new restaurant
      await createRestaurantMutation.mutateAsync(restaurantData as InsertRestaurant);
    }
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
  
  return (
    <div className="flex flex-col min-h-screen">
      <RestaurantOwnerHeader onLogout={handleLogout} />
      {activeRestaurant && <TabNavigation />}
      
      {/* Main content with padding for fixed header */}
      <div className="pt-16 flex-grow">
        <section className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-heading font-bold mb-6">
            {activeRestaurant ? "Restaurant Profile" : "Create Restaurant"}
          </h1>
          
          {isLoadingRestaurant ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : activeRestaurant ? (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="logo">Logo</TabsTrigger>
                <TabsTrigger value="banner">Banner</TabsTrigger>
                <TabsTrigger value="theme">Theme</TabsTrigger>
                <TabsTrigger value="feedback">Customer Feedback</TabsTrigger>
              </TabsList>
              <TabsContent value="profile">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 dark:border dark:border-gray-700">
                  <RestaurantProfileForm 
                    restaurant={activeRestaurant}
                    onSubmit={handleSubmit}
                  />
                </div>
              </TabsContent>
              <TabsContent value="logo">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 dark:border dark:border-gray-700">
                  <RestaurantLogoUpload
                    restaurantId={activeRestaurant.id}
                    currentLogoUrl={activeRestaurant.logoUrl || undefined}
                    onSuccess={() => {
                      refetchActiveRestaurant();
                    }}
                  />
                </div>
              </TabsContent>
              <TabsContent value="banner">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 dark:border dark:border-gray-700">
                  <RestaurantBannerUpload
                    restaurantId={activeRestaurant.id}
                    currentBannerUrl={activeRestaurant.bannerUrl || undefined}
                    currentBannerUrls={activeRestaurant.bannerUrls as string[] || undefined}
                    onSuccess={(bannerUrl, bannerUrls) => {
                      console.log("Banner upload success:", { bannerUrl, bannerUrls });
                      refetchActiveRestaurant();
                    }}
                  />
                </div>
              </TabsContent>
              <TabsContent value="theme">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 dark:border dark:border-gray-700">
                  <RestaurantThemeEditor
                    restaurantId={activeRestaurant.id}
                    initialTheme={activeRestaurant.themeSettings as Record<string, any>}
                    onSuccess={() => {
                      refetchActiveRestaurant();
                    }}
                  />
                </div>
              </TabsContent>
              <TabsContent value="feedback">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 dark:border dark:border-gray-700">
                  <RestaurantFeedback restaurantId={activeRestaurant.id} isOwner={true} />
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 dark:border dark:border-gray-700">
              <RestaurantProfileForm 
                restaurant={undefined}
                onSubmit={handleSubmit}
              />
            </div>
          )}
        </section>
      </div>
      
      <RestaurantOwnerFooter />
    </div>
  );
};

export default EditRestaurant;
