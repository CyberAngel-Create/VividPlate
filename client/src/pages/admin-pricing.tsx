import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, Check, Plus, Pencil, Trash, Bookmark } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
// Using direct relative path to fix import issue
import AdminLayout from "../components/layout/AdminLayout";

interface PricingPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  isPopular: boolean;
  isActive: boolean;
  features: string[];
  tier: string;
  billingPeriod: string;
}

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(10, "Description needs to be at least 10 characters"),
  price: z.coerce.number().positive("Price must be positive"),
  currency: z.string().default("USD"),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  features: z.string().transform((val) => val.split("\n").filter(Boolean)),
  tier: z.string().default("free"),
  billingPeriod: z.string().default("monthly"),
});

type FormData = z.infer<typeof formSchema>;

const AdminPricingPage = () => {
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      currency: "USD",
      isPopular: false,
      isActive: true,
      features: "",
      tier: "free",
      billingPeriod: "monthly",
    },
  });

  const { data: plans, isLoading, error } = useQuery<PricingPlan[]>({
    queryKey: ["/api/admin/pricing"],
    placeholderData: [
      {
        id: 1,
        name: "Free",
        description: "Basic features for small restaurants",
        price: 0,
        currency: "USD",
        isPopular: false,
        isActive: true,
        features: ["1 restaurant", "1 menu", "AdSense integration", "QR code generation"],
        tier: "free",
        billingPeriod: "monthly",
      },
      {
        id: 2,
        name: "Premium",
        description: "Advanced features for growing businesses",
        price: 19.99,
        currency: "USD",
        isPopular: true,
        isActive: true,
        features: ["Up to 3 restaurants", "Multiple menus per restaurant", "No ads", "Customer feedback", "Analytics dashboard"],
        tier: "premium",
        billingPeriod: "monthly",
      }
    ],
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
          title: "Error loading pricing data",
          description: errorObj.message || "Something went wrong",
          variant: "destructive",
        });
      }
    }
  }, [error, setLocation, toast]);

  const createPlanMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/admin/pricing", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
      toast({
        title: "Plan created",
        description: "The pricing plan has been created successfully",
      });
      setIsFormOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create pricing plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({id, data}: {id: number, data: FormData}) => {
      const res = await apiRequest("PATCH", `/api/admin/pricing/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
      toast({
        title: "Plan updated",
        description: "The pricing plan has been updated successfully",
      });
      setIsFormOpen(false);
      setEditingPlan(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update pricing plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/pricing/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
      toast({
        title: "Plan deleted",
        description: "The pricing plan has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete pricing plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (editingPlan) {
      updatePlanMutation.mutate({id: editingPlan.id, data});
    } else {
      createPlanMutation.mutate(data);
    }
  };

  const handleEditPlan = (plan: PricingPlan) => {
    setEditingPlan(plan);
    form.reset({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      features: plan.features.join('\n'),
      tier: plan.tier,
      billingPeriod: plan.billingPeriod,
    });
    setIsFormOpen(true);
  };

  const handleAddPlan = () => {
    setEditingPlan(null);
    form.reset({
      name: "",
      description: "",
      price: 0,
      currency: "USD",
      isPopular: false,
      isActive: true,
      features: "",
      tier: "free",
      billingPeriod: "monthly",
    });
    setIsFormOpen(true);
  };

  const handleDeletePlan = (id: number) => {
    if (confirm("Are you sure you want to delete this pricing plan?")) {
      deletePlanMutation.mutate(id);
    }
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
          <h1 className="text-3xl font-bold">Pricing Plans</h1>
          <Button onClick={handleAddPlan}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans && plans.map((plan) => (
            <Card key={plan.id} className={`border-2 ${plan.isPopular ? 'border-primary' : 'border-border'}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                  </div>
                  {plan.isPopular && <Badge className="bg-primary">Popular</Badge>}
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    {plan.currency === 'USD' ? '$' : plan.currency} {plan.price}
                  </span>
                  <span className="text-muted-foreground">/{plan.billingPeriod}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Features</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-primary mr-2 mt-1" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <div>
                  <Badge variant={plan.isActive ? "default" : "outline"}>
                    {plan.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline" className="ml-2">
                    {plan.tier}
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleEditPlan(plan)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDeletePlan(plan.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Pricing Plan" : "Add New Pricing Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan 
                ? "Update the details of this pricing plan" 
                : "Create a new pricing plan for your platform"
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Plan name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tier</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                      >
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          {...field}
                        >
                          <option value="USD">USD</option>
                          <option value="ETB">ETB</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Plan description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Features (one per line)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter features, one per line" 
                        {...field} 
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <FormLabel className="block">Active</FormLabel>
                        <p className="text-sm text-muted-foreground">Show this plan to users</p>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isPopular"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <FormLabel className="block">Popular</FormLabel>
                        <p className="text-sm text-muted-foreground">Mark as popular plan</p>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="billingPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Period</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingPlan(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createPlanMutation.isPending || updatePlanMutation.isPending}>
                  {(createPlanMutation.isPending || updatePlanMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingPlan ? "Update Plan" : "Create Plan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPricingPage;