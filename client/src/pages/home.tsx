import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, QrCode, Smartphone, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CustomerHeader from "@/components/layout/CustomerHeader";
import Footer from "@/components/layout/Footer";

const Home = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check if user is authenticated without loading delays
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
  }, []);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setIsAuthenticated(false);
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

  return (
    <div className="flex flex-col min-h-screen">
      <CustomerHeader 
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />
      
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary/90 to-primary">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-6">
                Create Beautiful Digital Menus for Your Restaurant
              </h1>
              <p className="text-white/90 text-lg mb-8">
                VividPlate helps you create custom digital menus that are accessible via web links and QR codes, making it easy for customers to browse your offerings from their devices.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-semibold"
                  onClick={() => setLocation("/register")}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  onClick={() => setLocation("/login")}
                >
                  Log In
                </Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
                  alt="Restaurant ambiance" 
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="font-heading font-bold text-xl mb-2">Bella Cucina</h3>
                  <p className="text-midgray text-sm mb-4">Italian Restaurant</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Scan QR code to view menu</span>
                    <div className="w-16 h-16 bg-neutral flex items-center justify-center rounded">
                      <QrCode className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-neutral">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold mb-4">How VividPlate Works</h2>
            <p className="text-midgray max-w-2xl mx-auto">
              Our platform makes it easy to create, manage and share your restaurant menu with customers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Edit className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3">Create Your Menu</h3>
              <p className="text-midgray">
                Easily add your restaurant information, menu categories, and dishes with our intuitive editor.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <QrCode className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3">Generate QR Code</h3>
              <p className="text-midgray">
                Get a custom QR code for your menu that can be printed or displayed in your restaurant.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-dark/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Smartphone className="h-8 w-8 text-dark" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3">Share with Customers</h3>
              <p className="text-midgray">
                Customers can instantly access your menu by scanning the QR code or visiting the unique web link.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Sample Menus Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold mb-4">Beautiful Menu Examples</h2>
            <p className="text-midgray max-w-2xl mx-auto">
              See how restaurants are using VividPlate to showcase their offerings
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="overflow-hidden rounded-lg shadow-md">
              <div className="h-48 bg-gray-200 relative">
                <img 
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80" 
                  alt="Pizza" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-3 left-3 text-white">
                  <h3 className="font-heading font-bold">Pizza Delizioso</h3>
                  <p className="text-xs">Italian Pizzeria</p>
                </div>
              </div>
            </div>
            
            <div className="overflow-hidden rounded-lg shadow-md">
              <div className="h-48 bg-gray-200 relative">
                <img 
                  src="https://images.unsplash.com/photo-1535140728325-a4d3707eee61?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80" 
                  alt="Sushi" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-3 left-3 text-white">
                  <h3 className="font-heading font-bold">Sakura Sushi</h3>
                  <p className="text-xs">Japanese Restaurant</p>
                </div>
              </div>
            </div>
            
            <div className="overflow-hidden rounded-lg shadow-md">
              <div className="h-48 bg-gray-200 relative">
                <img 
                  src="https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80" 
                  alt="Breakfast" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-3 left-3 text-white">
                  <h3 className="font-heading font-bold">Morning Bliss</h3>
                  <p className="text-xs">Breakfast & Brunch</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-10">
            <Link href="/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                Create Your Menu Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 bg-neutral">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold mb-4">What Restaurants Say</h2>
            <p className="text-midgray max-w-2xl mx-auto">
              Hear from restaurant owners who have transformed their menu experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">JD</span>
                </div>
                <div>
                  <h4 className="font-heading font-semibold">John Doe</h4>
                  <p className="text-sm text-midgray">Owner, The Grill House</p>
                </div>
              </div>
              <p className="text-midgray">
                "VividPlate has revolutionized our dining experience. Customers love being able to browse our full menu with detailed descriptions and pictures. It's also incredibly easy to update."
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">SJ</span>
                </div>
                <div>
                  <h4 className="font-heading font-semibold">Sarah Johnson</h4>
                  <p className="text-sm text-midgray">Manager, Café Delight</p>
                </div>
              </div>
              <p className="text-midgray">
                "Since implementing digital menus with VividPlate, we've reduced printing costs and waste. Our seasonal specials are now updated instantly without reprinting anything."
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-dark rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">RL</span>
                </div>
                <div>
                  <h4 className="font-heading font-semibold">Robert Lee</h4>
                  <p className="text-sm text-midgray">Chef, Fusion Kitchen</p>
                </div>
              </div>
              <p className="text-midgray">
                "The QR code feature is brilliant. It's contactless, convenient, and gives our restaurant a modern edge. I can showcase our dishes with high-quality images that really highlight our culinary creations."
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-heading font-bold text-white mb-6">Ready to Modernize Your Restaurant Menu?</h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8">
            Join thousands of restaurants using VividPlate to create beautiful, accessible digital menus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-semibold"
              onClick={() => setLocation("/register")}
            >
              Get Started Free
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => setLocation("/login")}
            >
              Log In
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
