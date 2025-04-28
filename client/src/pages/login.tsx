import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Link } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  // User Login Form
  const userForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Admin Login Form
  const adminForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onUserSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/login", data);
      toast({
        title: "Success",
        description: t('common.successLogin'),
      });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: t('common.invalidCredentials'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onAdminSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/admin-login", data);
      toast({
        title: "Success",
        description: t('common.successAdminLogin'),
      });
      setLocation("/admin");
    } catch (error) {
      toast({
        title: "Error",
        description: t('common.invalidAdminCredentials'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-heading text-center">{t('common.login')} - MenuMate</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="user">{t('common.restaurantOwner')}</TabsTrigger>
              <TabsTrigger value="admin">{t('common.admin')}</TabsTrigger>
            </TabsList>
            
            {/* User Login Tab */}
            <TabsContent value="user">
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                  <FormField
                    control={userForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.username')}</FormLabel>
                        <FormControl>
                          <Input placeholder={`${t('common.username')}...`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.password')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={`${t('common.password')}...`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? `${t('common.login')}...` : t('common.login')}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* Admin Login Tab */}
            <TabsContent value="admin">
              <Form {...adminForm}>
                <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
                  <FormField
                    control={adminForm.control}
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
                    control={adminForm.control}
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
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? `${t('common.login')}...` : t('common.adminLogin')}
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    {t('common.adminOnly')}
                  </p>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center">
          <div className="text-sm text-midgray">
            {t('common.noAccount')}{" "}
            <Link href="/register">
              <a className="text-primary hover:underline">{t('common.register')}</a>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
