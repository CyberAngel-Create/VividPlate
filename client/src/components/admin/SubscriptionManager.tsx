import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Crown, Clock, CheckCircle, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
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

interface LsSubStatus {
  status: string;
  subscription: {
    tier: string;
    expiry: string | null;
    lsSubscriptionId: string | null;
    lsStatus: string | null;
    renewsAt: string | null;
  };
}

interface SubscriptionManagerProps {
  user: User;
}

const LS_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
  on_trial: { label: 'Trial', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  paused: { label: 'Paused', color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
  past_due: { label: 'Past Due', color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
  unpaid: { label: 'Unpaid', color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
};

export const SubscriptionManager = ({ user }: SubscriptionManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const subscriptionOptions = [
    { value: "1month", label: "1 Month Premium", duration: 30 },
    { value: "2months", label: "2 Months Premium", duration: 60 },
    { value: "3months", label: "3 Months Premium", duration: 90 },
    { value: "4months", label: "4 Months Premium", duration: 120 },
    { value: "5months", label: "5 Months Premium", duration: 150 },
    { value: "6months", label: "6 Months Premium", duration: 180 },
    { value: "7months", label: "7 Months Premium", duration: 210 },
    { value: "8months", label: "8 Months Premium", duration: 240 },
    { value: "9months", label: "9 Months Premium", duration: 270 },
    { value: "10months", label: "10 Months Premium", duration: 300 },
    { value: "11months", label: "11 Months Premium", duration: 330 },
    { value: "12months", label: "12 Months Premium (1 Year)", duration: 365 },
    { value: "lifetime", label: "Lifetime Premium (10 Years)", duration: 3650 },
    { value: "remove", label: "Remove Premium (Downgrade to Free)", duration: 0 },
  ];

  // Fetch live LS subscription status when dialog opens
  const { data: lsData, isLoading: isLsLoading, refetch: refetchLs } = useQuery<LsSubStatus>({
    queryKey: [`/api/ls/subscription-status`, user.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/users/${user.id}/ls-subscription`);
      return res.json();
    },
    enabled: isOpen,
    staleTime: 30_000,
    retry: false,
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: { userId: number; duration: number; subscriptionTier: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${data.userId}/subscription`, {
        duration: data.duration,
        subscriptionTier: data.subscriptionTier,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Subscription Updated",
        description: `${user.fullName || user.username}'s subscription has been updated successfully.`,
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
    const option = subscriptionOptions.find((opt) => opt.value === selectedDuration);
    if (!option) return;
    const subscriptionTier = option.duration > 0 ? "premium" : "free";
    updateSubscriptionMutation.mutate({
      userId: user.id,
      duration: option.duration,
      subscriptionTier,
    });
  };

  const getLocalSubscriptionStatus = () => {
    if (user.subscriptionTier === "premium") {
      const endDate = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
      const isExpired = endDate && endDate < new Date();
      return {
        status: isExpired ? "expired" : "active",
        endDate,
        daysLeft: endDate
          ? Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      };
    }
    return { status: "free", endDate: null, daysLeft: 0 };
  };

  const localStatus = getLocalSubscriptionStatus();
  const lsSub = lsData?.subscription;
  const lsStatusInfo = lsSub?.lsStatus ? LS_STATUS_LABELS[lsSub.lsStatus] : null;

  const previewDate = selectedDuration
    ? (() => {
        const opt = subscriptionOptions.find((o) => o.value === selectedDuration);
        if (!opt || opt.duration === 0) return null;
        return new Date(Date.now() + opt.duration * 24 * 60 * 60 * 1000);
      })()
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Crown className="mr-1 h-3 w-3" />
          Manage Subscription
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Subscription — {user.fullName || user.username}</DialogTitle>
          <DialogDescription>
            View and manage this user's subscription plan. Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Local DB Subscription Status */}
          <div className="space-y-2">
            <Label>Current Plan (Database)</Label>
            <div className="flex items-start space-x-2 p-3 border rounded-lg bg-muted/50">
              <Crown className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  <Badge variant={user.subscriptionTier === "premium" ? "default" : "secondary"}>
                    {user.subscriptionTier === "premium" ? "Premium" : user.subscriptionTier === "free" ? "Free" : user.subscriptionTier}
                  </Badge>
                  {localStatus.status === "expired" && (
                    <Badge variant="destructive">Expired</Badge>
                  )}
                </div>
                {localStatus.endDate && (
                  <div className="text-sm text-muted-foreground mt-1 flex items-center space-x-1">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span>
                      {localStatus.status === "active"
                        ? `Expires: ${localStatus.endDate.toLocaleDateString()} (${localStatus.daysLeft} days left)`
                        : `Expired: ${localStatus.endDate.toLocaleDateString()}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LemonSqueezy Live Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>LemonSqueezy Status (Live)</Label>
              <button
                onClick={() => refetchLs()}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>

            {isLsLoading ? (
              <div className="p-3 border rounded-lg bg-muted/30 text-sm text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Loading LemonSqueezy data…
              </div>
            ) : lsSub?.lsSubscriptionId ? (
              <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {lsStatusInfo ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${lsStatusInfo.color}`}>
                        LS: {lsStatusInfo.label}
                      </span>
                    ) : lsSub.lsStatus ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {lsSub.lsStatus}
                      </span>
                    ) : null}
                  </div>
                  <a
                    href={`https://app.lemonsqueezy.com/subscriptions/${lsSub.lsSubscriptionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    View in LS
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Subscription ID:</span>
                    <code className="bg-muted px-1 rounded text-[11px]">{lsSub.lsSubscriptionId}</code>
                  </div>
                  {lsSub.renewsAt && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Renews:</span>
                      <span>{new Date(lsSub.renewsAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  )}
                  {lsSub.expiry && !lsSub.renewsAt && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Expires:</span>
                      <span>{new Date(lsSub.expiry).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 border rounded-lg bg-muted/30 text-sm text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                No LemonSqueezy subscription linked to this account.
              </div>
            )}
          </div>

          {/* Duration Selection */}
          <div className="space-y-2">
            <Label htmlFor="duration">Override Subscription Duration</Label>
            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select subscription duration…" />
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
              <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="text-sm">
                    {selectedDuration === "remove" ? (
                      <span>User will be switched to <strong>Free</strong> plan immediately</span>
                    ) : (
                      <span>
                        User will have <strong>Premium</strong> access until{" "}
                        <strong>{previewDate?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
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
            variant={selectedDuration === "remove" ? "destructive" : "default"}
          >
            {updateSubscriptionMutation.isPending ? "Updating…" : "Update Subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
