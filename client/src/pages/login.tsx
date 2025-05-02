import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useTranslation } from "react-i18next";
import { EyeIcon, EyeOffIcon } from "lucide-react";
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
import CustomerHeader from "../components/layout/CustomerHeader";
import Footer from "../components/layout/Footer";

const loginSchema = z.object({
  identifier: z.string().min(1, "Username or Email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  // User Login Form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
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
    <>
      <CustomerHeader />
      <div className="container mx-auto px-4 py-12 flex justify-center min-h-[calc(100vh-64px-380px)]">
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
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username or Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username or email..." {...field} />
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
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder={`${t('common.password')}...`} 
                            {...field} 
                          />
                          <button 
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOffIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
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
      <Footer />
    </>
  );
};

export default Login;
