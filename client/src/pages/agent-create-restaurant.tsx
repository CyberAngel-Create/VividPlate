import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import AgentLayout from "@/components/layout/AgentLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Store, 
  Loader2, 
  ArrowLeft,
  User,
  Lock,
  Phone,
  Mail,
  MapPin,
  Eye,
  EyeOff,
  Coins,
  AlertCircle
} from "lucide-react";

interface Agent {
  id: number;
  tokenBalance: number;
  approvalStatus: string;
}

export default function AgentCreateRestaurant() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    restaurantName: "",
    description: "",
    address: "",
    phone: "",
    ownerUsername: "",
    ownerEmail: "",
    ownerPassword: "",
    ownerPhone: "",
  });

  const { data: agent, isLoading: agentLoading } = useQuery<Agent>({
    queryKey: ["/api/agents/me"],
    retry: false,
  });

  const createRestaurantMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/agents/create-restaurant", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create restaurant");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Restaurant Created",
        description: "Restaurant and owner account created successfully. 1 token has been deducted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/me/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/me/restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/me/token-transactions"] });
      setLocation("/agent-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Restaurant",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.restaurantName || !formData.ownerUsername || !formData.ownerPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.ownerPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    createRestaurantMutation.mutate(formData);
  };

  if (agentLoading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AgentLayout>
    );
  }

  if (!agent || agent.approvalStatus !== 'approved') {
    return (
      <AgentLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You must be an approved agent to create restaurants.
            </AlertDescription>
          </Alert>
        </div>
      </AgentLayout>
    );
  }

  if (agent.tokenBalance < 1) {
    return (
      <AgentLayout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => setLocation("/agent-dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          <Alert variant="destructive">
            <Coins className="h-4 w-4" />
            <AlertDescription>
              You need at least 1 token to create a restaurant. Please request tokens from the administrator.
            </AlertDescription>
          </Alert>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => setLocation("/agent-dashboard")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-6 h-6" />
                  Create Restaurant
                </CardTitle>
                <CardDescription>
                  Create a new restaurant profile and owner login account
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                <Coins className="w-4 h-4 mr-2" />
                {agent.tokenBalance} tokens
              </Badge>
            </div>
            <Alert className="mt-4">
              <Coins className="h-4 w-4" />
              <AlertDescription>
                Creating a restaurant will consume 1 token from your balance.
              </AlertDescription>
            </Alert>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Restaurant Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">Restaurant Name *</Label>
                  <Input
                    id="restaurantName"
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                    placeholder="Enter restaurant name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the restaurant"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Address
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Restaurant address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Restaurant Phone
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Restaurant phone number"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Owner Login Credentials</h3>
                <p className="text-sm text-muted-foreground">
                  These credentials will be used by the restaurant owner to log in and manage their menu.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerUsername">
                      <User className="w-4 h-4 inline mr-1" />
                      Username *
                    </Label>
                    <Input
                      id="ownerUsername"
                      value={formData.ownerUsername}
                      onChange={(e) => setFormData({ ...formData, ownerUsername: e.target.value })}
                      placeholder="Owner username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                      placeholder="Owner email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerPassword">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Password *
                    </Label>
                    <div className="relative">
                      <Input
                        id="ownerPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.ownerPassword}
                        onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                        placeholder="Min 6 characters"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerPhone">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Owner Phone *
                    </Label>
                    <Input
                      id="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                      placeholder="Owner phone number"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/agent-dashboard")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRestaurantMutation.isPending}
                  className="flex-1"
                >
                  {createRestaurantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Restaurant (1 Token)
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
}
