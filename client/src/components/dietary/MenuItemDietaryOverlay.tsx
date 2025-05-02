import { useState, useEffect } from "react";
import { useDietaryPreferences } from "@/hooks/use-dietary-preferences";
import { MenuItem } from "@shared/schema";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Flame, Leaf, AlertTriangle, Award, ThumbsUp } from "lucide-react";

interface MenuItemDietaryOverlayProps {
  item: MenuItem;
  className?: string;
}

export default function MenuItemDietaryOverlay({ 
  item, 
  className = "" 
}: MenuItemDietaryOverlayProps) {
  const { preferences, sessionId } = useDietaryPreferences();
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [allergyWarning, setAllergyWarning] = useState<boolean>(false);

  useEffect(() => {
    if (!preferences || !item) return;

    // Check for allergies
    if (preferences.allergies && preferences.allergies.length > 0 && item.allergens) {
      const hasAllergens = preferences.allergies.some(allergy => 
        item.allergens?.includes(allergy)
      );
      setAllergyWarning(hasAllergens);
    } else {
      setAllergyWarning(false);
    }

    // Calculate match score
    let score = 0;
    
    // Score based on dietary preferences
    if (preferences.preferences && item.dietaryInfo) {
      const dietaryInfo = item.dietaryInfo as Record<string, boolean>;
      
      for (const [key, value] of Object.entries(preferences.preferences)) {
        if (value && dietaryInfo[key]) {
          score += 20;
        }
      }
    }
    
    // Score based on calorie goals
    if (preferences.calorieGoal && item.calories) {
      // Higher score for items closer to calorie goal
      const calorieScore = 10 - Math.min(10, Math.abs(preferences.calorieGoal - item.calories) / 100);
      score += calorieScore;
    }
    
    setMatchScore(score);
  }, [preferences, item]);

  if (!preferences || !sessionId) return null;

  const getMatchBadge = () => {
    if (allergyWarning) {
      return (
        <Badge variant="destructive" className="absolute top-2 right-2 flex items-center gap-1 z-10">
          <AlertTriangle className="h-3 w-3" />
          Allergy Alert
        </Badge>
      );
    }
    
    if (matchScore !== null) {
      if (matchScore >= 50) {
        return (
          <Badge variant="default" className="absolute top-2 right-2 flex items-center gap-1 z-10 bg-green-600">
            <Award className="h-3 w-3" />
            Great Match
          </Badge>
        );
      } else if (matchScore >= 20) {
        return (
          <Badge variant="secondary" className="absolute top-2 right-2 flex items-center gap-1 z-10">
            <ThumbsUp className="h-3 w-3" />
            Good Match
          </Badge>
        );
      }
    }
    
    return null;
  };

  // Create a recommendation tooltip content
  const getRecommendationDetails = () => {
    const details = [];
    
    // Add allergy warnings
    if (allergyWarning) {
      return (
        <div className="space-y-2">
          <div className="font-medium text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            <span>Contains allergens you want to avoid!</span>
          </div>
          {item.allergens && preferences.allergies && (
            <div className="text-sm">
              <span className="font-medium">Allergens: </span>
              {item.allergens
                .filter(a => preferences.allergies?.includes(a))
                .join(", ")}
            </div>
          )}
        </div>
      );
    }
    
    // Add dietary matches
    if (item.dietaryInfo && preferences.preferences) {
      const dietaryInfo = item.dietaryInfo as Record<string, boolean>;
      const matches = Object.entries(preferences.preferences)
        .filter(([key, value]) => value && dietaryInfo[key])
        .map(([key]) => key);
      
      if (matches.length > 0) {
        details.push(
          <div key="dietary" className="text-sm">
            <span className="font-medium">Matches your preferences: </span>
            {matches.join(", ")}
          </div>
        );
      }
    }
    
    // Add calorie information
    if (item.calories && preferences.calorieGoal) {
      const caloriePercent = Math.round((item.calories / preferences.calorieGoal) * 100);
      details.push(
        <div key="calories" className="text-sm flex items-center gap-1">
          <Flame className="h-4 w-4 text-orange-500" />
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
    <div className={`relative ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {getMatchBadge()}
          </TooltipTrigger>
          <TooltipContent side="left" align="start" className="w-64">
            {getRecommendationDetails()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}