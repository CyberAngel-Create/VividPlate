import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, MapPin, Eye, Settings } from 'lucide-react';

interface AdSettings {
  id: number;
  position: string;
  isEnabled: boolean;
  description: string;
  displayFrequency: number;
  maxAdsPerPage: number;
  createdAt: Date;
  updatedAt: Date;
}

export function AdPositionSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery<AdSettings>({
    queryKey: ['/api/admin/ad-settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/ad-settings');
      return response.json();
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<AdSettings>) => {
      const response = await apiRequest('PUT', '/api/admin/ad-settings', newSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ad-settings'] });
      toast({
        title: "Settings Updated",
        description: "Advertisement position settings have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update advertisement settings.",
        variant: "destructive",
      });
    },
  });

  const [localSettings, setLocalSettings] = useState<Partial<AdSettings>>({});

  const handleSettingChange = (key: keyof AdSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(localSettings);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading advertisement settings...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-red-500">
            Failed to load advertisement settings. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentSettings = { ...settings, ...localSettings };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        <h2 className="text-2xl font-bold">Advertisement Position Settings</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advertisement Display Configuration
          </CardTitle>
          <CardDescription>
            Control where and how advertisements appear on customer menus. These settings affect all restaurants using the free tier.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Ads */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ads-enabled" className="text-base font-medium">
                Enable Advertisements
              </Label>
              <div className="text-sm text-muted-foreground">
                Turn advertisement display on or off globally
              </div>
            </div>
            <Switch
              id="ads-enabled"
              checked={currentSettings?.isEnabled || false}
              onCheckedChange={(checked) => handleSettingChange('isEnabled', checked)}
            />
          </div>

          <Separator />

          {/* Ad Position */}
          <div className="space-y-3">
            <Label htmlFor="ad-position" className="text-base font-medium">
              Advertisement Position
            </Label>
            <Select
              value={currentSettings?.position || 'bottom'}
              onValueChange={(value) => handleSettingChange('position', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select advertisement position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Top of Menu</SelectItem>
                <SelectItem value="middle">Middle of Menu</SelectItem>
                <SelectItem value="bottom">Bottom of Menu</SelectItem>
                <SelectItem value="sidebar">Sidebar</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {currentSettings?.description || "Where the advertisement will be displayed on the menu."}
            </div>
          </div>

          <Separator />

          {/* Display Frequency */}
          <div className="space-y-3">
            <Label htmlFor="display-frequency" className="text-base font-medium">
              Display Frequency
            </Label>
            <Input
              id="display-frequency"
              type="number"
              min="1"
              max="20"
              value={currentSettings?.displayFrequency || 1}
              onChange={(e) => handleSettingChange('displayFrequency', parseInt(e.target.value))}
              className="w-32"
            />
            <div className="text-sm text-muted-foreground">
              How often ads appear (every N menu sections). Range: 1-20
            </div>
          </div>

          <Separator />

          {/* Max Ads Per Page */}
          <div className="space-y-3">
            <Label htmlFor="max-ads" className="text-base font-medium">
              Maximum Ads Per Page
            </Label>
            <Input
              id="max-ads"
              type="number"
              min="1"
              max="10"
              value={currentSettings?.maxAdsPerPage || 3}
              onChange={(e) => handleSettingChange('maxAdsPerPage', parseInt(e.target.value))}
              className="w-32"
            />
            <div className="text-sm text-muted-foreground">
              Maximum number of advertisements shown per menu page. Range: 1-10
            </div>
          </div>

          <Separator />

          {/* Preview Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <Label className="text-base font-medium">Preview</Label>
            </div>
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">
                <strong>Current Configuration:</strong>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <div>• Position: <span className="font-medium">{currentSettings?.position || 'bottom'}</span></div>
                <div>• Status: <span className="font-medium">{currentSettings?.isEnabled ? 'Enabled' : 'Disabled'}</span></div>
                <div>• Frequency: <span className="font-medium">Every {currentSettings?.displayFrequency || 1} sections</span></div>
                <div>• Max per page: <span className="font-medium">{currentSettings?.maxAdsPerPage || 3} ads</span></div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending || Object.keys(localSettings).length === 0}
              className="min-w-[120px]"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}