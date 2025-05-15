import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, Save, MapPin, Mail, Phone } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
// Using direct relative path to fix import issue
import AdminLayout from "../components/layout/AdminLayout";

interface ContactInfo {
  id: number;
  address: string;
  email: string;
  phone: string;
  openHours?: string;
  latitude?: number;
  longitude?: number;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

const formSchema = z.object({
  address: z.string().min(5, "Address is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(5, "Phone number is required"),
  openHours: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const AdminContactInfoPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "Ethiopia, Addis Abeba",
      email: "vividplate.spp@gmail.com",
      phone: "+251-913-690-687",
      openHours: "Monday - Sunday: 9:00 AM - 10:00 PM",
      latitude: 0,
      longitude: 0,
      facebook: "",
      twitter: "",
      instagram: "",
    },
  });

  // Load from real API in a production environment
  const { data: contactInfo } = useQuery<ContactInfo>({
    queryKey: ["/api/admin/contact-info"],
    placeholderData: {
      id: 1,
      address: "Ethiopia, Addis Abeba",
      email: "vividplate.spp@gmail.com",
      phone: "+251-913-690-687",
      openHours: "Monday - Sunday: 9:00 AM - 10:00 PM",
      socialMedia: {
        facebook: "",
        twitter: "",
        instagram: "",
      }
    },
    retry: 1,
    gcTime: 0,
  });

  useEffect(() => {
    if (contactInfo) {
      form.reset({
        address: contactInfo.address,
        email: contactInfo.email,
        phone: contactInfo.phone,
        openHours: contactInfo.openHours,
        latitude: contactInfo.latitude,
        longitude: contactInfo.longitude,
        facebook: contactInfo.socialMedia?.facebook,
        twitter: contactInfo.socialMedia?.twitter,
        instagram: contactInfo.socialMedia?.instagram,
      });
    }
  }, [contactInfo, form]);

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
          title: "Error loading contact information",
          description: errorObj.message || "Something went wrong",
          variant: "destructive",
        });
      }
    }
  }, [error, setLocation, toast]);

  const updateContactMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Transform the form data to match the API expected format
      const transformedData = {
        ...data,
        socialMedia: {
          facebook: data.facebook,
          twitter: data.twitter,
          instagram: data.instagram
        }
      };
      
      // Remove the individual social media fields from the root object
      delete (transformedData as any).facebook;
      delete (transformedData as any).twitter;
      delete (transformedData as any).instagram;
      
      const res = await apiRequest("PATCH", "/api/admin/contact-info", transformedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contact-info"] });
      toast({
        title: "Contact information updated",
        description: "The contact information has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update contact information. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateContactMutation.mutate(data);
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
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Contact Information</h1>
        </div>

        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl">Update Company Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            Address
                          </div>
                        </FormLabel>
                        <FormControl>
                          <Textarea placeholder="Company address" {...field} className="min-h-[60px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2" />
                              Email
                            </div>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="contact@example.com" {...field} />
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
                          <FormLabel>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              Phone
                            </div>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="openHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opening Hours</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Monday - Friday: 9:00 AM - 5:00 PM" {...field} className="min-h-[60px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude (optional)</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude (optional)</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Social Media (optional)</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="facebook"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Facebook URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://facebook.com/yourpage" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="twitter"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Twitter URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://twitter.com/yourhandle" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="instagram"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2 md:col-span-1">
                              <FormLabel>Instagram URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://instagram.com/yourhandle" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-2">
                  <Button type="submit" className="w-full sm:w-auto" disabled={updateContactMutation.isPending}>
                    {updateContactMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminContactInfoPage;