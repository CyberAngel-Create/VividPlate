import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Restaurant } from "@shared/schema";
import { X } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface RestaurantProfileFormProps {
  restaurant?: Restaurant;
  onSubmit: (data: Partial<Restaurant>) => Promise<void>;
  canCreateRestaurant?: boolean;
}

// Hours of operation type
type HoursOfOperation = {
  [day: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
};

const timeOptions = [
  "12:00 AM", "12:30 AM", "1:00 AM", "1:30 AM", "2:00 AM", "2:30 AM",
  "3:00 AM", "3:30 AM", "4:00 AM", "4:30 AM", "5:00 AM", "5:30 AM",
  "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM",
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
  "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM",
];

const cuisineOptions = [
  "Italian",
  "French",
  "American",
  "Mexican",
  "Chinese",
  "Japanese",
  "Thai",
  "Indian",
  "Mediterranean",
  "Middle Eastern",
  "Greek",
  "Spanish",
  "Korean",
  "Vietnamese",
  "Other",
];

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Create default hours
const defaultHours: HoursOfOperation = {};
daysOfWeek.forEach(day => {
  defaultHours[day] = {
    open: "11:00 AM",
    close: "10:00 PM",
    closed: false
  };
});

const restaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  description: z.string().optional(),
  cuisine: z.string().optional(),
  customCuisine: z.string().optional(),
  logoUrl: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  tagInput: z.string().optional(),
  alcoholStatus: z.enum(["alcoholic", "non-alcoholic"]).optional(),
});

type FormValues = z.infer<typeof restaurantSchema>;

