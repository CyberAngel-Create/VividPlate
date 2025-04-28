import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TabNavigation from "@/components/layout/TabNavigation";
import RestaurantProfileForm from "@/components/restaurant/RestaurantProfileForm";
import { Restaurant, InsertRestaurant } from "@shared/schema";
import { useRestaurant } from "@/hooks/use-restaurant";
import RestaurantLogoUpload from "@/components/upload/RestaurantLogoUpload";
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
  
  return (
    <div className="flex flex-col min-h-screen">
      {activeRestaurant && <TabNavigation />}
      
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
              <TabsTrigger value="feedback">Customer Feedback</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <RestaurantProfileForm 
                  restaurant={activeRestaurant}
                  onSubmit={handleSubmit}
                />
              </div>
            </TabsContent>
            <TabsContent value="logo">
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <RestaurantLogoUpload
                  restaurantId={activeRestaurant.id}
                  currentLogoUrl={activeRestaurant.logoUrl || undefined}
                  onSuccess={() => {
                    refetchActiveRestaurant();
                  }}
                />
              </div>
            </TabsContent>
            <TabsContent value="feedback">
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <RestaurantFeedback restaurantId={activeRestaurant.id} />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <RestaurantProfileForm 
              restaurant={undefined}
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </section>
    </div>
  );
};

export default EditRestaurant;
