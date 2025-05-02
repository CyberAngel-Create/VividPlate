import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

interface CustomerHeaderProps {
  onLogout?: () => void;
  isAuthenticated?: boolean;
  children?: React.ReactNode;
}

export default function CustomerHeader({
  onLogout,
  isAuthenticated = false,
  children
}: CustomerHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="font-heading font-bold text-xl text-primary cursor-pointer">
            MenuMate
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-dark hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/pricing" className="text-dark hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="text-dark hover:text-primary transition-colors">
              Contact
            </Link>
            
            {children}
            
            {isAuthenticated ? (
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1" 
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/" className="block px-3 py-2 text-dark hover:bg-neutral rounded-md">
              Home
            </Link>
            <Link href="/pricing" className="block px-3 py-2 text-dark hover:bg-neutral rounded-md">
              Pricing
            </Link>
            <Link href="/contact" className="block px-3 py-2 text-dark hover:bg-neutral rounded-md">
              Contact
            </Link>
            
            {isAuthenticated ? (
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 w-full justify-start" 
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <>
                <Link href="/login" className="block">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full justify-center mt-2"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/register" className="block">
                  <Button 
                    size="sm"
                    className="w-full justify-center mt-2"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
            
            <div className="px-3 py-2">
              {children}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}