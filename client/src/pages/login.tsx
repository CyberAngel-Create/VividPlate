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
      await apiRequest("POST", "/api/auth/login", data);

      // Verify the user is actually logged in before redirecting
      try {
        await apiRequest("GET", "/api/auth/me");
        
        // If we get here, the user is authenticated
        toast({
          title: "Success", 
          description: t('common.successLogin'),
        });
        
        // Add a slight delay before redirection to ensure session is properly set
        setTimeout(() => {
          window.location.href = "/dashboard"; // Use direct navigation instead of wouter
        }, 300);
        
        // Don't set isLoading to false as we're redirecting
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
        description: t('common.invalidCredentials'),
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-heading text-center">{t('common.login')} - DigitaMenuMate</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
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
                    <FormLabel>{t('common.username')}</FormLabel>
                    <FormControl>
                      <Input placeholder={`${t('common.username')}...`} {...field} />
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
                    <div className="flex justify-between items-center">
                      <FormLabel>{t('common.password')}</FormLabel>
                      <Link 
                        href="/forgot-password" 
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder={`${t('common.password')}...`} {...field} />
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
                {isLoading ? `${t('common.login')}...` : t('common.login')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center">
          <div className="text-sm text-midgray">
            {t('common.noAccount')}{" "}
            <Link href="/register" className="text-primary hover:underline">
              {t('common.register')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
