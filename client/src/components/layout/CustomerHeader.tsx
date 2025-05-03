import { Link } from "wouter";
import { Menu, Utensils, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Restaurant } from "@shared/schema";

interface CustomerHeaderProps {
  restaurant: Restaurant | null;
}

const CustomerHeader = ({ restaurant }: CustomerHeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {restaurant?.logoUrl ? (
              <img 
                src={restaurant.logoUrl} 
                alt={`${restaurant.name} logo`} 
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
                <Utensils className="h-5 w-5" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg leading-tight">{restaurant?.name || 'Restaurant Menu'}</h1>
              {restaurant?.cuisine && (
                <p className="text-xs text-gray-500">{restaurant.cuisine}</p>
              )}
            </div>
          </div>
          
          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80%] sm:w-[350px]">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center py-4 border-b">
                    <div className="flex items-center space-x-3">
                      {restaurant?.logoUrl ? (
                        <img 
                          src={restaurant.logoUrl} 
                          alt={`${restaurant.name} logo`} 
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
                          <Utensils className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <h2 className="font-bold text-lg">{restaurant?.name || 'Restaurant Menu'}</h2>
                        {restaurant?.cuisine && (
                          <p className="text-xs text-gray-500">{restaurant.cuisine}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 py-6">
                    <nav className="flex flex-col space-y-4">
                      <a href="#menu" className="py-2 px-3 hover:bg-gray-100 rounded-md" onClick={() => setIsOpen(false)}>
                        Menu
                      </a>
                      {restaurant?.description && (
                        <a href="#about" className="py-2 px-3 hover:bg-gray-100 rounded-md" onClick={() => setIsOpen(false)}>
                          About
                        </a>
                      )}
                      {restaurant?.address && (
                        <a href="#location" className="py-2 px-3 hover:bg-gray-100 rounded-md" onClick={() => setIsOpen(false)}>
                          Location
                        </a>
                      )}
                    </nav>
                  </div>
                  
                  <div className="border-t border-gray-200 py-4">
                    <p className="text-xs text-gray-500 text-center">
                      Powered by <span className="font-medium">MenuMate</span>
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Desktop links */}
          <nav className="hidden md:flex md:items-center md:space-x-6">
            <a href="#menu" className="text-sm font-medium text-gray-600 hover:text-primary">
              Menu
            </a>
            {restaurant?.description && (
              <a href="#about" className="text-sm font-medium text-gray-600 hover:text-primary">
                About
              </a>
            )}
            {restaurant?.address && (
              <a href="#location" className="text-sm font-medium text-gray-600 hover:text-primary">
                Location
              </a>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default CustomerHeader;