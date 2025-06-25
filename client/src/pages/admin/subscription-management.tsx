import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Calendar, Clock, Crown, Users } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  subscriptionTier: string;
  premiumStartDate?: string;
  premiumEndDate?: string;
  premiumDuration?: string;
  isActive: boolean;
  createdAt: string;
}

export default function SubscriptionManagement() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<string>("");

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return res.json();
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, subscriptionTier, duration }: { 
      userId: number; 
      subscriptionTier: string; 
      duration?: string; 
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/subscription`, {
        subscriptionTier,
        duration,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User subscription updated successfully",
      });
      setSelectedUserId(null);
      setSelectedTier("");
      setSelectedDuration("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
        variant: "destructive",
      });
    },
  });

  const handleUpdateSubscription = () => {
    if (!selectedUserId || !selectedTier) return;

    if (selectedTier === "premium" && !selectedDuration) {
      toast({
        title: "Error",
        description: "Please select a duration for premium subscription",
        variant: "destructive",
      });
      return;
    }

    updateSubscriptionMutation.mutate({
      userId: selectedUserId,
      subscriptionTier: selectedTier,
      duration: selectedDuration,
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const timeDiff = end.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff > 0 ? daysDiff : 0;
  };

  const getDurationLabel = (duration?: string) => {
    switch (duration) {
      case "1_month": return "1 Month";
      case "3_months": return "3 Months";
      case "1_year": return "1 Year";
      default: return "N/A";
    }
  };

  if (usersLoading) {
    return <div className="p-6">Loading users...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Crown className="h-6 w-6 text-yellow-500" />
        <h1 className="text-2xl font-bold">Subscription Management</h1>
      </div>

      {/* Update Subscription Form */}
      <Card>
        <CardHeader>
          <CardTitle>Update User Subscription</CardTitle>
          <CardDescription>
            Upgrade users to premium or downgrade to free tier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedUserId?.toString() || ""} onValueChange={(value) => setSelectedUserId(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select User" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.username} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger>
                <SelectValue placeholder="Select Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>

            {selectedTier === "premium" && (
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_month">1 Month</SelectItem>
                  <SelectItem value="3_months">3 Months</SelectItem>
                  <SelectItem value="1_year">1 Year</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Button 
              onClick={handleUpdateSubscription}
              disabled={!selectedUserId || !selectedTier || (selectedTier === "premium" && !selectedDuration) || updateSubscriptionMutation.isPending}
            >
              {updateSubscriptionMutation.isPending ? "Updating..." : "Update Subscription"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-xl font-semibold">All Users</h2>
          <Badge variant="secondary">{users?.length || 0} users</Badge>
        </div>

        <div className="grid gap-3">
          {users?.map((user) => {
            const daysRemaining = getDaysRemaining(user.premiumEndDate);
            const isExpiringSoon = daysRemaining !== null && daysRemaining <= 10;
            
            return (
              <Card key={user.id} className={`${isExpiringSoon ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{user.fullName}</h3>
                        <Badge variant={user.subscriptionTier === "premium" ? "default" : "secondary"}>
                          {user.subscriptionTier}
                        </Badge>
                        {!user.isActive && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {user.username} • {user.email}
                      </p>
                      
                      {user.subscriptionTier === "premium" && user.premiumStartDate && (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Start: {formatDate(user.premiumStartDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>End: {formatDate(user.premiumEndDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Duration: {getDurationLabel(user.premiumDuration)}</span>
                          </div>
                          {daysRemaining !== null && (
                            <div className={`flex items-center gap-1 ${isExpiringSoon ? 'text-yellow-600 font-medium' : ''}`}>
                              <Clock className="h-3 w-3" />
                              <span>
                                {daysRemaining > 0 ? `${daysRemaining} days left` : "Expired"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Joined: {formatDate(user.createdAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}