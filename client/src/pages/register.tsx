import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import CustomerHeader from "@/components/layout/CustomerHeader";
import Footer from "@/components/layout/Footer";
import { PhoneInput } from "@/components/ui/phone-input";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registrationData } = data;
      
      await apiRequest("POST", "/api/auth/register", registrationData);
      
      // Attempt to log in the user automatically after registration
      try {
        await apiRequest("POST", "/api/auth/login", {
          username: data.username,
          password: data.password
        });
        
        // Verify login success
        try {
          await apiRequest("GET", "/api/auth/me");
          
          toast({
            title: "Success",
            description: "Your account has been created and you are now logged in.",
          });
          
          // Add a slight delay before redirection to ensure session is properly set
          setTimeout(() => {
            window.location.href = "/dashboard"; // Use direct navigation instead of wouter
          }, 300);
          
          // Don't set isLoading to false as we're redirecting
        } catch (verifyError) {
          // Login verification failed, redirect to login page
          toast({
            title: "Success",
            description: "Your account has been created. Please log in.",
          });
          
          setTimeout(() => {
            window.location.href = "/login"; // Use direct navigation instead of wouter
          }, 300);
        }
      } catch (loginError) {
        // Auto-login failed, redirect to login page
        toast({
          title: "Success",
          description: "Your account has been created. Please log in.",
        });
        
        setLocation("/login");
        setIsLoading(false);
      }
    } catch (error: any) {
      let errorMessage = "An error occurred during registration";
      
      if (error.message && error.message.includes("Username already exists")) {
        errorMessage = "Username already exists";
      } else if (error.message && error.message.includes("Email already exists")) {
        errorMessage = "Email already exists";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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
            <CardTitle className="text-2xl font-heading text-center">Create an Account</CardTitle>
            <CardDescription className="text-center">
              Enter your details to create your VividPlate account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Your email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <PhoneInput
                          label="Phone Number"
                          placeholder="Enter your phone number"
                          value={field.value}
                          onChange={field.onChange}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Create a username" {...field} />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Create a password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your password" {...field} />
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
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 text-center">
            <div className="text-sm text-midgray">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default Register;
