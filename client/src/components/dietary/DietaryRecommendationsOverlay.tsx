import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDietaryPreferences } from "@/hooks/use-dietary-preferences";
import DietaryPreferencesForm from "./DietaryPreferencesForm";
import { Utensils, Filter, Leaf, Pizza, Heart } from "lucide-react";

// Recommendation type based on backend API
interface Recommendation {
  item: {
    id: number;
    name: string;
    description: string | null;
    price: string;
    imageUrl: string | null;
    categoryId: number;
    dietaryInfo: Record<string, boolean> | null;
    allergens: string[] | null;
    calories: number | null;
  };
  score: number;
  match: boolean;
}

interface DietaryRecommendationsOverlayProps {
  restaurantId: number;
}

export default function DietaryRecommendationsOverlay({
  restaurantId,
}: DietaryRecommendationsOverlayProps) {
  const [showPreferencesForm, setShowPreferencesForm] = useState(false);
  const { preferences, sessionId } = useDietaryPreferences();

  // Get recommendations for this restaurant based on preferences
  const {
    data: recommendations,
    isLoading,
    isError,
    refetch,
  } = useQuery<Recommendation[]>({
    queryKey: ["/api/menu-recommendations", restaurantId, sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      try {
        const res = await apiRequest(
          "GET",
          `/api/menu-recommendations/${restaurantId}?sessionId=${sessionId}`
        );
        return await res.json();
      } catch (error) {
        if ((error as Error).message.includes("404")) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!sessionId && !!preferences,
  });

  // Split recommendations into matches and others
  const matches = recommendations?.filter((rec) => rec.match) || [];
  const otherOptions = recommendations?.filter((rec) => !rec.match) || [];

  // Re-fetch recommendations when preferences change
  useEffect(() => {
    if (preferences) {
      refetch();
    }
  }, [preferences, refetch]);

  function getBadges(item: Recommendation["item"]) {
    const badges = [];

    if (item.dietaryInfo) {
      if (item.dietaryInfo.vegetarian) {
        badges.push({ key: "vegetarian", label: "Vegetarian", icon: <Leaf className="mr-1 h-3 w-3" /> });
      }
      if (item.dietaryInfo.vegan) {
        badges.push({ key: "vegan", label: "Vegan", icon: <Leaf className="mr-1 h-3 w-3" /> });
      }
      if (item.dietaryInfo.glutenFree) {
        badges.push({ key: "glutenFree", label: "Gluten-Free", icon: <Pizza className="mr-1 h-3 w-3" /> });
      }
    }

    if (item.calories) {
      badges.push({ key: "calories", label: `${item.calories} cal`, icon: <Heart className="mr-1 h-3 w-3" /> });
    }

    return badges;
  }

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            <span>Dietary Recommendations</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Personalized Menu</SheetTitle>
            <SheetDescription>
              Menu recommendations based on your dietary preferences
            </SheetDescription>
          </SheetHeader>

          {!preferences ? (
            <div className="flex flex-col items-center justify-center h-[300px] space-y-4">
              <Utensils size={40} className="text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                No dietary preferences set yet. Set your preferences to get
                personalized recommendations.
              </p>
              <Button onClick={() => setShowPreferencesForm(true)}>
                Set Preferences
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-medium">Your Preferences:</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(preferences.preferences || {})
                      .filter(([_, value]) => value)
                      .map(([key]) => (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key}
                        </Badge>
                      ))}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPreferencesForm(true)}
                >
                  Edit
                </Button>
              </div>

              <Tabs defaultValue="matches">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="matches">
                    Best Matches ({matches.length})
                  </TabsTrigger>
                  <TabsTrigger value="all">
                    All Options ({otherOptions.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="matches" className="space-y-4 pt-4">
                  {isLoading ? (
                    <p className="text-center text-muted-foreground">Loading recommendations...</p>
                  ) : matches.length > 0 ? (
                    <div className="space-y-4">
                      {matches.map((rec) => (
                        <div 
                          key={rec.item.id}
                          className="border rounded-lg p-3 hover:bg-accent transition-colors"
                        >
                          <div className="flex justify-between">
                            <h3 className="font-medium">{rec.item.name}</h3>
                            <span className="text-muted-foreground">{rec.item.price}</span>
                          </div>
                          
                          {rec.item.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {rec.item.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {getBadges(rec.item).map((badge) => (
                              <Badge key={badge.key} variant="outline" className="flex items-center text-xs">
                                {badge.icon}
                                {badge.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      No matches found for your preferences.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="all" className="space-y-4 pt-4">
                  {isLoading ? (
                    <p className="text-center text-muted-foreground">Loading options...</p>
                  ) : otherOptions.length > 0 ? (
                    <div className="space-y-4">
                      {otherOptions
                        .filter(rec => rec.score >= -50) // Filter out strong non-matches
                        .map((rec) => (
                          <div 
                            key={rec.item.id}
                            className="border rounded-lg p-3 hover:bg-accent transition-colors"
                          >
                            <div className="flex justify-between">
                              <h3 className="font-medium">{rec.item.name}</h3>
                              <span className="text-muted-foreground">{rec.item.price}</span>
                            </div>
                            
                            {rec.item.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {rec.item.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-1 mt-2">
                              {getBadges(rec.item).map((badge) => (
                                <Badge key={badge.key} variant="outline" className="flex items-center text-xs">
                                  {badge.icon}
                                  {badge.label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      No other options available.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={showPreferencesForm} onOpenChange={setShowPreferencesForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dietary Preferences</DialogTitle>
            <DialogDescription>
              Set your dietary preferences to get personalized menu recommendations
            </DialogDescription>
          </DialogHeader>
          <DietaryPreferencesForm onClose={() => setShowPreferencesForm(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}