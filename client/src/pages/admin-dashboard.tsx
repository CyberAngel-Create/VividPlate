import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, DollarSign, Award, Activity, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocation } from "wouter";
// Using direct relative path to fix import issue
import AdminLayout from "../components/layout/AdminLayout";
import { User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

type UserData = {
  totalUsers: number;
  activeUsers: number;
  freeUsers: number;
  paidUsers: number;
  recentUsers: User[];
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
  
  const { data, isLoading, error } = useQuery<UserData>({
    queryKey: ["/api/admin/dashboard"],
    retry: false,
  });

  // Redirect to login page if unauthorized
  useEffect(() => {
    if (error) {
      const errorObj = error as any;
      if (errorObj.status === 401 || errorObj.status === 403) {
        setLocation("/admin-login");
      }
    }
  }, [error, setLocation]);

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
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                          </Avatar>
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