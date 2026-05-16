import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  useDietaryPreferences, 
  DietaryPreferenceOption,
  AllergyOption
} from "@/hooks/use-dietary-preferences";

const dietaryOptions: { value: DietaryPreferenceOption; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "glutenFree", label: "Gluten-Free" },
  { value: "dairyFree", label: "Dairy-Free" },
  { value: "lowCarb", label: "Low Carb" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "nutFree", label: "Nut-Free" },
];

const allergyOptions: { value: AllergyOption; label: string }[] = [
  { value: "gluten", label: "Gluten" },
  { value: "dairy", label: "Dairy" },
  { value: "nuts", label: "Nuts" },
  { value: "eggs", label: "Eggs" },
  { value: "soy", label: "Soy" },
  { value: "fish", label: "Fish" },
  { value: "shellfish", label: "Shellfish" },
  { value: "peanuts", label: "Peanuts" },
];

export default function DietaryPreferencesForm({ 
  onClose 
}: { 
  onClose?: () => void 
}) {
  const { 
    preferences, 
    setPreference, 
    toggleAllergy, 
    setCalorieGoal,
    resetPreferences,
    isLoading
  } = useDietaryPreferences();
  
  const [calorieInput, setCalorieInput] = useState<string>(
    preferences?.calorieGoal ? preferences.calorieGoal.toString() : ''
  );

  const handleCalorieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCalorieInput(e.target.value);
  };

  const handleCalorieBlur = () => {
    if (calorieInput) {
      const calories = parseInt(calorieInput);
      if (!isNaN(calories) && calories > 0) {
        setCalorieGoal(calories);
      }
    } else {
      setCalorieGoal(undefined);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Dietary Preferences</CardTitle>
        <CardDescription>
          Let us know your dietary preferences so we can recommend the best menu items for you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preferences">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preferences">Diet Type</TabsTrigger>
            <TabsTrigger value="allergies">Allergies</TabsTrigger>
            <TabsTrigger value="calories">Calories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preferences" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              {dietaryOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`preference-${option.value}`}
                    checked={!!preferences?.preferences?.[option.value]}
                    onCheckedChange={(checked) => 
                      setPreference(option.value, checked === true)
                    }
                    disabled={isLoading}
                  />
                  <Label 
                    htmlFor={`preference-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="allergies" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              {allergyOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`allergy-${option.value}`}
                    checked={preferences?.allergies?.includes(option.value) || false}
                    onCheckedChange={() => toggleAllergy(option.value)}
                    disabled={isLoading}
                  />
                  <Label 
                    htmlFor={`allergy-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="calories" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="calorie-goal">Daily Calorie Goal</Label>
              <Input
                id="calorie-goal"
                type="number"
                placeholder="e.g. 2000"
                value={calorieInput}
                onChange={handleCalorieChange}
                onBlur={handleCalorieBlur}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Enter your daily calorie goal to get recommendations that fit your diet plan
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <Separator />
      <CardFooter className="flex justify-between pt-4">
        <Button variant="outline" onClick={resetPreferences} disabled={isLoading}>
          Reset
        </Button>
        <Button onClick={onClose} disabled={isLoading}>
          Save Preferences
        </Button>
      </CardFooter>
    </Card>
  );
}