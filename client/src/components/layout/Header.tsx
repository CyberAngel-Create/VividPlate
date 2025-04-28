import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { User, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiRequest("GET", "/api/auth/me");
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [location]);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setIsAuthenticated(false);
      setLocation("/");
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <a className="text-primary font-heading font-bold text-2xl">MenuMate</a>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          <Link href="/">
            <a className="text-dark hover:text-primary transition-colors font-medium">Home</a>
          </Link>
          <Link href="/features">
            <a className="text-dark hover:text-primary transition-colors font-medium">Features</a>
          </Link>
          <Link href="/pricing">
            <a className="text-dark hover:text-primary transition-colors font-medium">Pricing</a>
          </Link>
          <Link href="/contact">
            <a className="text-dark hover:text-primary transition-colors font-medium">Contact</a>
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <a className="text-dark hover:text-primary transition-colors font-medium hidden md:block">Dashboard</a>
              </Link>
              <Button 
                variant="default" 
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <a className="text-dark hover:text-primary transition-colors font-medium hidden md:block">Log in</a>
              </Link>
              <Link href="/register">
                <Button variant="default" className="bg-primary hover:bg-primary/90 text-white">
                  Get Started
                </Button>
              </Link>
            </>
          )}
          <button 
            className="md:hidden text-dark" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white pb-4 px-4">
          <nav className="flex flex-col space-y-3">
            <Link href="/">
              <a className="text-dark hover:text-primary transition-colors py-2 font-medium">Home</a>
            </Link>
            <Link href="/features">
              <a className="text-dark hover:text-primary transition-colors py-2 font-medium">Features</a>
            </Link>
            <Link href="/pricing">
              <a className="text-dark hover:text-primary transition-colors py-2 font-medium">Pricing</a>
            </Link>
            <Link href="/contact">
              <a className="text-dark hover:text-primary transition-colors py-2 font-medium">Contact</a>
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <a className="text-dark hover:text-primary transition-colors py-2 font-medium">Dashboard</a>
                </Link>
                <a 
                  href="#" 
                  className="text-dark hover:text-primary transition-colors py-2 font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  Log Out
                </a>
              </>
            ) : (
              <>
                <Link href="/login">
                  <a className="text-dark hover:text-primary transition-colors py-2 font-medium">Log in</a>
                </Link>
                <Link href="/register">
                  <a className="text-primary font-medium py-2">Get Started</a>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
