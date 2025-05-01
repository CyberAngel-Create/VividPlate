import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { User, Menu, UserCog } from "lucide-react";
import { useTranslation } from "react-i18next";


const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

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
          <Link href="/" className="text-primary font-heading font-bold text-2xl">
            MenuMate
          </Link>
        </div>
        
        {/* Desktop Navigation - Only shown when not authenticated */}
        {!isAuthenticated && (
          <nav className="hidden md:flex space-x-6">
            {/* Removed navigation items as requested */}
          </nav>
        )}
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="text-dark hover:text-primary transition-colors font-medium hidden md:block">
                {t('common.dashboard')}
              </Link>
              <Link href="/profile" className="text-dark hover:text-primary transition-colors font-medium hidden md:flex items-center">
                <UserCog className="h-4 w-4 mr-1" />
                {t('common.profile') || "Profile"}
              </Link>
              <Button 
                variant="default" 
                className="bg-[#ff5733] hover:bg-[#ff5733]/90 text-white"
                onClick={handleLogout}
              >
                {t('common.logout')}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-dark hover:text-primary transition-colors font-medium hidden md:block">
                {t('common.login')}
              </Link>
              <Button 
                variant="default" 
                className="bg-[#ff5733] hover:bg-[#ff5733]/90 text-white"
                onClick={() => window.location.href = '/register'}
              >
                {t('home.getStarted')}
              </Button>
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
            {/* Navigation items removed as requested */}
            
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="text-dark hover:text-primary transition-colors py-2 font-medium">
                  {t('common.dashboard')}
                </Link>
                <Link href="/profile" className="text-dark hover:text-primary transition-colors py-2 font-medium flex items-center">
                  <UserCog className="h-4 w-4 mr-1" />
                  {t('common.profile') || "Profile"}
                </Link>
                <a 
                  href="#" 
                  className="text-dark hover:text-primary transition-colors py-2 font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  {t('common.logout')}
                </a>
              </>
            ) : (
              <>
                <Link href="/login" className="text-dark hover:text-primary transition-colors py-2 font-medium">
                  {t('common.login')}
                </Link>
                <Link href="/register" className="text-primary font-medium py-2">
                  {t('home.getStarted')}
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
