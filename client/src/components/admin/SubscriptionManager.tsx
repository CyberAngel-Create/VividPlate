import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Crown, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  subscriptionTier: string;
  subscriptionExpiry?: string | null;
  isActive: boolean;
}

interface SubscriptionManagerProps {
  user: User;
}

export const SubscriptionManager = ({ user }: SubscriptionManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const subscriptionOptions = [
    { value: "1month", label: "1 Month Premium", duration: 30 },
    { value: "3months", label: "3 Months Premium", duration: 90 },
    { value: "6months", label: "6 Months Premium", duration: 180 },
    { value: "1year", label: "1 Year Premium", duration: 365 },
    { value: "remove", label: "Remove Premium", duration: 0 }
  ];

  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: { userId: number; duration: number; subscriptionTier: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${data.userId}/subscription`, {
        duration: data.duration,
        subscriptionTier: data.subscriptionTier
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Subscription Updated",
        description: `${user.fullName}'s subscription has been updated successfully.`,
      });
      setIsOpen(false);
      setSelectedDuration("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateSubscription = () => {
    if (!selectedDuration) return;

    const option = subscriptionOptions.find(opt => opt.value === selectedDuration);
    if (!option) return;

    const subscriptionTier = option.duration > 0 ? "premium" : "free";
    
    updateSubscriptionMutation.mutate({
      userId: user.id,
      duration: option.duration,
      subscriptionTier: subscriptionTier
    });
  };

  const getSubscriptionStatus = () => {
    if (user.subscriptionTier === "premium") {
      const endDate = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
      const isExpired = endDate && endDate < new Date();
      
      return {
        status: isExpired ? "expired" : "active",
        endDate: endDate,
        daysLeft: endDate ? Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
      };
    }
    return { status: "free", endDate: null, daysLeft: 0 };
  };

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Crown className="mr-1 h-3 w-3" />
          Manage Subscription
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Subscription for {user.fullName}</DialogTitle>
          <DialogDescription>
            Update the user's subscription plan and duration.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Current Subscription Status */}
          <div className="space-y-2">
            <Label>Current Subscription</Label>
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/50">
              <Crown className="h-4 w-4" />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Badge variant={user.subscriptionTier === "premium" ? "default" : "secondary"}>
                    {user.subscriptionTier === "premium" ? "Premium" : "Free"}
                  </Badge>
                  {subscriptionStatus.status === "expired" && (
                    <Badge variant="destructive">Expired</Badge>
                  )}
                </div>
                {subscriptionStatus.endDate && (
                  <div className="text-sm text-muted-foreground mt-1 flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {subscriptionStatus.status === "active" 
                        ? `Expires: ${subscriptionStatus.endDate.toLocaleDateString()} (${subscriptionStatus.daysLeft} days left)`
                        : `Expired: ${subscriptionStatus.endDate.toLocaleDateString()}`
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Duration Selection */}
          <div className="space-y-2">
            <Label htmlFor="duration">Set Subscription Duration</Label>
            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select subscription duration" />
              </SelectTrigger>
              <SelectContent>
                {subscriptionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      {option.duration > 0 ? (
                        <>
                          <Crown className="h-4 w-4 text-yellow-500" />
                          <span>{option.label}</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{option.label}</span>
                        </>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {selectedDuration && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <div className="text-sm">
                    {selectedDuration === "remove" ? (
                      <span>User will be switched to <strong>Free</strong> plan immediately</span>
                    ) : (
                      <span>
                        User will have <strong>Premium</strong> access until{" "}
                        <strong>
                          {new Date(Date.now() + (subscriptionOptions.find(opt => opt.value === selectedDuration)?.duration || 0) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateSubscription}
            disabled={!selectedDuration || updateSubscriptionMutation.isPending}
          >
            {updateSubscriptionMutation.isPending ? "Updating..." : "Update Subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};