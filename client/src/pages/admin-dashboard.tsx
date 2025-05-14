import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, Users, DollarSign, Award, Activity, Calendar, 
  BarChart3, LineChart, UsersRound, Eye, Timer
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocation } from "wouter";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
// Using direct relative path to fix import issue
import AdminLayout from "../components/layout/AdminLayout";
import { User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type UserData = {
  totalUsers: number;
  activeUsers: number;
  freeUsers: number;
  paidUsers: number;
  recentUsers: User[];
  registrationStats: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  viewStats: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
    total: number;
  };
};

type StatCard = {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

const AdminDashboard = () => {
  const [, setLocation] = useLocation();
  
  const { toast } = useToast();
  
  const { data, isLoading, error } = useQuery<UserData>({
    queryKey: ["/api/admin/dashboard"],
    retry: 1,
    gcTime: 0,
  });

  // Redirect to login page if unauthorized and show toast notification
  useEffect(() => {
    if (error) {
      const errorObj = error as any;
      if (errorObj.status === 401 || errorObj.status === 403) {
        toast({
          title: "Authentication Error",
          description: "Please log in as an admin to access this page",
          variant: "destructive",
        });
        setLocation("/admin-login");
      } else {
        toast({
          title: "Error loading dashboard data",
          description: errorObj.message || "Something went wrong",
          variant: "destructive",
        });
      }
    }
  }, [error, setLocation, toast]);

  const statCards: StatCard[] = [
    {
      title: "Total Users",
      value: data?.totalUsers || 0,
      description: "Total registered users",
      icon: <Users className="h-5 w-5" />,
      color: "bg-blue-500",
    },
    {
      title: "Active Users",
      value: data?.activeUsers || 0,
      description: "Active users in the last 30 days",
      icon: <Activity className="h-5 w-5" />,
      color: "bg-green-500",
    },
    {
      title: "Free Users",
      value: data?.freeUsers || 0,
      description: "Users on free tier",
      icon: <Calendar className="h-5 w-5" />,
      color: "bg-orange-500",
    },
    {
      title: "Paid Users",
      value: data?.paidUsers || 0,
      description: "Users on premium tier",
      icon: <DollarSign className="h-5 w-5" />,
      color: "bg-purple-500",
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const getSubscriptionBadge = (tier: string) => {
    if (tier === 'premium') {
      return <Badge className="bg-purple-500">Premium</Badge>;
    }
    return <Badge>Free</Badge>;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {/* Stats Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{card.value}</div>
                  <div className={`p-2 rounded-full ${card.color} text-white`}>
                    {card.icon}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="registration" className="mb-8">
          <CardHeader className="px-0 pt-0">
            <div className="flex items-center justify-between">
              <CardTitle>Analytics Dashboard</CardTitle>
              <TabsList>
                <TabsTrigger value="registration" className="flex items-center">
                  <UsersRound className="h-4 w-4 mr-2" />
                  Registration Analytics
                </TabsTrigger>
                <TabsTrigger value="views" className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Views Analytics
                </TabsTrigger>
              </TabsList>
            </div>
            <CardDescription>
              User registration and website traffic analytics
            </CardDescription>
          </CardHeader>

          <TabsContent value="registration" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Daily New Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{data?.registrationStats?.daily || 0}</div>
                    <div className="p-2 rounded-full bg-blue-500 text-white">
                      <UsersRound className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    New registrations in the last 24 hours
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Weekly New Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{data?.registrationStats?.weekly || 0}</div>
                    <div className="p-2 rounded-full bg-green-500 text-white">
                      <LineChart className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    New registrations in the last 7 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Monthly New Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{data?.registrationStats?.monthly || 0}</div>
                    <div className="p-2 rounded-full bg-purple-500 text-white">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    New registrations in the last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Yearly New Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{data?.registrationStats?.yearly || 0}</div>
                    <div className="p-2 rounded-full bg-orange-500 text-white">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    New registrations in the last 365 days
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="views" className="space-y-4">
            {/* Total Views Card */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Menu Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{data?.viewStats?.total || 0}</div>
                  <div className="p-3 rounded-full bg-red-500 text-white">
                    <Eye className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total menu views since launch
                </p>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Daily Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{data?.viewStats?.daily || 0}</div>
                    <div className="p-2 rounded-full bg-blue-500 text-white">
                      <Eye className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Website views in the last 24 hours
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Weekly Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{data?.viewStats?.weekly || 0}</div>
                    <div className="p-2 rounded-full bg-green-500 text-white">
                      <LineChart className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Website views in the last 7 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Monthly Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{data?.viewStats?.monthly || 0}</div>
                    <div className="p-2 rounded-full bg-purple-500 text-white">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Website views in the last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Yearly Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{data?.viewStats?.yearly || 0}</div>
                    <div className="p-2 rounded-full bg-orange-500 text-white">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Website views in the last 365 days
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Recent Users Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>
                Recently registered users on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.recentUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div>
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getSubscriptionBadge(user.subscriptionTier || 'free')}
                      </TableCell>
                      <TableCell>
                        {user.createdAt 
                          ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
                          : 'Unknown'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!data?.recentUsers || data.recentUsers.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;