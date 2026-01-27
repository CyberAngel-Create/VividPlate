import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, parseJsonResponse } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RestaurantOwnerLayout from "@/components/layout/RestaurantOwnerLayout";
import { ArrowLeft, Store, Clock, Send, Mail } from "lucide-react";

interface RestaurantRequest {
  id: number;
  restaurantName: string;
  requestedMonths: number;
  status: string;
  createdAt: string;
  agentNotes?: string;
}

interface SubscriptionStatus {
  tier: string;
  isPaid: boolean;
  hasAgentPremiumRestaurant?: boolean;
  agentId?: number | null;
  agentName?: string | null;
  currentRestaurants?: number;
}

interface AgentMessage {
  id: number;
  subject?: string | null;
  message: string;
  status: string;
  agentResponse?: string | null;
  createdAt: string;
  respondedAt?: string | null;
}

const RequestRestaurant = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get agentId from subscription status (server-derived, not URL params)
  const { data: subscriptionStatus, isLoading: isLoadingSubscription } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/user/subscription-status"],
  });
  
  const agentId = subscriptionStatus?.agentId;
  const agentName = subscriptionStatus?.agentName || "Agent1";
  const currentRestaurants = subscriptionStatus?.currentRestaurants ?? 0;
  const canSubmitRequest = currentRestaurants === 0;
  
  const [formData, setFormData] = useState({
    requestedMonths: "1",
    ownerNotes: ""
  });

  const [messageForm, setMessageForm] = useState({
    subject: "",
    message: ""
  });

  const { data: myRequests, isLoading: isLoadingRequests } = useQuery<RestaurantRequest[]>({
    queryKey: ["/api/restaurant-requests/my-requests"],
  });

  const { data: myMessages, isLoading: isLoadingMessages } = useQuery<AgentMessage[]>({
    queryKey: ["/api/agent-messages/my"],
  });

  const submitRequestMutation = useMutation({
    mutationFn: async (data: typeof formData & { agentId: number }) => {
      const res = await apiRequest("POST", "/api/restaurant-requests", {
        ...data,
        requestedMonths: parseInt(data.requestedMonths)
      });
      return parseJsonResponse(res);
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your premium request has been submitted to your agent.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-requests/my-requests"] });
      setFormData({
        requestedMonths: "1",
        ownerNotes: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: typeof messageForm & { agentId?: number | null }) => {
      const res = await apiRequest("POST", "/api/agent-messages", data);
      return parseJsonResponse(res);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message was delivered to your agent.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agent-messages/my"] });
      setMessageForm({ subject: "", message: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentId) {
      toast({
        title: "Error",
        description: "You don't have an agent associated with your account",
        variant: "destructive",
      });
      return;
    }
    submitRequestMutation.mutate({
      ...formData,
      agentId: agentId
    });
  };

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageForm.message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message for your agent.",
        variant: "destructive",
      });
      return;
    }
    sendMessageMutation.mutate({
      subject: messageForm.subject.trim(),
      message: messageForm.message.trim(),
      agentId: agentId ?? null
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case "approved":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Approved</span>;
      case "rejected":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getMessageStatusBadge = (status: string) => {
    switch (status) {
      case "responded":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Responded</span>;
      case "closed":
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">Closed</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Awaiting Agent</span>;
    }
  };

  // Show loading state while checking subscription
  if (isLoadingSubscription) {
    return (
      <RestaurantOwnerLayout>
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </RestaurantOwnerLayout>
    );
  }

  // Show message if user doesn't have an agent (not an agent-sponsored restaurant)
  if (!agentId) {
    return (
      <RestaurantOwnerLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-600">
                We couldn't find an agent assignment for your account yet. Please refresh or contact support so we can connect you with an agent.
              </p>
              <Button onClick={() => setLocation("/dashboard")} className="mt-4 mx-auto block">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </RestaurantOwnerLayout>
    );
  }

  return (
    <RestaurantOwnerLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <h1 className="text-2xl font-bold mb-6">
          Premium Subscription Request
        </h1>

        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">
              Requests from this account are routed to your assigned agent for premium renewal.
            </p>
            <p className="text-base font-medium mt-1">
              Assigned Agent: {agentName}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Premium Subscription Request
              </CardTitle>
              <CardDescription>
                Request premium renewal duration in months. Your agent will extend your premium plan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <fieldset className="space-y-4">
                <div>
                  <Label htmlFor="requestedMonths">Premium Duration (Months) *</Label>
                  <Select
                    value={formData.requestedMonths}
                    onValueChange={(value) => setFormData({ ...formData, requestedMonths: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((months) => (
                        <SelectItem key={months} value={months.toString()}>
                          {months} {months === 1 ? "month" : "months"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ownerNotes">Additional Notes</Label>
                  <Textarea
                    id="ownerNotes"
                    value={formData.ownerNotes}
                    onChange={(e) => setFormData({ ...formData, ownerNotes: e.target.value })}
                    placeholder="Any additional information for your agent"
                    rows={2}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={submitRequestMutation.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submitRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
                </fieldset>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                My Premium Requests
              </CardTitle>
              <CardDescription>
                Status of your premium renewal requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : myRequests && myRequests.length > 0 ? (
                <div className="space-y-3">
                  {myRequests.map((request) => (
                    <div 
                      key={request.id}
                      className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{request.restaurantName}</p>
                          <p className="text-sm text-gray-500">
                            {request.requestedMonths} {request.requestedMonths === 1 ? "month" : "months"}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Requested: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      {request.agentNotes && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          Agent: {request.agentNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No requests yet. Submit your first request above.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Message to Agent
              </CardTitle>
              <CardDescription>
                Share updates or questions with your agent at any time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMessageSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={messageForm.subject}
                    onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                    placeholder="e.g., Menu updates"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    required
                    value={messageForm.message}
                    onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                    placeholder="Let your agent know what you need help with"
                    rows={4}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={sendMessageMutation.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Message History
              </CardTitle>
              <CardDescription>
                Agent replies will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : myMessages && myMessages.length > 0 ? (
                <div className="space-y-3">
                  {myMessages.map((msg) => (
                    <div key={msg.id} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{msg.subject || "General Message"}</p>
                          <p className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</p>
                        </div>
                        {getMessageStatusBadge(msg.status)}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-200 mt-2 whitespace-pre-line">{msg.message}</p>
                      {msg.agentResponse && (
                        <div className="mt-3 border-l-2 border-primary/40 pl-3 text-sm text-gray-700 dark:text-gray-200">
                          <p className="font-medium text-primary dark:text-primary-light">Agent Response</p>
                          <p className="whitespace-pre-line">{msg.agentResponse}</p>
                          {msg.respondedAt && (
                            <p className="text-xs text-gray-500 mt-1">{new Date(msg.respondedAt).toLocaleString()}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No messages yet. Start the conversation using the form.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RestaurantOwnerLayout>
  );
};

export default RequestRestaurant;
