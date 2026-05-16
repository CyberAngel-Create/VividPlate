import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RestaurantOwnerLayout from "@/components/layout/RestaurantOwnerLayout";
import RestaurantProfileForm from "@/components/restaurant/RestaurantProfileForm";
import { Restaurant, InsertRestaurant } from "@shared/schema";
import { useRestaurant } from "@/hooks/use-restaurant";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import RestaurantLogoUpload from "@/components/upload/RestaurantLogoUpload";
import RestaurantBannerUpload from "@/components/upload/RestaurantBannerUpload";
import RestaurantThemeEditor from "@/components/restaurant/RestaurantThemeEditor";
import RestaurantFeedback from "@/components/feedback/RestaurantFeedback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RocketIcon } from "lucide-react";

const EditRestaurant = () => {
  const { toast } = useToast();
  const { 
    activeRestaurant, 
    isLoading: isLoadingRestaurant,
    refetchActiveRestaurant 
  } = useRestaurant();
  const { 
    subscriptionStatus, 
    isLoading: isLoadingSubscription,
    canCreateRestaurant,
    restaurantsRemaining
  } = useSubscriptionStatus();
  
  // Mutation to create/update restaurant
  const createRestaurantMutation = useMutation({
    mutationFn: async (restaurant: InsertRestaurant) => {
      const response = await apiRequest("POST", "/api/restaurants", restaurant);
      
      // Check if the response is not ok (e.g., we hit the restaurant limit)
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create restaurant");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      
      // After successful creation, show toast and navigate to edit page for the new restaurant
      toast({
        title: "Success",
        description: "Restaurant created successfully",
      });
      
      // Set a flag in session storage to indicate form should be reset
      sessionStorage.setItem("resetRestaurantForm", "true");
      
      // No need to reload the page, just refetch the restaurant list
      // This allows the form to stay open while updating data in the background
      queryClient.refetchQueries({ queryKey: ["/api/restaurants"] });
    },
    onError: (error) => {
      console.error("Restaurant creation error:", error);
      
      // Check if it's a limit error
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to create restaurant. Please try again.";
      
      const isLimitError = errorMessage.includes("limit");
      
      toast({
        title: isLimitError ? "Restaurant Limit Reached" : "Error",
        description: errorMessage,
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
      // Check if user can create a new restaurant
      if (!canCreateRestaurant) {
        toast({
          title: "Restaurant Limit Reached",
          description: "Each account can only manage one restaurant. Create a new owner account or contact support to add another.",
          variant: "destructive",
        });
        return;
      }
      
      // Create new restaurant
      await createRestaurantMutation.mutateAsync(restaurantData as InsertRestaurant);
    }
  };
  
  return (
    <RestaurantOwnerLayout>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-heading font-bold mb-6">
          {activeRestaurant ? "Restaurant Profile" : "Create Restaurant"}
        </h1>
        
        {!activeRestaurant && !isLoadingSubscription && subscriptionStatus && (
          <Alert className="mb-6 dark:bg-gray-700 dark:border-primary dark:text-white">
            <RocketIcon className="h-4 w-4" />
            <AlertTitle>Subscription Status: {subscriptionStatus.tier}</AlertTitle>
            <AlertDescription>
              You are using {subscriptionStatus.currentRestaurants} of {subscriptionStatus.maxRestaurants} restaurant.
              {!canCreateRestaurant && (
                <div className="mt-2 text-destructive dark:text-red-400">
                  Each account can only manage one restaurant. Create a separate owner account or contact support if you need an additional location.
                </div>
              )}
              {canCreateRestaurant && (
                <div className="mt-2 text-green-600 dark:text-green-400">
                  You can create {restaurantsRemaining} more restaurant{restaurantsRemaining !== 1 ? 's' : ''}.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
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
              canCreateRestaurant={canCreateRestaurant}
            />
          </div>
        )}
      </div>
    </RestaurantOwnerLayout>
  );
};

export default EditRestaurant;
