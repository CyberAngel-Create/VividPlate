import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Coins, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  User,
  Calendar,
  MessageSquare
} from "lucide-react";

interface TokenRequest {
  id: number;
  agentId: number;
  requestedTokens: number;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  adminNotes: string | null;
  approvedBy: number | null;
  approvedAt: string | null;
  createdAt: string;
}

interface Agent {
  id: number;
  firstName: string;
  lastName: string;
  agentCode: string;
  tokenBalance: number;
}

export default function AdminTokenRequests() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<TokenRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: requests, isLoading: requestsLoading } = useQuery<TokenRequest[]>({
    queryKey: ["/api/admin/token-requests"],
  });

  const { data: pendingRequests, isLoading: pendingLoading } = useQuery<TokenRequest[]>({
    queryKey: ["/api/admin/token-requests/pending"],
  });

  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["/api/admin/agents"],
  });

  const getAgentInfo = (agentId: number) => {
    return agents?.find(a => a.id === agentId);
  };

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: number; notes: string }) => {
      const response = await apiRequest("POST", `/api/admin/token-requests/${requestId}/approve`, { notes });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Approved",
        description: "Tokens have been added to the agent's balance.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/token-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/token-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: number; notes: string }) => {
      const response = await apiRequest("POST", `/api/admin/token-requests/${requestId}/reject`, { notes });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Rejected",
        description: "The token request has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/token-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/token-requests/pending"] });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    },
  });

  const openActionDialog = (request: TokenRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes("");
  };

  const closeDialog = () => {
    setSelectedRequest(null);
    setActionType(null);
    setAdminNotes("");
  };

  const handleAction = () => {
    if (!selectedRequest || !actionType) return;

    if (actionType === 'approve') {
      approveMutation.mutate({ requestId: selectedRequest.id, notes: adminNotes });
    } else {
      rejectMutation.mutate({ requestId: selectedRequest.id, notes: adminNotes });
    }
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

  const renderRequestsTable = (requestList: TokenRequest[] | undefined, showActions: boolean) => {
    if (!requestList || requestList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No token requests found
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Tokens</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {requestList.map((request) => {
            const agent = getAgentInfo(request.agentId);
            return (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {agent ? `${agent.firstName} ${agent.lastName}` : `Agent #${request.agentId}`}
                      </p>
                      {agent?.agentCode && (
                        <p className="text-xs text-muted-foreground">{agent.agentCode}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    <Coins className="h-3 w-3 mr-1" />
                    {request.requestedTokens}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  {request.notes ? (
                    <span className="text-sm truncate block">{request.notes}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">No notes</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </TableCell>
                {showActions && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => openActionDialog(request, 'approve')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openActionDialog(request, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Token Requests</h1>
            <p className="text-muted-foreground">Manage agent token requests</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Clock className="h-4 w-4 mr-2" />
            {pendingRequests?.length || 0} Pending
          </Badge>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingRequests?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              All Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Token Requests</CardTitle>
                <CardDescription>
                  Review and approve token requests from agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  renderRequestsTable(pendingRequests, true)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Token Requests</CardTitle>
                <CardDescription>
                  Complete history of token requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  renderRequestsTable(requests, false)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => closeDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' ? 'Approve Token Request' : 'Reject Token Request'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'approve' 
                  ? `Approving this request will add ${selectedRequest?.requestedTokens} tokens to the agent's balance.`
                  : 'This request will be marked as rejected.'
                }
              </DialogDescription>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="py-4 space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Requested Tokens:</span>
                    <Badge className="font-mono text-lg">
                      <Coins className="h-4 w-4 mr-1" />
                      {selectedRequest.requestedTokens}
                    </Badge>
                  </div>
                  {selectedRequest.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Agent's Notes:</p>
                      <p className="text-sm">{selectedRequest.notes}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4" />
                    Admin Notes (Optional)
                  </label>
                  <Textarea
                    placeholder="Add notes for this decision..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                variant={actionType === 'reject' ? 'destructive' : 'default'}
                className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {(approveMutation.isPending || rejectMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {actionType === 'approve' ? 'Approve & Add Tokens' : 'Reject Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
