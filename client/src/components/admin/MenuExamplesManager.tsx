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
import { PlusCircle, Edit, Trash, Upload, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MenuExample, InsertMenuExample } from "@shared/schema";

const menuExampleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().min(1, "Subtitle is required"),
  imageUrl: z.string().min(1, "Image is required"),
  displayOrder: z.number().min(0, "Display order must be 0 or greater"),
  isActive: z.boolean(),
});

type MenuExampleFormData = z.infer<typeof menuExampleSchema>;

const MenuExamplesManager = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExample, setEditingExample] = useState<MenuExample | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingExample, setDeletingExample] = useState<MenuExample | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch menu examples
  const { data: examples, isLoading } = useQuery<MenuExample[]>({
    queryKey: ["/api/admin/menu-examples"],
  });

  // Add example mutation
  const addExampleMutation = useMutation({
    mutationFn: async (data: InsertMenuExample) => {
      const res = await apiRequest("POST", "/api/admin/menu-examples", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu-examples"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Menu example added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add menu example",
        variant: "destructive",
      });
    },
  });

  // Update example mutation
  const updateExampleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<MenuExample> }) => {
      const res = await apiRequest("PATCH", `/api/admin/menu-examples/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu-examples"] });
      setIsEditDialogOpen(false);
      setEditingExample(null);
      toast({
        title: "Success",
        description: "Menu example updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update menu example",
        variant: "destructive",
      });
    },
  });

  // Delete example mutation
  const deleteExampleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/menu-examples/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu-examples"] });
      setIsDeleteDialogOpen(false);
      setDeletingExample(null);
      toast({
        title: "Success",
        description: "Menu example deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete menu example",
        variant: "destructive",
      });
    },
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("category", "menu-examples");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
      return data.url;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const ExampleForm = ({ 
    example, 
    onSubmit 
  }: { 
    example?: MenuExample; 
    onSubmit: (data: MenuExampleFormData) => void;
  }) => {
    const form = useForm<MenuExampleFormData>({
      resolver: zodResolver(menuExampleSchema),
      defaultValues: {
        title: example?.title || "",
        subtitle: example?.subtitle || "",
        imageUrl: example?.imageUrl || "",
        displayOrder: example?.displayOrder || 0,
        isActive: example?.isActive ?? true,
      },
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingFile(file);
      try {
        const result = await uploadMutation.mutateAsync(file);
        form.setValue("imageUrl", result.url);
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setUploadingFile(null);
      }
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Pizza Delizioso" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subtitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subtitle</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Italian Pizzeria" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Input {...field} placeholder="Image URL" />
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                          disabled={uploadMutation.isPending}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadMutation.isPending ? "Uploading..." : "Upload Image"}
                        </Button>
                      </label>
                    </div>
                    {field.value && (
                      <img
                        src={field.value}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-md border"
                      />
                    )}
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
            <Button type="submit" disabled={addExampleMutation.isPending || updateExampleMutation.isPending}>
              {example ? "Update" : "Add"} Example
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  if (isLoading) {
    return <div className="p-6">Loading menu examples...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Beautiful Menu Examples</h1>
          <p className="text-gray-600">Manage the showcase examples on your homepage</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Example
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Menu Example</DialogTitle>
              <DialogDescription>
                Create a new showcase example for your homepage
              </DialogDescription>
            </DialogHeader>
            <ExampleForm onSubmit={(data) => addExampleMutation.mutate(data)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examples?.map((example) => (
          <Card key={example.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{example.title}</CardTitle>
                  <p className="text-sm text-gray-600">{example.subtitle}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge variant={example.isActive ? "default" : "secondary"}>
                    {example.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </Badge>
                  <Badge variant="outline">#{example.displayOrder}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <img
                src={example.imageUrl}
                alt={example.title}
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingExample(example);
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
                    setDeletingExample(example);
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
      {editingExample && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Menu Example</DialogTitle>
              <DialogDescription>
                Update the showcase example details
              </DialogDescription>
            </DialogHeader>
            <ExampleForm
              example={editingExample}
              onSubmit={(data) => updateExampleMutation.mutate({ id: editingExample.id, data })}
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
              This will permanently delete the menu example "{deletingExample?.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingExample && deleteExampleMutation.mutate(deletingExample.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MenuExamplesManager;