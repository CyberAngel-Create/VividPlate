import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Loader2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  UserCheck,
  UserX,
  Crown,
  Trash,
  UserPlus,
  Eye,
  EyeOff
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// Using direct relative path to fix import issue
import AdminLayout from "../components/layout/AdminLayout";
import { User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

// Admin user registration schema
const adminFormSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username cannot exceed 50 characters"),
  email: z.string()
    .email("Please enter a valid email address"),
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type AdminFormData = z.infer<typeof adminFormSchema>;

const UsersAdminPage = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [userToModify, setUserToModify] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"status" | "subscription" | null>(null);
  const [actionValue, setActionValue] = useState<boolean | string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCreateAdminDialog, setShowCreateAdminDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create admin form
  const form = useForm<AdminFormData>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: async (data: AdminFormData) => {
      const { confirmPassword, ...adminData } = data;
      const res = await apiRequest("POST", "/api/admin/users/create-admin", adminData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Admin created",
        description: "The new admin user has been created successfully",
      });
      setShowCreateAdminDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmitAdminForm = (data: AdminFormData) => {
    createAdminMutation.mutate(data);
  };

  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/admin/users", page],
    placeholderData: (previousData) => previousData, // Similar to keepPreviousData but with correct syntax
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
          title: "Error loading users data",
          description: errorObj.message || "Something went wrong",
          variant: "destructive",
        });
      }
    }
  }, [error, setLocation, toast]);

  // Filter users by search term
  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle user active status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number, isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/status`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Status updated",
        description: `User ${userToModify?.username} has been ${actionValue ? "activated" : "deactivated"}.`,
      });
      setUserToModify(null);
      setActionType(null);
      setActionValue(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update user subscription mutation
  const updateUserSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, subscriptionTier }: { userId: number, subscriptionTier: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/subscription`, { subscriptionTier });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Subscription updated",
        description: `User ${userToModify?.username}'s subscription tier has been updated to ${actionValue}.`,
      });
      setUserToModify(null);
      setActionType(null);
      setActionValue(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmAction = () => {
    if (!userToModify || !actionType) return;

    if (actionType === "status" && typeof actionValue === "boolean") {
      toggleUserStatusMutation.mutate({
        userId: userToModify.id,
        isActive: actionValue,
      });
    } else if (actionType === "subscription" && typeof actionValue === "string") {
      updateUserSubscriptionMutation.mutate({
        userId: userToModify.id,
        subscriptionTier: actionValue,
      });
    }

    setShowConfirmDialog(false);
  };

  const handleToggleStatus = (user: User, value: boolean) => {
    setUserToModify(user);
    setActionType("status");
    setActionValue(value);
    setShowConfirmDialog(true);
  };

  const handleUpdateSubscription = (user: User, tier: string) => {
    setUserToModify(user);
    setActionType("subscription");
    setActionValue(tier);
    setShowConfirmDialog(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getConfirmationMessage = () => {
    if (!userToModify || !actionType) return "";

    if (actionType === "status") {
      return actionValue 
        ? `Are you sure you want to activate user "${userToModify.username}"?` 
        : `Are you sure you want to deactivate user "${userToModify.username}"?`;
    }

    if (actionType === "subscription") {
      return `Are you sure you want to change the subscription tier for "${userToModify.username}" to ${actionValue}?`;
    }

    return "";
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Users</h1>
          <div className="flex items-center space-x-3">
            <Button 
              variant="default" 
              size="sm" 
              className="flex items-center gap-1 bg-primary hover:bg-primary/90"
              onClick={() => setShowCreateAdminDialog(true)}
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Admin</span>
            </Button>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-md shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div>
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "outline"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={user.subscriptionTier === 'premium' ? 'bg-purple-500' : undefined}
                      >
                        {user.subscriptionTier === 'premium' ? "Premium" : "Free"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.createdAt
                        ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
                        : "Unknown"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {user.isActive ? (
                            <DropdownMenuItem onClick={() => handleToggleStatus(user, false)}>
                              <UserX className="mr-2 h-4 w-4" />
                              <span>Deactivate</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleToggleStatus(user, true)}>
                              <UserCheck className="mr-2 h-4 w-4" />
                              <span>Activate</span>
                            </DropdownMenuItem>
                          )}
                          {user.subscriptionTier === 'free' ? (
                            <DropdownMenuItem onClick={() => handleUpdateSubscription(user, 'premium')}>
                              <Crown className="mr-2 h-4 w-4" />
                              <span>Upgrade to Premium</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUpdateSubscription(user, 'free')}>
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Downgrade to Free</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    {searchTerm ? "No users found matching your search" : "No users found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {!searchTerm && users && users.length > 0 && (
            <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {page}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={users.length < 10}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {getConfirmationMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showCreateAdminDialog} onOpenChange={setShowCreateAdminDialog}>
        <DialogContent className="sm:max-w-[425px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Admin User</DialogTitle>
            <DialogDescription>
              Create a new administrator account for the platform
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitAdminForm)} className="space-y-4 py-2">
              {/* Form fields in a more compact layout */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="mb-2">
                    <FormLabel className="text-sm">Full Name</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="mb-2">
                    <FormLabel className="text-sm">Username</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="admin_username" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="mb-2">
                    <FormLabel className="text-sm">Email</FormLabel>
                    <FormControl>
                      <Input className="h-9" type="email" placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="mb-2">
                    <FormLabel className="text-sm">Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          className="h-9"
                          type={showPassword ? "text" : "password"} 
                          placeholder="Create a secure password" 
                          {...field} 
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute right-2 top-1.5 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="mb-2">
                    <FormLabel className="text-sm">Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        className="h-9"
                        type={showPassword ? "text" : "password"} 
                        placeholder="Repeat your password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={() => {
                    form.reset();
                    setShowCreateAdminDialog(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createAdminMutation.isPending} className="w-full sm:w-auto">
                  {createAdminMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Admin
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default UsersAdminPage;