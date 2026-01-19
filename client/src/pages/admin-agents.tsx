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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  CheckCircle, XCircle, Clock, Search, Eye, 
  User, FileText, Calendar, MapPin, Phone, Power
} from "lucide-react";
import { format } from "date-fns";

interface Agent {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  idType: string;
  idNumber: string;
  idFrontImageUrl?: string;
  idBackImageUrl?: string;
  selfieImageUrl?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: number;
  createdAt: string;
  isActive?: boolean;
  agentCode?: string;
  tokenBalance?: number;
  userPhone?: string;
  userEmail?: string;
  userName?: string;
}

export default function AdminAgents() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');

  const { data: agents = [], isLoading, error } = useQuery<Agent[]>({
    queryKey: ["/api/admin/agents"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ agentId, notes }: { agentId: number; notes?: string }) => {
      const response = await apiRequest("POST", `/api/admin/agents/${agentId}/approve`, { notes });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Approved",
        description: "The agent has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      setShowApprovalDialog(false);
      setApprovalNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve agent",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ agentId, notes }: { agentId: number; notes?: string }) => {
      const response = await apiRequest("POST", `/api/admin/agents/${agentId}/reject`, { notes });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Rejected",
        description: "The agent application has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      setShowApprovalDialog(false);
      setApprovalNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject agent",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ agentId, isActive }: { agentId: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/agents/${agentId}/status`, { isActive });
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.isActive ? "Agent Activated" : "Agent Deactivated",
        description: `The agent has been ${variables.isActive ? 'activated' : 'deactivated'} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update agent status",
        variant: "destructive",
      });
    },
  });

  const handleApprovalAction = () => {
    if (!selectedAgent) return;
    
    if (approvalAction === 'approve') {
      approveMutation.mutate({ agentId: selectedAgent.id, notes: approvalNotes });
    } else {
      rejectMutation.mutate({ agentId: selectedAgent.id, notes: approvalNotes });
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.idNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || agent.approvalStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingAgents = agents.filter(a => a.approvalStatus === 'pending');
  const approvedAgents = agents.filter(a => a.approvalStatus === 'approved');
  const rejectedAgents = agents.filter(a => a.approvalStatus === 'rejected');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const getIdTypeLabel = (idType: string) => {
    switch (idType) {
      case 'national_id': return 'National ID';
      case 'passport': return 'Passport';
      case 'drivers_license': return "Driver's License";
      default: return idType;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Agent Management</h1>
          <p className="text-muted-foreground">Review and manage agent registrations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{agents.length}</div>
              <p className="text-sm text-muted-foreground">Total Agents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{pendingAgents.length}</div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{approvedAgents.length}</div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{rejectedAgents.length}</div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agent Applications</CardTitle>
            <CardDescription>
              Review agent registration applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>ID Info</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No agents found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAgents.map((agent) => (
                      <TableRow key={agent.id} className={agent.isActive === false ? 'opacity-60' : ''}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{agent.firstName} {agent.lastName}</span>
                            </div>
                            {agent.agentCode && (
                              <div className="text-xs text-muted-foreground">{agent.agentCode}</div>
                            )}
                            {agent.userEmail && (
                              <div className="text-xs text-muted-foreground">{agent.userEmail}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3" />
                            {agent.userPhone || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{getIdTypeLabel(agent.idType)}</div>
                            <div className="text-xs text-muted-foreground">{agent.idNumber}</div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {agent.city}, {agent.country}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{agent.tokenBalance || 0}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(agent.approvalStatus)}</TableCell>
                        <TableCell>
                          {agent.approvalStatus === 'approved' && (
                            <Switch
                              checked={agent.isActive !== false}
                              onCheckedChange={(checked) => {
                                toggleStatusMutation.mutate({ agentId: agent.id, isActive: checked });
                              }}
                              disabled={toggleStatusMutation.isPending}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAgent(agent);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {agent.approvalStatus === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => {
                                    setSelectedAgent(agent);
                                    setApprovalAction('approve');
                                    setShowApprovalDialog(true);
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    setSelectedAgent(agent);
                                    setApprovalAction('reject');
                                    setShowApprovalDialog(true);
                                  }}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agent Details</DialogTitle>
              <DialogDescription>
                Full information about the agent application
              </DialogDescription>
            </DialogHeader>
            {selectedAgent && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="font-medium">{selectedAgent.firstName} {selectedAgent.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1 flex items-center gap-2">
                      {getStatusBadge(selectedAgent.approvalStatus)}
                      {selectedAgent.approvalStatus === 'approved' && (
                        <Badge variant={selectedAgent.isActive !== false ? 'default' : 'secondary'}>
                          {selectedAgent.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Agent Code</label>
                    <p className="font-medium">{selectedAgent.agentCode || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Token Balance</label>
                    <p className="font-medium">{selectedAgent.tokenBalance || 0} tokens</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                    <p className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedAgent.userPhone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p>{selectedAgent.userEmail || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <p>{selectedAgent.dateOfBirth || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gender</label>
                    <p className="capitalize">{selectedAgent.gender || 'Not provided'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p>{selectedAgent.address}, {selectedAgent.city}, {selectedAgent.country}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID Type</label>
                    <p>{getIdTypeLabel(selectedAgent.idType)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID Number</label>
                    <p>{selectedAgent.idNumber}</p>
                  </div>
                </div>
                
                {(selectedAgent.idFrontImageUrl || selectedAgent.idBackImageUrl || selectedAgent.selfieImageUrl) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Documents</label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      {selectedAgent.idFrontImageUrl && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">ID Front</p>
                          <img 
                            src={selectedAgent.idFrontImageUrl} 
                            alt="ID Front" 
                            className="rounded-lg border w-full h-32 object-cover"
                          />
                        </div>
                      )}
                      {selectedAgent.idBackImageUrl && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">ID Back</p>
                          <img 
                            src={selectedAgent.idBackImageUrl} 
                            alt="ID Back" 
                            className="rounded-lg border w-full h-32 object-cover"
                          />
                        </div>
                      )}
                      {selectedAgent.selfieImageUrl && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Selfie</p>
                          <img 
                            src={selectedAgent.selfieImageUrl} 
                            alt="Selfie" 
                            className="rounded-lg border w-full h-32 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedAgent.rejectionReason && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <label className="text-sm font-medium text-red-800 dark:text-red-200">Rejection Reason</label>
                    <p className="text-red-700 dark:text-red-300">{selectedAgent.rejectionReason}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {approvalAction === 'approve' ? 'Approve Agent' : 'Reject Agent'}
              </DialogTitle>
              <DialogDescription>
                {approvalAction === 'approve' 
                  ? 'This will allow the agent to create and manage restaurants.'
                  : 'Provide a reason for rejecting this application.'}
              </DialogDescription>
            </DialogHeader>
            {selectedAgent && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{selectedAgent.firstName} {selectedAgent.lastName}</p>
                  <p className="text-sm text-muted-foreground">{getIdTypeLabel(selectedAgent.idType)}: {selectedAgent.idNumber}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium">
                    {approvalAction === 'approve' ? 'Notes (Optional)' : 'Rejection Reason'}
                  </label>
                  <Textarea
                    placeholder={approvalAction === 'approve' 
                      ? 'Add any notes about this approval...'
                      : 'Explain why this application was rejected...'}
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApprovalAction}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {approveMutation.isPending || rejectMutation.isPending 
                  ? 'Processing...' 
                  : approvalAction === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
