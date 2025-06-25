import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Crown, Users, Calendar, DollarSign } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  subscriptionTier: string;
  subscriptionEndDate?: string;
  isActive: boolean;
}

export default function SubscriptionManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>("premium");
  const [selectedDuration, setSelectedDuration] = useState<string>("1_month");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Upgrade user mutation
  const upgradeUserMutation = useMutation({
    mutationFn: async ({ userId, duration }: { userId: number, duration: string }) => {
      const res = await apiRequest("POST", `/api/admin/upgrade-user/${userId}`, { duration });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User upgraded",
        description: `${selectedUser?.username} has been upgraded to premium.`,
      });
      setSelectedUser(null);
    },
    onError: (error) => {
      console.error("Upgrade error:", error);
      toast({
        title: "Error",
        description: "Failed to upgrade user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Downgrade user mutation
  const downgradeUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/admin/downgrade-user/${userId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User downgraded",
        description: `${selectedUser?.username} has been downgraded to free.`,
      });
      setSelectedUser(null);
    },
    onError: (error) => {
      console.error("Downgrade error:", error);
      toast({
        title: "Error",
        description: "Failed to downgrade user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateSubscription = () => {
    if (!selectedUser) return;

    if (selectedTier === "premium") {
      upgradeUserMutation.mutate({
        userId: selectedUser.id,
        duration: selectedDuration,
      });
    } else {
      downgradeUserMutation.mutate(selectedUser.id);
    }
  };

  const formatDuration = (duration: string) => {
    switch (duration) {
      case "1_month": return "1 Month";
      case "3_months": return "3 Months";
      case "6_months": return "6 Months";
      case "1_year": return "1 Year";
      default: return duration;
    }
  };

  const isPending = upgradeUserMutation.isPending || downgradeUserMutation.isPending;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Subscription Management</h1>
            <p className="text-muted-foreground">Upgrade users to premium or downgrade to free tier</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select User
              </CardTitle>
              <CardDescription>
                Choose a user to manage their subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2">
                {isLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No users found</div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === user.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{user.fullName}</div>
                          <div className="text-sm text-muted-foreground">{user.username} • {user.email}</div>
                        </div>
                        <Badge variant={user.subscriptionTier === "premium" ? "default" : "secondary"}>
                          {user.subscriptionTier}
                        </Badge>
                      </div>
                      {user.subscriptionEndDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Expires: {new Date(user.subscriptionEndDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscription Update */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Update User Subscription
              </CardTitle>
              <CardDescription>
                {selectedUser 
                  ? `Manage subscription for ${selectedUser.username}` 
                  : "Select a user to manage their subscription"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedUser ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Selected User:</label>
                    <Select value={selectedUser.email} disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={selectedUser.email}>
                          {selectedUser.fullName} ({selectedUser.email})
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Subscription Tier:</label>
                    <Select value={selectedTier} onValueChange={setSelectedTier}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTier === "premium" && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Duration:</label>
                      <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1_month">1 Month</SelectItem>
                          <SelectItem value="3_months">3 Months</SelectItem>
                          <SelectItem value="6_months">6 Months</SelectItem>
                          <SelectItem value="1_year">1 Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-4">
                      Current Status: 
                      <Badge className="ml-2" variant={selectedUser.subscriptionTier === "premium" ? "default" : "secondary"}>
                        {selectedUser.subscriptionTier}
                      </Badge>
                      {selectedUser.subscriptionEndDate && (
                        <span className="ml-2">
                          (Expires: {new Date(selectedUser.subscriptionEndDate).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                    <Button 
                      onClick={handleUpdateSubscription}
                      disabled={isPending || selectedUser.subscriptionTier === selectedTier}
                      className="w-full"
                    >
                      {isPending ? "Updating..." : `Update Subscription`}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Please select a user from the list to manage their subscription
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Users</span>
              </div>
              <div className="text-2xl font-bold mt-1">{users.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Premium Users</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {users.filter(u => u.subscriptionTier === "premium").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Free Users</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {users.filter(u => u.subscriptionTier === "free").length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}