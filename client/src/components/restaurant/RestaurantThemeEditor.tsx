import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Restaurant } from "@shared/schema";
import { ObjectUploader } from "../../../components/ObjectUploader";
import { useMutation } from "@tanstack/react-query";
import { Image, X } from "lucide-react";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";

interface RestaurantThemeEditorProps {
  restaurantId: number;
  initialTheme?: Record<string, any>;
  onSuccess?: () => void;
}

// List of common font families
const fontFamilies = [
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Helvetica, sans-serif", label: "Helvetica" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Courier New, monospace", label: "Courier New" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
  { value: "Trebuchet MS, sans-serif", label: "Trebuchet MS" },
  { value: "Arial Black, sans-serif", label: "Arial Black" },
  { value: "Impact, sans-serif", label: "Impact" }
];

const RestaurantThemeEditor = ({ restaurantId, initialTheme, onSuccess }: RestaurantThemeEditorProps) => {
  const { toast } = useToast();
  
  // Set default theme if none provided
  const defaultTheme = {
    backgroundColor: "#ffffff",
    textColor: "#000000",
    headerColor: "#f5f5f5",
    accentColor: "#4f46e5", 
    fontFamily: "Inter, sans-serif",
    menuItemColor: "#333333",
    menuDescriptionColor: "#666666",
    menuPriceColor: "#111111",
    backgroundImageUrl: ""
  };
  
  const [theme, setTheme] = useState<Record<string, any>>(initialTheme || defaultTheme);
  const [isLoading, setIsLoading] = useState(false);
  const { subscriptionStatus } = useSubscriptionStatus();
  const bannerOnlyPlan = !subscriptionStatus || !subscriptionStatus.isPaid;

  // Background image upload mutation
  const backgroundImageMutation = useMutation({
    mutationFn: async (backgroundImageUrl: string) => {
      return await apiRequest(
        "PUT",
        `/api/restaurants/${restaurantId}/background-image`,
        { backgroundImageUrl }
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Background image uploaded successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error setting background image:", error);
      toast({
        title: "Error",
        description: "Failed to upload background image",
        variant: "destructive",
      });
    },
  });

  // Handle background image upload
  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleBackgroundImageComplete = (result: { successful: Array<{ uploadURL: string }> }) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      
      // Update theme state immediately for preview
      setTheme(prev => ({
        ...prev,
        backgroundImageUrl: uploadURL
      }));

      // Save to backend
      backgroundImageMutation.mutate(uploadURL);
    }
  };

  const removeBackgroundImage = () => {
    setTheme(prev => ({
      ...prev,
      backgroundImageUrl: ""
    }));
  };
  
  // Handler for color and font changes
  const handleChange = (field: string, value: string) => {
    setTheme((prev) => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Save theme settings
  const saveTheme = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest(
        "PATCH",
        `/api/restaurants/${restaurantId}`,
        { themeSettings: theme }
      );
      
      if (!response.ok) {
        throw new Error("Failed to save theme settings");
      }
      
      toast({
        title: "Success",
        description: "Theme settings saved successfully",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving theme:", error);
      
      toast({
        title: "Error",
        description: "Failed to save theme settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset to default theme
  const resetTheme = () => {
    setTheme(defaultTheme);
    toast({
      title: "Theme Reset",
      description: "Theme settings have been reset to defaults",
    });
  };
  
  // Preview styles for the menu
  const previewStyle = {
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    fontFamily: theme.fontFamily,
    padding: "20px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    maxWidth: "400px",
    margin: "20px auto"
  };
  
  const headerStyle = {
    backgroundColor: theme.headerColor,
    padding: "15px",
    borderRadius: "6px 6px 0 0",
    marginBottom: "15px"
  };
  
  const itemStyle = {
    color: theme.menuItemColor,
    fontWeight: 600,
    fontSize: "16px",
    marginBottom: "4px"
  };
  
  const descriptionStyle = {
    color: theme.menuDescriptionColor,
    fontSize: "14px",
    marginBottom: "4px"
  };
  
  const priceStyle = {
    color: theme.menuPriceColor,
    fontWeight: 600,
    fontSize: "15px"
  };
  
  const buttonStyle = {
    backgroundColor: theme.accentColor,
    color: "#ffffff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer"
  };
  
  return (
    <div className="w-full">
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Theme Controls */}
        <div>
          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="background">Background</TabsTrigger>
            </TabsList>
            
            <TabsContent value="colors" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="backgroundColor"
                      type="text" 
                      value={theme.backgroundColor}
                      onChange={(e) => handleChange("backgroundColor", e.target.value)}
                      className="w-full"
                    />
                    <Input 
                      type="color" 
                      value={theme.backgroundColor}
                      onChange={(e) => handleChange("backgroundColor", e.target.value)}
                      className="w-12 h-10 p-1 border rounded"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="textColor">Text Color</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="textColor"
                      type="text" 
                      value={theme.textColor}
                      onChange={(e) => handleChange("textColor", e.target.value)}
                      className="w-full"
                    />
                    <Input 
                      type="color" 
                      value={theme.textColor}
                      onChange={(e) => handleChange("textColor", e.target.value)}
                      className="w-12 h-10 p-1 border rounded"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="headerColor">Header Color</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="headerColor"
                      type="text" 
                      value={theme.headerColor}
                      onChange={(e) => handleChange("headerColor", e.target.value)}
                      className="w-full"
                    />
                    <Input 
                      type="color" 
                      value={theme.headerColor}
                      onChange={(e) => handleChange("headerColor", e.target.value)}
                      className="w-12 h-10 p-1 border rounded"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="accentColor"
                      type="text" 
                      value={theme.accentColor}
                      onChange={(e) => handleChange("accentColor", e.target.value)}
                      className="w-full"
                    />
                    <Input 
                      type="color" 
                      value={theme.accentColor}
                      onChange={(e) => handleChange("accentColor", e.target.value)}
                      className="w-12 h-10 p-1 border rounded"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="menuItemColor">Item Title Color</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="menuItemColor"
                      type="text" 
                      value={theme.menuItemColor}
                      onChange={(e) => handleChange("menuItemColor", e.target.value)}
                      className="w-full"
                    />
                    <Input 
                      type="color" 
                      value={theme.menuItemColor}
                      onChange={(e) => handleChange("menuItemColor", e.target.value)}
                      className="w-12 h-10 p-1 border rounded"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="menuDescriptionColor">Description Color</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="menuDescriptionColor"
                      type="text" 
                      value={theme.menuDescriptionColor}
                      onChange={(e) => handleChange("menuDescriptionColor", e.target.value)}
                      className="w-full"
                    />
                    <Input 
                      type="color" 
                      value={theme.menuDescriptionColor}
                      onChange={(e) => handleChange("menuDescriptionColor", e.target.value)}
                      className="w-12 h-10 p-1 border rounded"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="menuPriceColor">Price Color</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="menuPriceColor"
                      type="text" 
                      value={theme.menuPriceColor}
                      onChange={(e) => handleChange("menuPriceColor", e.target.value)}
                      className="w-full"
                    />
                    <Input 
                      type="color" 
                      value={theme.menuPriceColor}
                      onChange={(e) => handleChange("menuPriceColor", e.target.value)}
                      className="w-12 h-10 p-1 border rounded"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="typography" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Select 
                    value={theme.fontFamily} 
                    onValueChange={(value) => handleChange("fontFamily", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontFamilies.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="background" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Background Image</Label>
                  {theme.backgroundImageUrl ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <img 
                          src={theme.backgroundImageUrl} 
                          alt="Background preview" 
                          className="w-full h-32 object-cover rounded-md border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={removeBackgroundImage}
                          className="absolute top-2 right-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">Current background image</p>
                      {bannerOnlyPlan && (
                        <p className="text-xs text-amber-600">
                          You can remove this image, but uploading a new background requires a paid plan.
                        </p>
                      )}
                    </div>
                  ) : bannerOnlyPlan ? (
                    <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm text-amber-700">
                        Background image uploads are available on paid plans. Free plan accounts can customize colors and upload a banner image only.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880} // 5MB
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={handleBackgroundImageComplete}
                        buttonClassName="w-full"
                      >
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          <span>Upload Background Image</span>
                        </div>
                      </ObjectUploader>
                      <p className="text-sm text-gray-600">
                        Upload an image to use as background for your customer menu (max 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex space-x-2 mt-6">
            <Button 
              onClick={saveTheme} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Saving..." : "Save Theme Settings"}
            </Button>
            <Button 
              onClick={resetTheme} 
              variant="outline"
              className="flex-1"
            >
              Reset to Default
            </Button>
          </div>
        </div>
        
        {/* Theme Preview */}
        <div>
          <h3 className="text-lg font-medium mb-4">Live Preview</h3>
          <div style={previewStyle} className="shadow-md">
            <div style={headerStyle}>
              <h3 style={{ color: theme.menuItemColor, fontWeight: "bold", fontSize: "18px" }}>
                Sample Restaurant Menu
              </h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 style={itemStyle}>Appetizers</h4>
                <div className="space-y-4 mt-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p style={itemStyle}>Bruschetta</p>
                      <p style={descriptionStyle}>Toasted bread with fresh tomatoes and basil</p>
                    </div>
                    <p style={priceStyle}>$9.99</p>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <p style={itemStyle}>Mozzarella Sticks</p>
                      <p style={descriptionStyle}>Crispy outside, melty inside, with marinara sauce</p>
                    </div>
                    <p style={priceStyle}>$8.99</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 style={itemStyle}>Main Course</h4>
                <div className="space-y-4 mt-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p style={itemStyle}>Grilled Salmon</p>
                      <p style={descriptionStyle}>Fresh salmon with lemon and herbs</p>
                    </div>
                    <p style={priceStyle}>$24.99</p>
                  </div>
                </div>
              </div>
              
              <div>
                <button style={buttonStyle}>View Full Menu</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantThemeEditor;