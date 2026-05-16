import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger, 
  DialogTitle,
  DialogHeader,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { PlusCircle, Edit, Trash, Star, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Testimonial, InsertTestimonial } from "@shared/schema";

const testimonialSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerTitle: z.string().min(1, "Customer title is required"),
  customerInitials: z.string().min(2, "Customer initials must be at least 2 characters").max(3, "Customer initials must be at most 3 characters"),
  testimonialText: z.string().min(10, "Testimonial must be at least 10 characters"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  displayOrder: z.number().min(0, "Display order must be 0 or greater"),
  isActive: z.boolean(),
});

type TestimonialFormData = z.infer<typeof testimonialSchema>;

const TestimonialsManager = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingTestimonial, setDeletingTestimonial] = useState<Testimonial | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch testimonials
  const { data: testimonials, isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/testimonials"],
  });

  // Add testimonial mutation
  const addTestimonialMutation = useMutation({
    mutationFn: async (data: InsertTestimonial) => {
      const res = await apiRequest("POST", "/api/admin/testimonials", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Testimonial added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add testimonial",
        variant: "destructive",
      });
    },
  });

  // Update testimonial mutation
  const updateTestimonialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Testimonial> }) => {
      const res = await apiRequest("PATCH", `/api/admin/testimonials/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      setIsEditDialogOpen(false);
      setEditingTestimonial(null);
      toast({
        title: "Success",
        description: "Testimonial updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update testimonial",
        variant: "destructive",
      });
    },
  });

  // Delete testimonial mutation
  const deleteTestimonialMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/testimonials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      setIsDeleteDialogOpen(false);
      setDeletingTestimonial(null);
      toast({
        title: "Success",
        description: "Testimonial deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete testimonial",
        variant: "destructive",
      });
    },
  });

  const TestimonialForm = ({ 
    testimonial, 
    onSubmit 
  }: { 
    testimonial?: Testimonial; 
    onSubmit: (data: TestimonialFormData) => void;
  }) => {
    const form = useForm<TestimonialFormData>({
      resolver: zodResolver(testimonialSchema),
      defaultValues: {
        customerName: testimonial?.customerName || "",
        customerTitle: testimonial?.customerTitle || "",
        customerInitials: testimonial?.customerInitials || "",
        testimonialText: testimonial?.testimonialText || "",
        rating: testimonial?.rating || 5,
        displayOrder: testimonial?.displayOrder || 0,
        isActive: testimonial?.isActive ?? true,
      },
    });

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerInitials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Initials</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., JD" {...field} maxLength={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="customerTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Owner, The Grill House" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="testimonialText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Testimonial Text</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter the customer's testimonial..."
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Input 
                        type="number" 
                        min="1"
                        max="5"
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-20"
                      />
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-4 w-4 ${star <= field.value ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="rounded"
                  />
                </FormControl>
                <FormLabel>Active</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addTestimonialMutation.isPending || updateTestimonialMutation.isPending}>
              {testimonial ? "Update" : "Add"} Testimonial
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  if (isLoading) {
    return <div className="p-6">Loading testimonials...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customer Testimonials</h1>
          <p className="text-gray-600">Manage customer reviews and testimonials displayed on your homepage</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Testimonial</DialogTitle>
              <DialogDescription>
                Create a new customer testimonial for your homepage
              </DialogDescription>
            </DialogHeader>
            <TestimonialForm onSubmit={(data) => addTestimonialMutation.mutate(data)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {testimonials?.map((testimonial) => (
          <Card key={testimonial.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                    {testimonial.customerInitials}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{testimonial.customerName}</CardTitle>
                    <p className="text-sm text-gray-600">{testimonial.customerTitle}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge variant={testimonial.isActive ? "default" : "secondary"}>
                    {testimonial.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </Badge>
                  <Badge variant="outline">#{testimonial.displayOrder}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-4 w-4 ${star <= (testimonial.rating || 5) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">"{testimonial.testimonialText}"</p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingTestimonial(testimonial);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    setDeletingTestimonial(testimonial);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingTestimonial && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Testimonial</DialogTitle>
              <DialogDescription>
                Update the customer testimonial details
              </DialogDescription>
            </DialogHeader>
            <TestimonialForm
              testimonial={editingTestimonial}
              onSubmit={(data) => updateTestimonialMutation.mutate({ id: editingTestimonial.id, data })}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the testimonial from "{deletingTestimonial?.customerName}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingTestimonial && deleteTestimonialMutation.mutate(deletingTestimonial.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TestimonialsManager;