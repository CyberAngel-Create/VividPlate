import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../components/ui/table";
import { Badge } from "../components/ui/custom-badge";
import { Button } from "../components/ui/button";
import { formatDate, formatCurrency, getInitials } from "../lib/utils";

// Define types for our data
interface Restaurant {
  id: number;
  name: string;
  userId: number;
  email: string | null;
  description: string | null;
  cuisine: string | null;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
}

interface Subscription {
  id: number;
  userId: number;
  tier: string;
  startDate: string | Date;
  endDate: string | Date;
  paymentMethod: string;
  isActive: boolean;
}

interface Feedback {
  id: number;
  restaurantId: number;
  menuItemId: number;
  rating: number;
  comment: string | null;
  customerName: string | null;
  customerEmail: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string | Date;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("restaurants");

  // Fetch all restaurants
  const { data: restaurants, isLoading: isLoadingRestaurants } = useQuery({
    queryKey: ["/api/admin/restaurants"],
    enabled: activeTab === "restaurants" || activeTab === "overview"
  });

  // Fetch all subscriptions
  const { data: subscriptions, isLoading: isLoadingSubscriptions } = useQuery({
    queryKey: ["/api/admin/subscriptions"],
    enabled: activeTab === "subscriptions" || activeTab === "overview"
  });

  // Fetch all feedback
  const { data: allFeedback, isLoading: isLoadingFeedback } = useQuery({
    queryKey: ["/api/admin/feedback"],
    enabled: activeTab === "feedback"
  });

  // Helper function to approve feedback
  const approveFeedback = async (feedbackId: number) => {
    try {
      await fetch(`/api/admin/feedback/${feedbackId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        }
      });
      // Invalidate cache to refresh data
      window.location.reload();
    } catch (error) {
      console.error("Error approving feedback:", error);
    }
  };

  // Helper function to reject feedback
  const rejectFeedback = async (feedbackId: number) => {
    try {
      await fetch(`/api/admin/feedback/${feedbackId}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        }
      });
      // Invalidate cache to refresh data
      window.location.reload();
    } catch (error) {
      console.error("Error rejecting feedback:", error);
    }
  };

  // Loading state
  if ((activeTab === "restaurants" && isLoadingRestaurants) || 
      (activeTab === "subscriptions" && isLoadingSubscriptions) || 
      (activeTab === "feedback" && isLoadingFeedback) ||
      (activeTab === "overview" && (isLoadingRestaurants || isLoadingSubscriptions))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
        Admin Dashboard
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Restaurants</CardTitle>
                <CardDescription>All registered restaurants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{restaurants?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Premium Subscribers</CardTitle>
                <CardDescription>Active paid subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {subscriptions?.filter((sub: Subscription) => sub.tier === "premium" && sub.isActive).length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subscriptions?.slice(0, 3).map((sub: Subscription) => (
                    <div key={sub.id} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${sub.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>User #{sub.userId} subscribed to {sub.tier}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Restaurants Tab */}
        <TabsContent value="restaurants">
          <Card>
            <CardHeader>
              <CardTitle>All Restaurants</CardTitle>
              <CardDescription>Complete list of registered restaurants</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>A list of all restaurants registered on the platform.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Owner ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cuisine</TableHead>
                    <TableHead>Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restaurants?.map((restaurant: Restaurant) => (
                    <TableRow key={restaurant.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Avatar>
                            <AvatarImage src={restaurant.logoUrl || undefined} />
                            <AvatarFallback>{getInitials(restaurant.name)}</AvatarFallback>
                          </Avatar>
                          <span>{restaurant.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{restaurant.userId}</TableCell>
                      <TableCell>{restaurant.email || "N/A"}</TableCell>
                      <TableCell>{restaurant.cuisine || "N/A"}</TableCell>
                      <TableCell>{restaurant.address || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>All Subscriptions</CardTitle>
              <CardDescription>Complete list of user subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>A list of all subscriptions on the platform.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Payment Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions?.map((subscription: Subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>{subscription.userId}</TableCell>
                      <TableCell>
                        <Badge variant={subscription.tier === "premium" ? "default" : "outline"}>
                          {subscription.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={subscription.isActive ? "success" : "destructive"}>
                          {subscription.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(new Date(subscription.startDate))}</TableCell>
                      <TableCell>{formatDate(new Date(subscription.endDate))}</TableCell>
                      <TableCell>{subscription.paymentMethod}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Customer Feedback</CardTitle>
              <CardDescription>Review and manage customer feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Customer feedback from all restaurants.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Restaurant ID</TableHead>
                    <TableHead>Menu Item ID</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allFeedback?.map((feedback: Feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell>{feedback.restaurantId}</TableCell>
                      <TableCell>{feedback.menuItemId}</TableCell>
                      <TableCell>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg 
                              key={i} 
                              className={`w-4 h-4 ${i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{feedback.comment || "No comment"}</TableCell>
                      <TableCell>
                        {feedback.customerName || "Anonymous"}
                        {feedback.customerEmail && <div className="text-xs text-gray-500">{feedback.customerEmail}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            feedback.status === "approved" ? "success" : 
                            feedback.status === "rejected" ? "destructive" : 
                            "outline"
                          }
                        >
                          {feedback.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {feedback.status === "pending" && (
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => approveFeedback(feedback.id)}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-destructive text-destructive" 
                              onClick={() => rejectFeedback(feedback.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}