const RestaurantProfileForm = ({ restaurant, onSubmit, canCreateRestaurant = true }: RestaurantProfileFormProps) => {
  const [tags, setTags] = useState<string[]>(restaurant?.tags || []);
  const [hours, setHours] = useState<HoursOfOperation>(
    restaurant?.hoursOfOperation as HoursOfOperation || defaultHours
  );
  const [showCustomCuisine, setShowCustomCuisine] = useState<boolean>(restaurant?.cuisine === "Other");
  // Use empty string as fallback for custom cuisine
  const [customCuisine, setCustomCuisine] = useState<string>("");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: restaurant?.name || "",
      description: restaurant?.description || "",
      cuisine: restaurant?.cuisine || "",
      customCuisine: "",
      logoUrl: restaurant?.logoUrl || "",
      phone: restaurant?.phone || "",
      email: restaurant?.email || "",
      address: restaurant?.address || "",
      tagInput: "",
      alcoholStatus: (restaurant as any)?.alcoholStatus || "non-alcoholic",
    },
  });
  
  // Check if form should be reset (for secondary restaurant creation)
  useEffect(() => {
    // Check if the resetRestaurantForm flag was set in session storage
    const shouldResetForm = sessionStorage.getItem("resetRestaurantForm");
    
    if (shouldResetForm === "true" && !restaurant) {
      console.log("Resetting restaurant form due to session storage flag");
      
      // Reset the form
      form.reset({
        name: "",
        description: "",
        cuisine: "",
        logoUrl: "",
        phone: "",
        email: "",
        address: "",
        tagInput: "",
      });
      
      // Reset other state
      setTags([]);
      setHours(defaultHours);
      
      // Clear the flag
      sessionStorage.removeItem("resetRestaurantForm");
    }
  }, [form, restaurant]);

  const addTag = () => {
    const tagInput = form.getValues("tagInput");
    if (tagInput && tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      form.setValue("tagInput", "");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const updateHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setHours({
      ...hours,
      [day]: {
        ...hours[day],
        [field]: value
      }
    });
  };

  const handleSubmit = async (data: FormValues) => {
    const { tagInput, customCuisine, ...rest } = data;
    
    try {
      // Prepare data to submit
      let finalData = {
        ...rest,
        tags,
        hoursOfOperation: hours,
      };
      
      // If "Other" cuisine is selected, use the custom cuisine value as the cuisine
      if (rest.cuisine === "Other" && customCuisine) {
        finalData = {
          ...finalData,
          cuisine: customCuisine,
        };
      }
      
      // Submit the form data
      await onSubmit(finalData);
      
      // Reset form if this is a new restaurant (creation mode)
      if (!restaurant) {
        console.log("Creating new restaurant - setting reset flag");
        
        // Set the reset flag for when the page reloads
        // This will be picked up by the useEffect hook to reset the form
        sessionStorage.setItem("resetRestaurantForm", "true");
        
        // Also perform immediate reset
        form.reset({
          name: "",
          description: "",
          cuisine: "",
          customCuisine: "",
          logoUrl: "",
          phone: "",
          email: "",
          address: "",
          tagInput: "",
        });
        setCustomCuisine("");
        setShowCustomCuisine(false);
        setTags([]);
        setHours(defaultHours);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      // The error will be handled by the mutation in the parent component
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Restaurant Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Bella Cucina" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="cuisine"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuisine Type</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    setShowCustomCuisine(value === "Other");
                    if (value !== "Other") {
                      setCustomCuisine("");
                      form.setValue("customCuisine", "");
                    }
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cuisine type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cuisineOptions.map((cuisine) => (
                      <SelectItem key={cuisine} value={cuisine}>
                        {cuisine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {showCustomCuisine && (
                  <div className="mt-2">
                    <FormField
                      control={form.control}
                      name="customCuisine"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Enter your cuisine type"
                              {...field}
                              value={customCuisine}
                              onChange={(e) => {
                                setCustomCuisine(e.target.value);
                                field.onChange(e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Please specify your restaurant's cuisine type
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="alcoholStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Restaurant Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select restaurant type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="non-alcoholic">Non-Alcoholic Restaurant</SelectItem>
                  <SelectItem value="alcoholic">Alcoholic Restaurant</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Specify whether your restaurant serves alcoholic beverages
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your restaurant..." 
                  {...field} 
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Restaurant Logo</FormLabel>
              <div className="flex items-center">
                <Avatar className="w-24 h-24 rounded-lg border bg-neutral mr-4 flex-shrink-0">
                  {field.value ? (
                    <AvatarImage 
                      src={field.value} 
                      alt="Restaurant logo" 
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {getInitials(form.getValues("name"))}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/logo.jpg" 
                      {...field} 
                      className="mb-2"
                    />
                  </FormControl>
                  <FormDescription>
                    Recommended size: 500x500px, JPG or PNG
                  </FormDescription>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <FormLabel>Tags</FormLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center">
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {tags.length === 0 && (
              <span className="text-sm text-midgray italic">No tags added</span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <FormField
              control={form.control}
              name="tagInput"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input 
                      placeholder="e.g. Fine Dining, Family-Friendly" 
                      {...field} 
                      onKeyDown={handleKeyDown}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={addTag}
            >
              Add
            </Button>
          </div>
        </div>
        
        <h2 className="text-lg font-heading font-semibold mt-8 mb-4">Contact Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. (555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. info@restaurant.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 123 Main Street, Cityville" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <h2 className="text-lg font-heading font-semibold mt-8 mb-4">Hours of Operation</h2>
        
        <div className="space-y-3 mb-6">
          {daysOfWeek.map((day) => (
            <div key={day} className="flex flex-wrap md:flex-nowrap items-center">
              <span className="w-28 font-medium">{day}</span>
              <div className="flex items-center flex-wrap">
                <Select 
                  value={hours[day]?.open || "11:00 AM"} 
                  onValueChange={(value) => updateHours(day, 'open', value)}
                  disabled={hours[day]?.closed}
                >
                  <SelectTrigger className="w-[130px] mr-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={`${day}-open-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="mx-2">to</span>
                <Select 
                  value={hours[day]?.close || "10:00 PM"} 
                  onValueChange={(value) => updateHours(day, 'close', value)}
                  disabled={hours[day]?.closed}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={`${day}-close-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-2 md:mt-0 md:ml-4">
                <label className="inline-flex items-center">
                  <Checkbox 
                    checked={hours[day]?.closed || false}
                    onCheckedChange={(checked) => 
                      updateHours(day, 'closed', checked === true)
                    }
                  />
                  <span className="ml-2 text-sm text-midgray">Closed</span>
                </label>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end space-x-3 mt-8">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => form.reset()}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-primary text-white hover:bg-primary/90"
            disabled={!restaurant && !canCreateRestaurant}
          >
            {restaurant ? "Save Changes" : "Create Restaurant"}
          </Button>
        </div>
        {!restaurant && !canCreateRestaurant && (
          <p className="text-sm text-destructive mt-2 text-center">
            Each account can only manage one restaurant. Create a separate owner account or contact support to add another location.
          </p>
        )}
      </form>
    </Form>
  );
};

export default RestaurantProfileForm;
