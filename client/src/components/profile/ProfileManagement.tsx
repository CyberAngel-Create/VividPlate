import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const ProfileManagement = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  
  // Profile update state
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiRequest("PUT", "/api/user/profile", profileData);
      
      if (response.ok) {
        toast({
          title: t("Profile Updated"),
          description: t("Your profile has been updated successfully"),
        });
        await refreshUser(); // Refresh user data in context
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
    } catch (error) {
      toast({
        title: t("Update Failed"),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: t("Passwords Do Not Match"),
        description: t("New password and confirmation must match"),
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const response = await apiRequest("PUT", "/api/user/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      if (response.ok) {
        toast({
          title: t("Password Changed"),
          description: t("Your password has been updated successfully"),
        });
        // Reset password fields
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }
    } catch (error) {
      toast({
        title: t("Password Change Failed"),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{t("Account Management")}</CardTitle>
        <CardDescription>
          {t("Update your account details and password")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="profile">{t("Profile Details")}</TabsTrigger>
            <TabsTrigger value="password">{t("Change Password")}</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <form onSubmit={updateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t("Username")}</Label>
                <Input 
                  id="username" 
                  value={user?.username} 
                  disabled 
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">{t("Username cannot be changed")}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("Full Name")}</Label>
                <Input 
                  id="fullName"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleProfileChange}
                  placeholder={t("Enter your full name")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">{t("Email Address")}</Label>
                <Input 
                  id="email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  placeholder={t("Enter your email")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">{t("Phone Number")}</Label>
                <Input 
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  placeholder={t("Enter your phone number")}
                />
              </div>
              
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Update Profile")}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="password">
            <form onSubmit={changePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t("Current Password")}</Label>
                <Input 
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("New Password")}</Label>
                <Input 
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("Confirm New Password")}</Label>
                <Input 
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Change Password")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end text-sm text-muted-foreground">
        {t("Last login")}: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : t("N/A")}
      </CardFooter>
    </Card>
  );
};

export default ProfileManagement;