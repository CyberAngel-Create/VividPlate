import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Loader2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  Plus,
  Pencil,
  Trash,
  ExternalLink,
  Image,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// Using direct relative path to fix import issue
import AdminLayout from "../components/layout/AdminLayout";
import { Advertisement, InsertAdvertisement } from "@shared/schema";

// Advertisement form schema
const advertisementFormSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters"),
  description: z.string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  imageUrl: z.string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  linkUrl: z.string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
  position: z.enum(["top", "bottom", "sidebar"]).default("bottom"),
  startDate: z.date().optional(),
  endDate: z.date().optional().nullish(),
});

type AdvertisementFormData = z.infer<typeof advertisementFormSchema>;

const AdminAdvertisementsPage = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [adToModify, setAdToModify] = useState<Advertisement | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  
  // Fetch advertisements
  const { data: advertisements, isLoading, error } = useQuery<Advertisement[]>({
    queryKey: ["/api/admin/advertisements", page],
    placeholderData: (previousData) => previousData,
    retry: 1,
    gcTime: 0,
  });

  // Create advertisement form
  const form = useForm<AdvertisementFormData>({
    resolver: zodResolver(advertisementFormSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      isActive: true,
      position: "bottom",
      startDate: new Date(),
      endDate: null,
    },
  });

  // Create/Update advertisement mutation
  const advertisementMutation = useMutation({
    mutationFn: async (data: AdvertisementFormData & { id?: number }) => {
      const { id, ...adData } = data;
      
      if (id) {
        // Update existing advertisement
        const res = await apiRequest("PATCH", `/api/admin/advertisements/${id}`, adData);
        return res.json();
      } else {
        // Create new advertisement
        const res = await apiRequest("POST", "/api/admin/advertisements", adData);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
      toast({
        title: isEditing ? "Advertisement updated" : "Advertisement created",
        description: isEditing 
          ? "The advertisement has been updated successfully"
          : "The new advertisement has been created successfully",
      });
      setShowCreateDialog(false);
      form.reset();
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save advertisement. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete advertisement mutation
  const deleteAdvertisementMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/advertisements/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
      toast({
        title: "Advertisement deleted",
        description: "The advertisement has been deleted successfully",
      });
      setAdToModify(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete advertisement. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Populate form with advertisement data for editing
  useEffect(() => {
    if (adToModify && isEditing) {
      form.reset({
        title: adToModify.title,
        description: adToModify.description || "",
        imageUrl: adToModify.imageUrl || "",
        linkUrl: adToModify.linkUrl || "",
        isActive: adToModify.isActive,
        position: adToModify.position as "top" | "bottom" | "sidebar",
        startDate: adToModify.startDate ? new Date(adToModify.startDate) : new Date(),
        endDate: adToModify.endDate ? new Date(adToModify.endDate) : null,
      });
    }
  }, [adToModify, isEditing, form]);

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
          title: "Error loading advertisements data",
          description: errorObj.message || "Something went wrong",
          variant: "destructive",
        });
      }
    }
  }, [error, setLocation, toast]);

  // Filter advertisements by search term
  const filteredAdvertisements = advertisements?.filter(ad => 
    ad.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (ad.description && ad.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const onSubmitForm = (data: AdvertisementFormData) => {
    if (isEditing && adToModify) {
      advertisementMutation.mutate({ ...data, id: adToModify.id });
    } else {
      advertisementMutation.mutate(data);
    }
  };

  const handleDeleteAd = (ad: Advertisement) => {
    setAdToModify(ad);
    setShowConfirmDialog(true);
  };

  const handleEditAd = (ad: Advertisement) => {
    setAdToModify(ad);
    setIsEditing(true);
    setShowCreateDialog(true);
  };

  const handleConfirmDelete = () => {
    if (adToModify) {
      deleteAdvertisementMutation.mutate(adToModify.id);
      setShowConfirmDialog(false);
    }
  };

  const handleCreateNewAd = () => {
    setAdToModify(null);
    setIsEditing(false);
    form.reset({
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      isActive: true,
      position: "bottom",
      startDate: new Date(),
      endDate: null,
    });
    setShowCreateDialog(true);
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
          <h1 className="text-3xl font-bold">Advertisement Management</h1>
          <div className="flex items-center space-x-3">
            <Button 
              variant="default" 
              size="sm" 
              className="flex items-center gap-1 bg-primary hover:bg-primary/90"
              onClick={handleCreateNewAd}
            >
              <Plus className="h-4 w-4" />
              <span>Add Advertisement</span>
            </Button>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search advertisements..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-md shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdvertisements && filteredAdvertisements.length > 0 ? (
                filteredAdvertisements.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <p className="font-medium">{ad.title}</p>
                        {ad.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {ad.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ad.isActive ? "default" : "outline"}>
                        {ad.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{ad.position}</TableCell>
                    <TableCell>
                      {ad.imageUrl ? (
                        <div className="flex items-center">
                          <Image className="h-4 w-4 mr-1 text-blue-500" />
                          <span className="text-sm text-blue-500">Has Image</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No Image</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ad.linkUrl ? (
                        <div className="flex items-center">
                          <ExternalLink className="h-4 w-4 mr-1 text-blue-500" />
                          <a 
                            href={ad.linkUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 underline truncate max-w-[150px]"
                          >
                            {ad.linkUrl.replace(/(^\w+:|^)\/\//, '')}
                          </a>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No Link</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-sm">
                          {ad.startDate ? format(new Date(ad.startDate), 'MMM d, yyyy') : 'Not set'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-sm">
                          {ad.endDate ? format(new Date(ad.endDate), 'MMM d, yyyy') : 'No end date'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditAd(ad)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteAd(ad)}>
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    {searchTerm ? "No advertisements found matching your search" : "No advertisements found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {!searchTerm && advertisements && advertisements.length > 0 && (
            <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {page}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={advertisements.length < 10}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the advertisement "{adToModify?.title}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Advertisement Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Advertisement" : "Create New Advertisement"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update the advertisement details below" 
                : "Fill in the details to create a new advertisement"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form ref={formRef} onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter advertisement title" {...field} />
                    </FormControl>
                    <FormDescription>
                      The main title that will be displayed in the advertisement.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter advertisement description (optional)" 
                        className="resize-none min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Additional text to be displayed in the advertisement.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormDescription>
                        Direct link to the advertisement image (optional).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="linkUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Where users will be redirected when clicking the ad (optional).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                          <SelectItem value="sidebar">Sidebar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Where the advertisement will be displayed on the menu.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4 mt-8">
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active Status</FormLabel>
                        <FormDescription>
                          Whether this advertisement is currently active and visible to users.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} 
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : undefined;
                            field.onChange(date);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        When the advertisement will start showing.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} 
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : null;
                            field.onChange(date);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        When the advertisement will stop showing. Leave empty for no end date.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={() => {
                    form.reset();
                    setShowCreateDialog(false);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={advertisementMutation.isPending} 
                  className="w-full sm:w-auto"
                >
                  {advertisementMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? "Update Advertisement" : "Create Advertisement"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAdvertisementsPage;