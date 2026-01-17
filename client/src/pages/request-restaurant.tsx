import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RestaurantOwnerLayout from "@/components/layout/RestaurantOwnerLayout";
import { ArrowLeft, Store, Clock, Send } from "lucide-react";

interface RestaurantRequest {
  id: number;
  restaurantName: string;
  requestedMonths: number;
  status: string;
  createdAt: string;
  agentNotes?: string;
}

const RequestRestaurant = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const agentId = urlParams.get("agentId");
  
  const [formData, setFormData] = useState({
    restaurantName: "",
    restaurantDescription: "",
    cuisine: "",
    requestedMonths: "1",
    ownerNotes: ""
  });

  const { data: myRequests, isLoading: isLoadingRequests } = useQuery<RestaurantRequest[]>({
    queryKey: ["/api/restaurant-requests/my-requests"],
  });

  const submitRequestMutation = useMutation({
    mutationFn: async (data: typeof formData & { agentId: number }) => {
      const res = await apiRequest("POST", "/api/restaurant-requests", {
        ...data,
        requestedMonths: parseInt(data.requestedMonths)
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your restaurant request has been submitted to your agent.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-requests/my-requests"] });
      setFormData({
        restaurantName: "",
        restaurantDescription: "",
        cuisine: "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentId) {
      toast({
        title: "Error",
        description: "Agent ID is missing",
        variant: "destructive",
      });
      return;
    }
    submitRequestMutation.mutate({
      ...formData,
      agentId: parseInt(agentId)
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

  if (!agentId) {
    return (
      <RestaurantOwnerLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-600">No agent associated with your account. Please contact support.</p>
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

        <h1 className="text-2xl font-bold mb-6">Request Additional Restaurant</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                New Restaurant Request
              </CardTitle>
              <CardDescription>
                Submit a request to your agent for a new premium restaurant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="restaurantName">Restaurant Name *</Label>
                  <Input
                    id="restaurantName"
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                    placeholder="Enter restaurant name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="restaurantDescription">Description</Label>
                  <Textarea
                    id="restaurantDescription"
                    value={formData.restaurantDescription}
                    onChange={(e) => setFormData({ ...formData, restaurantDescription: e.target.value })}
                    placeholder="Brief description of your restaurant"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="cuisine">Cuisine Type</Label>
                  <Input
                    id="cuisine"
                    value={formData.cuisine}
                    onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                    placeholder="e.g., Italian, Ethiopian, Chinese"
                  />
                </div>

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
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                My Requests
              </CardTitle>
              <CardDescription>
                Status of your restaurant requests
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
      </div>
    </RestaurantOwnerLayout>
  );
};

export default RequestRestaurant;
