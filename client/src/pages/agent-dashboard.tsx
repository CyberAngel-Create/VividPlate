import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Coins, 
  Store, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  ArrowRight,
  Loader2,
  User,
  Calendar,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { Label } from "@/components/ui/label";

interface AgentStats {
  tokenBalance: number;
  totalRestaurants: number;
  premiumRestaurants: number;
  pendingTokenRequests: number;
}

interface Agent {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  agentCode: string;
  tokenBalance: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface Restaurant {
  id: number;
  name: string;
  isPremium: boolean;
  approvalStatus: string;
  isActive: boolean;
}

interface TokenRequest {
  id: number;
  requestedTokens: number;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
}

interface TokenTransaction {
  id: number;
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  createdAt: string;
}

export default function AgentDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestedTokens, setRequestedTokens] = useState<number>(1);
  const [requestNotes, setRequestNotes] = useState("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const { data: agent, isLoading: agentLoading } = useQuery<Agent>({
    queryKey: ["/api/agents/me"],
    retry: false,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AgentStats>({
    queryKey: ["/api/agents/me/stats"],
    enabled: !!agent,
  });

  const { data: restaurants, isLoading: restaurantsLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/agents/me/restaurants"],
    enabled: !!agent,
  });

  const { data: tokenRequests, isLoading: requestsLoading } = useQuery<TokenRequest[]>({
    queryKey: ["/api/agents/me/token-requests"],
    enabled: !!agent,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<TokenTransaction[]>({
    queryKey: ["/api/agents/me/token-transactions"],
    enabled: !!agent,
  });

  const requestTokensMutation = useMutation({
    mutationFn: async (data: { requestedTokens: number; notes: string }) => {
      const response = await apiRequest("POST", "/api/agents/me/token-requests", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Token Request Submitted",
        description: "Your request has been sent to the administrator for approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/me/token-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/me/stats"] });
      setRequestDialogOpen(false);
      setRequestedTokens(1);
      setRequestNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit token request",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("PUT", "/api/user/change-password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation must match",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleSubmitRequest = () => {
    if (requestedTokens < 1) {
      toast({
        title: "Invalid Request",
        description: "Please request at least 1 token",
        variant: "destructive",
      });
      return;
    }
    requestTokensMutation.mutate({ 
      requestedTokens, 
      notes: requestNotes 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
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

  if (!agent) {
    return (
      <AgentLayout>
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Become an Agent</CardTitle>
              <CardDescription>
                Register as an agent to create and manage premium restaurants for clients.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/agent-registration")}>
                Register as Agent
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </AgentLayout>
    );
  }

  if (agent.approvalStatus === 'pending') {
    return (
      <AgentLayout>
        <div className="max-w-2xl mx-auto p-6">
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Application Under Review
              </CardTitle>
              <CardDescription>
                Your agent application is being reviewed by our team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We'll notify you once your application has been reviewed. This usually takes 1-2 business days.
              </p>
            </CardContent>
          </Card>
        </div>
      </AgentLayout>
    );
  }

  if (agent.approvalStatus === 'rejected') {
    return (
      <AgentLayout>
        <div className="max-w-2xl mx-auto p-6">
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Application Rejected
              </CardTitle>
              <CardDescription>
                Unfortunately, your agent application was not approved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Please contact support for more information or to submit a new application.
              </p>
              <Button variant="outline" onClick={() => setLocation("/agent-registration")}>
                Submit New Application
              </Button>
            </CardContent>
          </Card>
        </div>
      </AgentLayout>
    );
  }

  const hasTokens = (stats?.tokenBalance || 0) > 0;

  return (
    <AgentLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Agent Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {agent.firstName} {agent.lastName}</p>
          </div>
          {agent.agentCode && (
            <Badge variant="outline" className="text-lg px-4 py-2">
              <User className="w-4 h-4 mr-2" />
              {agent.agentCode}
            </Badge>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Token Balance</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.tokenBalance || 0}</div>
              <p className="text-xs text-muted-foreground">Available tokens</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRestaurants || 0}</div>
              <p className="text-xs text-muted-foreground">Managed by you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Restaurants</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.premiumRestaurants || 0}</div>
              <p className="text-xs text-muted-foreground">Active premium status</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingTokenRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Token Requests</CardTitle>
                <CardDescription>Request tokens from administrator</CardDescription>
              </div>
              <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Request Tokens
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Tokens</DialogTitle>
                    <DialogDescription>
                      Submit a request for tokens. Each token grants 1 month of premium for a restaurant.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium">Number of Tokens</label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={requestedTokens}
                        onChange={(e) => setRequestedTokens(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Notes (Optional)</label>
                      <Textarea
                        placeholder="Add any notes for the administrator..."
                        value={requestNotes}
                        onChange={(e) => setRequestNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmitRequest}
                      disabled={requestTokensMutation.isPending}
                    >
                      {requestTokensMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Request
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : tokenRequests && tokenRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokenRequests.slice(0, 5).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.requestedTokens}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">No token requests yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Token Transactions</CardTitle>
              <CardDescription>Your token history</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{tx.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={tx.type === 'credit' ? 'default' : 'secondary'}>
                        {tx.type === 'credit' ? '+' : '-'}{Math.abs(tx.amount)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Restaurants</CardTitle>
              <CardDescription>Restaurants you manage as an agent</CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/agent/create-restaurant")}
              disabled={!hasTokens}
              title={!hasTokens ? "You need tokens to create a restaurant" : ""}
            >
              <Plus className="h-4 w-4 mr-2" />
              {hasTokens ? "Create Restaurant" : "Need Tokens"}
            </Button>
          </CardHeader>
          <CardContent>
            {restaurantsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : restaurants && restaurants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restaurants.map((restaurant) => (
                    <TableRow key={restaurant.id}>
                      <TableCell className="font-medium">{restaurant.name}</TableCell>
                      <TableCell>{getStatusBadge(restaurant.approvalStatus)}</TableCell>
                      <TableCell>
                        {restaurant.isPremium ? (
                          <Badge className="bg-purple-100 text-purple-800">Premium</Badge>
                        ) : (
                          <Badge variant="outline">Free</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {restaurant.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {hasTokens 
                    ? "No restaurants yet. Create your first one!"
                    : "You need tokens to create restaurants. Request tokens from the administrator."}
                </p>
                {hasTokens && (
                  <Button onClick={() => setLocation("/agent/create-restaurant")}>
                    Create Your First Restaurant
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Account Security
            </CardTitle>
            <CardDescription>Manage your password and security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and choose a new one.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                      {showPasswords ? "Hide" : "Show"} Passwords
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePasswordChange}
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
}
