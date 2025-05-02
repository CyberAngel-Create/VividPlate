import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ReactNode } from "react";

interface CustomerHeaderProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
  children?: ReactNode;
}

const CustomerHeader = ({ isAuthenticated = false, onLogout = () => {}, children }: CustomerHeaderProps) => {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const navigationItems = [
    { name: "Home", path: "/" },
    { name: "Pricing", path: "/pricing" },
    { name: "Contact", path: "/contact" }
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center">
              <span className="text-xl font-heading font-bold text-primary">MenuMate</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {/* Main navigation */}
            <div className="flex items-center space-x-6">
              {navigationItems.map((item) => (
                <Link key={item.name} href={item.path}>
                  <div
                    className={`text-sm font-medium ${
                      location === item.path
                        ? "text-primary"
                        : "text-gray-700 hover:text-primary transition-colors"
                    }`}
                  >
                    {item.name}
                  </div>
                </Link>
              ))}
            </div>

            {/* Auth buttons */}
            <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <Link href="/dashboard">
                    <div className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                      Dashboard
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLogout && onLogout()}
                    className="text-gray-700 hover:text-primary"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Log out
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <div className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                      Log in
                    </div>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" variant="default">
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </div>
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
                    <span className="text-lg font-heading font-bold text-primary">
                      MenuMate
                    </span>
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
                    {navigationItems.map((item) => (
                      <Link key={item.name} href={item.path}>
                        <div
                          className={`block py-2 text-sm font-medium ${
                            location === item.path
                              ? "text-primary"
                              : "text-gray-700 hover:text-primary transition-colors"
                          }`}
                          onClick={closeMenu}
                        >
                          {item.name}
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    {isAuthenticated ? (
                      <div className="space-y-3">
                        <Link href="/dashboard">
                          <div
                            className="block py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                            onClick={closeMenu}
                          >
                            Dashboard
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
                          Log out
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Link href="/login">
                          <div
                            className="block py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                            onClick={closeMenu}
                          >
                            Log in
                          </div>
                        </Link>
                        <Link href="/register">
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full mt-2"
                            onClick={closeMenu}
                          >
                            Sign up
                          </Button>
                        </Link>
                      </div>
                    )}
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

export default CustomerHeader;