import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MenuCategory } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryFormProps {
  category?: MenuCategory;
  onSubmit: (data: Omit<MenuCategory, "id">) => Promise<void>;
}

// Define the main category type
export type MainCategory = "Food" | "Beverage";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  displayOrder: z.number().optional(),
  mainCategory: z.enum(["Food", "Beverage"] as const).default("Food"),
});

type FormValues = z.infer<typeof categorySchema>;

const CategoryForm = ({ category, onSubmit }: CategoryFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      displayOrder: category?.displayOrder || 0,
      mainCategory: (category?.mainCategory as "Food" | "Beverage") || "Food",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    // The restaurantId will be added in the server route
    const data = {
      ...values,
      restaurantId: category?.restaurantId || 0
    };
    await onSubmit(data as Omit<MenuCategory, "id">);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <h2 className="text-lg font-heading font-semibold mb-4">
          {category ? "Edit Category" : "Add Category"}
        </h2>
        
        <FormField
          control={form.control}
          name="mainCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Main Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select main category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Beverage">Beverage</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Appetizers, Main Courses" {...field} />
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
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button type="submit" className="bg-secondary text-white hover:bg-secondary/90">
            {category ? "Update Category" : "Add Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CategoryForm;
