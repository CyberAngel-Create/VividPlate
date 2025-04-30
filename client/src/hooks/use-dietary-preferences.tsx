import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  QueryClient
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';

// Define the dietary preference types
export type DietaryPreferenceOption = 
  | 'vegetarian'
  | 'vegan'
  | 'glutenFree'
  | 'dairyFree'
  | 'nutFree'
  | 'lowCarb'
  | 'keto'
  | 'paleo'
  | 'pescatarian'
  | 'halal'
  | 'kosher';

export type AllergyOption =
  | 'gluten'
  | 'dairy'
  | 'nuts'
  | 'eggs'
  | 'soy'
  | 'fish'
  | 'shellfish'
  | 'peanuts';

export interface DietaryPreferences {
  userId?: number;
  sessionId?: string;
  preferences: Record<string, boolean>;
  allergies: string[];
  calorieGoal?: number;
}

export interface DietaryPreferenceState extends DietaryPreferences {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

type DietaryPreferencesContextType = {
  preferences: DietaryPreferenceState | null;
  isLoading: boolean;
  error: Error | null;
  saveMutation: any;
  resetPreferences: () => void;
  setPreference: (key: string, value: boolean) => void;
  toggleAllergy: (allergy: string) => void;
  setCalorieGoal: (calories: number | undefined) => void;
  sessionId: string | null;
};

const DietaryPreferencesContext = createContext<DietaryPreferencesContextType | null>(null);

export function DietaryPreferencesProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<DietaryPreferenceState | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Load the session ID from localStorage on mount
  useEffect(() => {
    let storedSessionId = localStorage.getItem('dietary_session_id');
    if (!storedSessionId) {
      storedSessionId = uuidv4();
      localStorage.setItem('dietary_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  // Query for preferences from the API
  const {
    data: preferencesData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['/api/dietary-preferences', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      try {
        const res = await apiRequest(
          'GET', 
          `/api/dietary-preferences?sessionId=${sessionId}`
        );
        const data = await res.json();
        return data;
      } catch (error) {
        if ((error as Error).message.includes('404')) {
          return null; // Not found is expected for new users
        }
        throw error;
      }
    },
    enabled: !!sessionId,
  });

  // Update local state when API data changes
  useEffect(() => {
    if (preferencesData) {
      setPreferences(preferencesData);
    }
  }, [preferencesData]);

  // Create/update preferences mutation
  const saveMutation = useMutation({
    mutationFn: async (data: DietaryPreferences) => {
      const res = await apiRequest('POST', '/api/dietary-preferences', {
        ...data,
        sessionId,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      // Save the session ID in localStorage if it's returned
      if (data.sessionId) {
        localStorage.setItem('dietary_session_id', data.sessionId);
        setSessionId(data.sessionId);
      }
      
      // Update the preferences in state
      if (data.preference) {
        setPreferences(data.preference);
      }
      
      // Invalidate the query cache
      queryClient.invalidateQueries({ queryKey: ['/api/dietary-preferences'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving preferences",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset preferences to defaults
  const resetPreferences = () => {
    setPreferences(null);
    saveMutation.mutate({
      preferences: {},
      allergies: [],
    });
  };

  // Set a specific preference
  const setPreference = (key: string, value: boolean) => {
    if (!preferences) {
      // Create new preferences if none exist
      saveMutation.mutate({
        preferences: { [key]: value },
        allergies: [],
      });
      return;
    }

    // Update existing preferences
    const updatedPreferences = {
      ...preferences,
      preferences: {
        ...preferences.preferences,
        [key]: value,
      },
    };
    setPreferences(updatedPreferences);
    saveMutation.mutate(updatedPreferences);
  };

  // Toggle an allergy on/off
  const toggleAllergy = (allergy: string) => {
    if (!preferences) {
      // Create new preferences if none exist
      saveMutation.mutate({
        preferences: {},
        allergies: [allergy],
      });
      return;
    }

    // Toggle the allergy in the existing preferences
    const allergies = preferences.allergies || [];
    const updatedAllergies = allergies.includes(allergy)
      ? allergies.filter(a => a !== allergy)
      : [...allergies, allergy];

    const updatedPreferences = {
      ...preferences,
      allergies: updatedAllergies,
    };
    
    setPreferences(updatedPreferences);
    saveMutation.mutate(updatedPreferences);
  };

  // Set calorie goal
  const setCalorieGoal = (calories: number | undefined) => {
    if (!preferences) {
      // Create new preferences if none exist
      saveMutation.mutate({
        preferences: {},
        allergies: [],
        calorieGoal: calories,
      });
      return;
    }

    // Update existing preferences with new calorie goal
    const updatedPreferences = {
      ...preferences,
      calorieGoal: calories,
    };
    
    setPreferences(updatedPreferences);
    saveMutation.mutate(updatedPreferences);
  };

  return (
    <DietaryPreferencesContext.Provider
      value={{
        preferences,
        isLoading,
        error,
        saveMutation,
        resetPreferences,
        setPreference,
        toggleAllergy,
        setCalorieGoal,
        sessionId,
      }}
    >
      {children}
    </DietaryPreferencesContext.Provider>
  );
}

export function useDietaryPreferences() {
  const context = useContext(DietaryPreferencesContext);
  if (!context) {
    throw new Error("useDietaryPreferences must be used within a DietaryPreferencesProvider");
  }
  return context;
}