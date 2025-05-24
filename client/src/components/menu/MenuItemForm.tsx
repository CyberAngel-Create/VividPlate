import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MenuItem } from "@shared/schema";
import { X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import MenuItemImageUpload from "../upload/MenuItemImageUpload";

interface MenuItemFormProps {
  categoryId: number;
  item?: MenuItem;
  onSubmit: (data: Partial<MenuItem>) => Promise<void>;
}

const menuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  currency: z.string().default("ETB"),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().default(true),
  tagInput: z.string().optional(),
});

type FormValues = z.infer<typeof menuItemSchema>;

const MenuItemForm = ({ categoryId, item, onSubmit }: MenuItemFormProps) => {
  const [tags, setTags] = useState<string[]>(item?.tags || []);

  const form = useForm<FormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: item?.name || "",
      description: item?.description || "",
      price: item?.price || "",
      currency: item?.currency || "ETB",
      imageUrl: item?.imageUrl || "",
      isAvailable: item?.isAvailable !== false,
      tagInput: "",
    },
  });

  const addTag = () => {
    const tagInput = form.getValues("tagInput");
    if (tagInput && tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      form.setValue("tagInput", "");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (data: FormValues) => {
    const { tagInput, ...rest } = data;
    await onSubmit({
      ...rest,
      categoryId,
      tags,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <h2 className="text-lg font-heading font-semibold mb-4">
          {item ? "Edit Menu Item" : "Add Menu Item"}
        </h2>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Grilled Salmon" {...field} />
              </FormControl>
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
                  placeholder="Describe your menu item..." 
                  {...field} 
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                Be descriptive to entice your customers
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input placeholder="24.95" {...field} />
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
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value || "ETB"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue defaultValue={field.value || "ETB"}>
                        {field.value === "USD" && "USD ($)"}
                        {field.value === "ETB" && "ETB (Birr)"}
                        {field.value === "EUR" && "EUR (€)"}
                        {field.value === "GBP" && "GBP (£)"}
                        {field.value === "CAD" && "CAD (C$)"}
                        {field.value === "AUD" && "AUD (A$)"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="ETB">ETB (Birr)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                    <SelectItem value="AUD">AUD (A$)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Menu Item Image</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <MenuItemImageUpload
                    existingImageUrl={field.value}
                    onImageUploaded={(url) => field.onChange(url)}
                  />
                  {/* Keep this hidden input to maintain compatibility with form state */}
                  <Input
                    type="hidden"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Upload an image of your menu item (max 3MB)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isAvailable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Available</FormLabel>
                <FormDescription>
                  Toggle to mark the item as available or sold out
                </FormDescription>
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

        <div className="space-y-2">
          <FormLabel>Tags</FormLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center">
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {tags.length === 0 && (
              <span className="text-sm text-midgray italic">No tags added</span>
            )}
          </div>

          <div className="flex space-x-2">
            <FormField
              control={form.control}
              name="tagInput"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input 
                      placeholder="e.g. Gluten-Free, Spicy" 
                      {...field} 
                      onKeyDown={handleKeyDown}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={addTag}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
            {item ? "Update Item" : "Add Item"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MenuItemForm;