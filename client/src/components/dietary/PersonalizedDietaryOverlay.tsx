import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useDietaryPreferences } from "@/hooks/use-dietary-preferences";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DietaryPreferencesForm from "./DietaryPreferencesForm";
import { MenuItem } from "@shared/schema";
import { Filter, Award, ThumbsUp, Heart, AlertTriangle, Leaf, Pizza, Flame } from "lucide-react";

// Recommendation type based on backend API
interface Recommendation {
  item: MenuItem;
  score: number;
  match: boolean;
}

interface PersonalizedDietaryOverlayProps {
  restaurantId: number;
  menuItems: MenuItem[];
}

export default function PersonalizedDietaryOverlay({
  restaurantId,
  menuItems
}: PersonalizedDietaryOverlayProps) {
  const [showPreferencesForm, setShowPreferencesForm] = useState(false);
  const [highlightedItems, setHighlightedItems] = useState<Set<number>>(new Set());
  const [personalizedActive, setPersonalizedActive] = useState(false);
  const { preferences, sessionId } = useDietaryPreferences();

  // Get recommendations for this restaurant based on preferences
  const {
    data: recommendations,
    isLoading,
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

  // Split recommendations into matches and allergen warnings
  useEffect(() => {
    if (recommendations && personalizedActive) {
      const matchingItems = new Set<number>();
      
      recommendations.forEach(rec => {
        // For items with high scores or marked as matches
        if (rec.match || rec.score > 0) {
          matchingItems.add(rec.item.id);
        }
      });
      
      setHighlightedItems(matchingItems);
    } else {
      setHighlightedItems(new Set());
    }
  }, [recommendations, personalizedActive]);

  // Re-fetch recommendations when preferences change
  useEffect(() => {
    if (preferences) {
      refetch();
    }
  }, [preferences, refetch]);

  // Toggles the personalized view on/off
  const togglePersonalizedView = () => {
    if (!preferences) {
      setShowPreferencesForm(true);
    } else {
      setPersonalizedActive(!personalizedActive);
    }
  };

  // Calculates the match type for a menu item
  const getMatchType = (itemId: number): { type: 'match' | 'warning' | 'none', recommendation?: Recommendation } => {
    if (!recommendations || !personalizedActive) return { type: 'none' };
    
    const recommendation = recommendations.find(r => r.item.id === itemId);
    if (!recommendation) return { type: 'none' };
    
    // Check for allergens (negative scores)
    if (recommendation.score < 0) {
      return { type: 'warning', recommendation };
    }
    
    // Check for matches
    if (recommendation.match || recommendation.score > 0) {
      return { type: 'match', recommendation };
    }
    
    return { type: 'none' };
  };

  // Generate badge content based on the item's dietary info
  const getBadgeForItem = (item: MenuItem) => {
    const match = getMatchType(item.id);
    
    if (match.type === 'warning') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="absolute top-2 right-2 z-20 px-2 py-1 opacity-90">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span>Allergen Warning</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <div className="space-y-2">
                <div className="font-medium text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Contains allergens you want to avoid!</span>
                </div>
                {item.allergens && preferences?.allergies && (
                  <div className="text-sm">
                    <span className="font-medium">Allergens: </span>
                    {item.allergens
                      .filter(a => preferences.allergies?.includes(a))
                      .join(", ")}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    if (match.type === 'match') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="default" className="absolute top-2 right-2 z-20 px-2 py-1 opacity-90 bg-green-600 text-white">
                <ThumbsUp className="h-4 w-4 mr-1" />
                <span>Recommended</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <div className="space-y-2">
                <div className="font-medium text-green-600 flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  <span>Recommended for you!</span>
                </div>
                <RecommendationDetails item={item} />
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return null;
  };

  // Component to display detailed recommendation information
  const RecommendationDetails = ({ item }: { item: MenuItem }) => {
    const details = [];
    
    // Add dietary matches
    if (item.dietaryInfo && preferences?.preferences) {
      const dietaryInfo = item.dietaryInfo as Record<string, boolean>;
      const matches = Object.entries(preferences.preferences)
        .filter(([key, value]) => value && dietaryInfo[key])
        .map(([key]) => {
          switch(key) {
            case 'vegetarian': return 'Vegetarian';
            case 'vegan': return 'Vegan';
            case 'glutenFree': return 'Gluten-Free';
            case 'dairyFree': return 'Dairy-Free';
            case 'keto': return 'Keto';
            case 'paleo': return 'Paleo';
            case 'nutFree': return 'Nut-Free';
            case 'lowCarb': return 'Low-Carb';
            default: return key;
          }
        });
      
      if (matches.length > 0) {
        details.push(
          <div key="dietary" className="text-sm flex items-center gap-1">
            <Leaf className="h-4 w-4 text-green-500" />
            <span className="font-medium">Matches: </span>
            {matches.join(", ")}
          </div>
        );
      }
    }
    
    // Add calorie information
    if (item.calories && preferences?.calorieGoal) {
      const caloriePercent = Math.round((item.calories / preferences.calorieGoal) * 100);
      const withinRange = Math.abs(item.calories - preferences.calorieGoal) < preferences.calorieGoal * 0.2;
      
      details.push(
        <div key="calories" className="text-sm flex items-center gap-1">
          <Flame className={`h-4 w-4 ${withinRange ? 'text-green-500' : 'text-orange-500'}`} />
          <span>
            {item.calories} cal ({caloriePercent}% of your daily goal)
          </span>
        </div>
      );
    }
    
    if (details.length === 0) {
      return <span>No specific dietary information available</span>;
    }
    
    return <div className="space-y-2">{details}</div>;
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button 
          variant={personalizedActive ? "default" : "outline"} 
          size="sm" 
          onClick={togglePersonalizedView}
          className={`gap-2 ${personalizedActive ? 'bg-primary-600' : ''}`}
        >
          <Filter className="h-4 w-4" />
          <span>Personalized Menu</span>
        </Button>
      </div>
      
      {/* The badges will be rendered directly on menu items by their components */}
      
      {/* Dietary Preferences Form Dialog */}
      <Dialog open={showPreferencesForm} onOpenChange={setShowPreferencesForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dietary Preferences</DialogTitle>
            <DialogDescription>
              Set your dietary preferences to get personalized menu recommendations
            </DialogDescription>
          </DialogHeader>
          <DietaryPreferencesForm onClose={() => {
            setShowPreferencesForm(false);
            setPersonalizedActive(true);
          }} />
        </DialogContent>
      </Dialog>
      
      {/* Display a notification card when personalized view is active */}
      {personalizedActive && preferences && (
        <Card className="p-4 mb-4 bg-primary-50 dark:bg-gray-800 border-primary-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <ThumbsUp className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span>
              Showing personalized menu recommendations based on your dietary preferences.
              {' '}
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => setShowPreferencesForm(true)}
                className="p-0 h-auto"
              >
                Update preferences
              </Button>
            </span>
          </div>
        </Card>
      )}
    </>
  );
}