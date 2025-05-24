import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Settings } from "lucide-react";

interface AdSettings {
  id: number;
  position: string;
  isEnabled: boolean;
  description: string;
  displayFrequency: number;
  maxAdsPerPage: number;
}

export default function AdPositionSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [position, setPosition] = useState("bottom");
  const [isEnabled, setIsEnabled] = useState(true);
  const [displayFrequency, setDisplayFrequency] = useState(1);
  const [maxAdsPerPage, setMaxAdsPerPage] = useState(3);

  // Fetch current ad settings
  const { data: adSettings, isLoading } = useQuery<AdSettings>({
    queryKey: ['/api/admin/ad-settings'],
    onSuccess: (data) => {
      if (data) {
        setPosition(data.position);
        setIsEnabled(data.isEnabled);
        setDisplayFrequency(data.displayFrequency);
        setMaxAdsPerPage(data.maxAdsPerPage);
      }
    }
  });

  // Update ad settings mutation
  const updateAdSettingsMutation = useMutation({
    mutationFn: async (data: Partial<AdSettings>) => {
      const res = await apiRequest('PUT', '/api/admin/ad-settings', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ad-settings'] });
      toast({
        title: "Settings Updated",
        description: "Advertisement position settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateAdSettingsMutation.mutate({
      position,
      isEnabled,
      displayFrequency,
      maxAdsPerPage,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Advertisement Position Settings</CardTitle>
        </div>
        <CardDescription>
          Configure where advertisements will be displayed on customer menus
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger>
              <SelectValue placeholder="Select advertisement position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top - Above the menu</SelectItem>
              <SelectItem value="middle">Middle - Between menu sections</SelectItem>
              <SelectItem value="bottom">Bottom - Below the menu</SelectItem>
              <SelectItem value="sidebar">Sidebar - Next to the menu</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Where the advertisement will be displayed on the menu.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled">Enable Advertisements</Label>
            <p className="text-sm text-muted-foreground">
              Show advertisements on customer menus
            </p>
          </div>
          <Switch
            id="enabled"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Display Frequency</Label>
          <Select 
            value={displayFrequency.toString()} 
            onValueChange={(value) => setDisplayFrequency(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Every menu item</SelectItem>
              <SelectItem value="3">Every 3 menu items</SelectItem>
              <SelectItem value="5">Every 5 menu items</SelectItem>
              <SelectItem value="10">Every 10 menu items</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            How often to display advertisements between menu items
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-ads">Maximum Ads Per Page</Label>
          <Select 
            value={maxAdsPerPage.toString()} 
            onValueChange={(value) => setMaxAdsPerPage(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 advertisement</SelectItem>
              <SelectItem value="2">2 advertisements</SelectItem>
              <SelectItem value="3">3 advertisements</SelectItem>
              <SelectItem value="5">5 advertisements</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Maximum number of advertisements to show per menu page
          </p>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={updateAdSettingsMutation.isPending}
          >
            {updateAdSettingsMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}