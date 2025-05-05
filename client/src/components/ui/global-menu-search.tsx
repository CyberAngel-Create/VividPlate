import { useState, useEffect, useMemo } from "react";
import { MenuItem, MenuCategory } from "@shared/schema";
import { Search, X, Menu, ArrowUpDown, Edit, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GlobalMenuSearchProps {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  onEditItem?: (id: number) => void;
  onDeleteItem?: (id: number) => void;
}

type SortField = "name" | "category" | "price";
type SortDirection = "asc" | "desc";
type SortState = {
  field: SortField;
  direction: SortDirection;
};

const GlobalMenuSearch = ({ categories, menuItems, onEditItem, onDeleteItem }: GlobalMenuSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [, setLocation] = useLocation();
  const [sort, setSort] = useState<SortState>({ field: "name", direction: "asc" });

  // Create a lookup map for category names by ID for faster access
  const categoryMap = useMemo(() => {
    const map: Record<number, string> = {};
    categories.forEach(cat => {
      map[cat.id] = cat.name;
    });
    return map;
  }, [categories]);

  // Filter menu items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return menuItems;
    }

    const term = searchTerm.toLowerCase();
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(term) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (categoryMap[item.categoryId] && categoryMap[item.categoryId].toLowerCase().includes(term)) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(term)))
    );
  }, [searchTerm, menuItems, categoryMap]);

  // Sort the filtered items
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let comparison = 0;
      
      if (sort.field === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sort.field === "category") {
        comparison = (categoryMap[a.categoryId] || "").localeCompare(categoryMap[b.categoryId] || "");
      } else if (sort.field === "price") {
        const priceA = parseFloat(a.price || "0");
        const priceB = parseFloat(b.price || "0");
        comparison = priceA - priceB;
      }
      
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredItems, sort, categoryMap]);

  // Handle sort column click
  const handleSort = (field: SortField) => {
    setSort(prevSort => ({
      field,
      direction: prevSort.field === field && prevSort.direction === "asc" ? "desc" : "asc"
    }));
  };

  // Navigate to edit menu item page
  const handleEdit = (id: number, categoryId: number) => {
    if (onEditItem) {
      onEditItem(id);
    } else {
      // Navigate to edit menu with pre-selected category and item
      setLocation(`/create-menu?category=${categoryId}&item=${id}`);
    }
  };

  // Handle delete menu item
  const handleDelete = (id: number) => {
    if (onDeleteItem) {
      onDeleteItem(id);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-8">
      <h2 className="text-xl font-heading font-semibold mb-4">Menu Search</h2>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
        <Input
          type="search"
          placeholder="Search menu items by name, description, category or tags..."
          className="pl-10 pr-10 py-6 text-base rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setSearchTerm('')}
            aria-label="Clear search"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  Item Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort("category")}
                >
                  Category
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort("price")}
                >
                  Price
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-500 dark:text-gray-400">
                  {searchTerm ? "No menu items match your search" : "No menu items available"}
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {item.imageUrl && (
                        <div className="w-10 h-10 mr-3 rounded-md overflow-hidden flex-shrink-0">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div>{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[250px]">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {categoryMap[item.categoryId] || "Uncategorized"}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(parseFloat(item.price), item.currency || "USD")}
                  </TableCell>
                  <TableCell>
                    {item.tags && item.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {item.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="outline" className="whitespace-nowrap">
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 3 && (
                          <Badge variant="outline" className="whitespace-nowrap">
                            +{item.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-sm">No tags</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item.id, item.categoryId)}
                        title="Edit item"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="More options"
                          >
                            <Menu className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GlobalMenuSearch;