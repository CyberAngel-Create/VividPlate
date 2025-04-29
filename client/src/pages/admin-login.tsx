import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const AdminLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/admin-login", data);
      
      // Verify the admin is actually logged in before redirecting
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        const userData = await response.json();
        
        if (userData.isAdmin) {
          // If we get here, the admin is authenticated
          toast({
            title: "Success", 
            description: t('common.successAdminLogin'),
          });
          
          // Add a slight delay before redirection to ensure session is properly set
          setTimeout(() => {
            window.location.href = "/admin"; // Use direct navigation instead of wouter
          }, 300);
          
          // Don't set isLoading to false as we're redirecting
        } else {
          // User is logged in but not an admin
          toast({
            title: "Error",
            description: "Authentication succeeded but admin rights are required",
            variant: "destructive",
          });
          setIsLoading(false);
        }
      } catch (authError) {
        // If /api/auth/me fails, the session wasn't properly established
        console.error("Login succeeded but session verification failed", authError);
        toast({
          title: "Error",
          description: "Login successful but session could not be established. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: t('common.invalidAdminCredentials'),
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-heading text-center">{t('common.adminLogin')} - MenuMate</CardTitle>
          <CardDescription className="text-center">
            {t('common.adminOnly')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.adminUsername')}</FormLabel>
                    <FormControl>
                      <Input placeholder={`${t('common.adminUsername')}...`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.adminPassword')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={`${t('common.adminPassword')}...`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-[#ff5733] hover:bg-[#ff5733]/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? `${t('common.login')}...` : t('common.adminLogin')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center">
          <div className="text-sm text-midgray">
            <Link href="/login" className="text-primary hover:underline">{t('common.login')}</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;