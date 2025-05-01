import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, ChevronDown, Users, Database, Store, Coffee, UserCheck, Plus, Trash, UserX, Edit, Check, X } from "lucide-react";
import { User, Restaurant as RestaurantType, Subscription, Feedback } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/layout/AdminLayout";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [restaurantPage, setRestaurantPage] = useState(1);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Dashboard overview data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<UserData>({
    queryKey: ["/api/admin/dashboard"],
    enabled: activeTab === "overview",
  });

  // Users listing
  const { data: users, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users", userPage, searchQuery],
    enabled: activeTab === "users",
  });

  // Restaurants listing
  const { data: restaurants, isLoading: isRestaurantsLoading } = useQuery<RestaurantType[]>({
    queryKey: ["/api/admin/restaurants", restaurantPage, searchQuery],
    enabled: activeTab === "restaurants",
  });

  const handleUserSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setUserPage(1); // Reset to first page on new search
  };

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      await apiRequest("PATCH", `/api/admin/users/${userId}/status`, { isActive });
      toast({
        title: "User status updated",
        description: `User is now ${isActive ? "active" : "inactive"}`,
      });
    } catch (error) {
      toast({
        title: "Error updating user status",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUserSubscription = async (userId: number, subscriptionTier: string) => {
    try {
      await apiRequest("PATCH", `/api/admin/users/${userId}/subscription`, { subscriptionTier });
      toast({
        title: "Subscription updated",
        description: `User subscription tier changed to ${subscriptionTier}`,
      });
    } catch (error) {
      toast({
        title: "Error updating subscription",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await apiRequest("POST", "/api/admin/users", {
        username: formData.get("username"),
        email: formData.get("email"),
        fullName: formData.get("fullName"),
        password: formData.get("password"),
        subscriptionTier: formData.get("subscriptionTier"),
      });
      
      toast({
        title: "User created successfully",
        description: "The new user has been added to the system",
      });
      
      setIsCreateUserDialogOpen(false);
    } catch (error) {
      toast({
        title: "Failed to create user",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await apiRequest("DELETE", `/api/admin/users/${userId}`);
        toast({
          title: "User deleted",
          description: "The user has been permanently deleted",
        });
      } catch (error) {
        toast({
          title: "Error deleting user",
          description: "An error occurred. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Overview dashboard stats
  const renderStats = () => {
    if (!dashboardData) return null;

    const stats: StatCard[] = [
      {
        title: "Total Users",
        value: dashboardData.totalUsers,
        description: "All registered users",
        icon: <Users className="h-5 w-5" />,
        color: "bg-blue-500/10 text-blue-500",
      },
      {
        title: "Active Users",
        value: dashboardData.activeUsers,
        description: "Currently active users",
        icon: <UserCheck className="h-5 w-5" />,
        color: "bg-green-500/10 text-green-500",
      },
      {
        title: "Free Users",
        value: dashboardData.freeUsers,
        description: "Users on free tier",
        icon: <Coffee className="h-5 w-5" />,
        color: "bg-amber-500/10 text-amber-500",
      },
      {
        title: "Paid Users",
        value: dashboardData.paidUsers,
        description: "Premium subscribers",
        icon: <Database className="h-5 w-5" />,
        color: "bg-purple-500/10 text-purple-500",
      },
    ];

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-full p-2 ${stat.color}`}>{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Recent users table
  const renderRecentUsers = () => {
    if (!dashboardData?.recentUsers) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Users who recently joined the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Subscription</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboardData.recentUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.subscriptionTier === "premium" ? "bg-purple-100 text-purple-800" : "bg-gray-100"
                    }`}>
                      {user.subscriptionTier}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  // All users management table
  const renderUsersList = () => {
    if (isUsersLoading) {
      return (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!users || users.length === 0) {
      return (
        <div className="text-center p-8">
          <p className="text-muted-foreground">No users found</p>
        </div>
      );
    }

    return (
      <>
        <div className="bg-white rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={user.subscriptionTier || "free"}
                      onValueChange={(value) => handleUpdateUserSubscription(user.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Subscription" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span 
                        className={`inline-block h-2 w-2 rounded-full mr-2 ${
                          user.isActive ? "bg-green-500" : "bg-red-500"
                        }`} 
                      />
                      {user.isActive ? "Active" : "Inactive"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleUserStatus(user.id, !user.isActive)}
                      >
                        {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditUserDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setUserPage(p => Math.max(1, p - 1))} 
                className={userPage === 1 ? "pointer-events-none opacity-50" : ""} 
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink isActive>{userPage}</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext 
                onClick={() => setUserPage(p => p + 1)}
                className={!users || users.length < 10 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </>
    );
  };

  // Restaurants list
  const renderRestaurantsList = () => {
    if (isRestaurantsLoading) {
      return (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!restaurants || restaurants.length === 0) {
      return (
        <div className="text-center p-8">
          <p className="text-muted-foreground">No restaurants found</p>
        </div>
      );
    }

    return (
      <>
        <div className="bg-white rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Owner ID</TableHead>
                <TableHead>Cuisine</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurants.map((restaurant) => (
                <TableRow key={restaurant.id}>
                  <TableCell>{restaurant.id}</TableCell>
                  <TableCell>{restaurant.name}</TableCell>
                  <TableCell>{restaurant.userId}</TableCell>
                  <TableCell>{restaurant.cuisine || "-"}</TableCell>
                  <TableCell>{restaurant.address || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Coffee className="h-4 w-4 mr-2" />
                        View Menu
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setRestaurantPage(p => Math.max(1, p - 1))} 
                className={restaurantPage === 1 ? "pointer-events-none opacity-50" : ""} 
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink isActive>{restaurantPage}</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext 
                onClick={() => setRestaurantPage(p => p + 1)}
                className={!restaurants || restaurants.length < 10 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </>
    );
  };

  // Create user dialog
  const renderCreateUserDialog = () => (
    <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleCreateUser}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" required />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="subscriptionTier">Subscription Tier</Label>
              <Select name="subscriptionTier" defaultValue="free">
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create User</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  // Edit user dialog
  const renderEditUserDialog = () => {
    if (!selectedUser) return null;
    
    return (
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>
          
          <form>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input id="edit-username" defaultValue={selectedUser.username} />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" defaultValue={selectedUser.email} />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-fullName">Full Name</Label>
                <Input id="edit-fullName" defaultValue={selectedUser.fullName} />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-subscription">Subscription Tier</Label>
                <Select defaultValue={selectedUser.subscriptionTier || "free"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select defaultValue={selectedUser.isActive ? "active" : "inactive"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-4">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
          </TabsList>
          
          <div className="mb-4">
            {activeTab !== "overview" && (
              <div className="flex justify-between mb-4">
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={handleUserSearch}
                  />
                  <Button type="submit" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                
                {activeTab === "users" && (
                  <Button onClick={() => setIsCreateUserDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <TabsContent value="overview" className="space-y-4">
            {isDashboardLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {renderStats()}
                {renderRecentUsers()}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="users">
            {renderUsersList()}
          </TabsContent>
          
          <TabsContent value="restaurants">
            {renderRestaurantsList()}
          </TabsContent>
        </Tabs>
      </div>
      
      {renderCreateUserDialog()}
      {renderEditUserDialog()}
    </AdminLayout>
  );
};

export default AdminDashboard;