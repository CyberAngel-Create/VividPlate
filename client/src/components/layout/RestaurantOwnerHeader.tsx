import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LogOut, User, CreditCard, Mail, PlusCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ReactNode } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { useTranslation } from "react-i18next";
import { useRestaurant } from "@/hooks/use-restaurant";

interface RestaurantOwnerHeaderProps {
  onLogout?: () => void;
  children?: ReactNode;
}

const RestaurantOwnerHeader = ({ onLogout = () => {}, children }: RestaurantOwnerHeaderProps) => {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { subscription, isPaid } = useSubscription();
  const { restaurants } = useRestaurant();
  const { t } = useTranslation();

  const closeMenu = () => setIsMenuOpen(false);
  
  // Check if the user can add more restaurants (premium users can add up to 3)
  const canAddRestaurant = isPaid && restaurants && restaurants.length < 3;
  // Check if we're on pricing or profile page to hide the upgrade button
  const isOnPricingOrProfile = location === "/pricing" || location === "/profile";

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard">
            <div className="flex items-center">
              <span className="text-xl font-heading font-bold text-primary">MenuMate</span>
              <span className="ml-2 text-sm font-medium text-gray-600">Owner</span>
            </div>
          </Link>

          {/* Desktop Navigation - Main Menu */}
          <nav className="hidden md:flex items-center space-x-6">
            {/* Navigation Links */}
            <Link href="/pricing">
              <div className="text-sm font-medium text-gray-700 hover:text-primary transition-colors flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                {t("Pricing")}
              </div>
            </Link>
            
            <Link href="/contact">
              <div className="text-sm font-medium text-gray-700 hover:text-primary transition-colors flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                {t("Contact")}
              </div>
            </Link>

            {/* Add Restaurant button for premium users with less than 3 restaurants */}
            {canAddRestaurant && !isOnPricingOrProfile && (
              <Link href="/edit-restaurant">
                <Button variant="outline" size="sm" className="flex items-center">
                  {t("Add Restaurant")}
                </Button>
              </Link>
            )}

            {/* User Profile */}
            <Link href="/profile">
              <div className="text-sm font-medium text-gray-700 hover:text-primary transition-colors flex items-center">
                <User className="h-4 w-4 mr-2" />
                {t("Profile")}
              </div>
            </Link>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLogout && onLogout()}
              className="text-gray-700 hover:text-primary flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("Log out")}
            </Button>
          </nav>

          {/* Extra components */}
          <div className="hidden md:flex items-center ml-2">
            {children}
          </div>

          {/* Mobile menu button */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-lg font-heading font-bold text-primary">
                        MenuMate
                      </span>
                      <span className="ml-2 text-sm font-medium text-gray-600">Owner</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeMenu}
                      className="rounded-full p-1 h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Mobile navigation */}
                <nav className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    {/* Premium badge for paid users */}
                    {isPaid && (
                      <div className="py-2">
                        <div className="text-sm font-medium bg-gradient-to-r from-yellow-400 to-amber-600 text-white px-2 py-1 rounded inline-flex items-center">
                          <Star className="h-3 w-3 mr-1" fill="white" />
                          <span>{t("Premium")}</span>
                        </div>
                      </div>
                    )}
                    
                    <Link href="/pricing">
                      <div
                        className="block py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                        onClick={closeMenu}
                      >
                        <CreditCard className="h-4 w-4 mr-2 inline-block" />
                        {t("Pricing")}
                      </div>
                    </Link>
                    
                    <Link href="/contact">
                      <div
                        className="block py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                        onClick={closeMenu}
                      >
                        <Mail className="h-4 w-4 mr-2 inline-block" />
                        {t("Contact")}
                      </div>
                    </Link>

                    {/* Add Restaurant button for premium users with less than 3 restaurants */}
                    {canAddRestaurant && !isOnPricingOrProfile && (
                      <Link href="/edit-restaurant">
                        <div
                          className="block py-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                          onClick={closeMenu}
                        >
                          <PlusCircle className="h-4 w-4 mr-2 inline-block" />
                          {t("Add Restaurant")}
                        </div>
                      </Link>
                    )}
                    
                    <Link href="/profile">
                      <div
                        className="block py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                        onClick={closeMenu}
                      >
                        <User className="h-4 w-4 mr-2 inline-block" />
                        {t("Profile")}
                      </div>
                    </Link>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (onLogout) onLogout();
                        closeMenu();
                      }}
                      className="w-full justify-start text-gray-700 hover:text-primary"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t("Log out")}
                    </Button>
                  </div>
                </nav>

                {/* Mobile extra components */}
                <div className="p-4 mt-auto border-t border-gray-100">
                  {children}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default RestaurantOwnerHeader;