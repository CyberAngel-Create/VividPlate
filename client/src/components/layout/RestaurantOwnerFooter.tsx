import { Link } from "wouter";

const RestaurantOwnerFooter = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <span className="text-lg font-heading font-bold text-primary">VividPlate</span>
              <span className="ml-1 text-xs text-gray-500">for Restaurant Owners</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              © {currentYear} VividPlate. All rights reserved.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-6">
            <Link href="/contact">
              <div className="text-sm text-gray-500 hover:text-primary transition-colors">
                Contact Support
              </div>
            </Link>
            <Link href="/pricing">
              <div className="text-sm text-gray-500 hover:text-primary transition-colors">
                Pricing Plans
              </div>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default RestaurantOwnerFooter;