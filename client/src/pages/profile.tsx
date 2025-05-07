import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Redirect } from "wouter";
import { Loader2, KeyRound, User, Mail, Save } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import RestaurantOwnerLayout from "@/components/layout/RestaurantOwnerLayout";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const ProfilePage = () => {
  const { user, isLoading, logoutMutation } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { subscription, isPaid } = useSubscription();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  
  // Define the profile update schema
  const profileUpdateSchema = z.object({
    username: z.string().min(3, t("Username must be at least 3 characters")),
    email: z.string().email(t("Please provide a valid email address")),
    fullName: z.string().optional(),
  });

  // Define the password change schema
  const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, t("Current password is required")),
    newPassword: z.string().min(8, t("New password must be at least 8 characters")),
    confirmNewPassword: z.string().min(8, t("Please confirm your new password")),
  }).refine(
    (data) => data.newPassword === data.confirmNewPassword,
    {
      message: t("Passwords do not match"),
      path: ["confirmNewPassword"],
    }
  );
  
  // Initialize the form
  const profileForm = useForm<z.infer<typeof profileUpdateSchema>>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      fullName: user?.fullName || "",
    },
  });
  
  // Initialize the password change form
  const passwordForm = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });
  
  // Update profile handler
  const handleUpdateProfile = async (values: z.infer<typeof profileUpdateSchema>) => {
    setIsUpdating(true);
    
    try {
      const response = await apiRequest(
        "PUT",
        "/api/user/profile",
        values
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("Failed to update profile"));
      }
      
      // Invalidate user query to refetch updated user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: t("Profile Updated"),
        description: t("Your profile has been updated successfully"),
      });
    } catch (error) {
      toast({
        title: t("Update Failed"),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Change password handler
  const handleChangePassword = async (values: z.infer<typeof passwordChangeSchema>) => {
    try {
      const response = await apiRequest(
        "PUT",
        "/api/user/change-password",
        {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("Failed to change password"));
      }
      
      toast({
        title: t("Password Changed"),
        description: t("Your password has been changed successfully"),
      });
      
      passwordForm.reset();
      setIsChangePasswordDialogOpen(false);
    } catch (error) {
      toast({
        title: t("Password Change Failed"),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <RestaurantOwnerLayout>
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-heading font-bold">{t("Profile Management")}</h1>
          
          {isPaid && (
            <PremiumBadge size="md" />
          )}
        </div>
      
        <div className="grid gap-8">
          {/* Personal Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("Personal Information")}</CardTitle>
              <CardDescription>
                {t("Update your account information")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Username")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-3 top-3 text-gray-400">
                              <User className="h-4 w-4" />
                            </div>
                            <Input className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Email Address")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-3 top-3 text-gray-400">
                              <Mail className="h-4 w-4" />
                            </div>
                            <Input className="pl-10" type="email" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Full Name")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("Updating...")}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t("Save Changes")}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Password Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("Security")}</CardTitle>
              <CardDescription>
                {t("Manage your account security settings")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium mb-1">{t("Password")}</div>
                  <div className="text-sm text-muted-foreground">
                    {t("Change your account password")}
                  </div>
                </div>
                <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <KeyRound className="h-4 w-4 mr-2" />
                      {t("Change Password")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("Change Password")}</DialogTitle>
                      <DialogDescription>
                        {t("Enter your current password and a new password")}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("Current Password")}</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("New Password")}</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmNewPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("Confirm New Password")}</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter className="mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsChangePasswordDialogOpen(false)}
                          >
                            {t("Cancel")}
                          </Button>
                          <Button type="submit">
                            {t("Change Password")}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RestaurantOwnerLayout>
  );
};

export default ProfilePage;