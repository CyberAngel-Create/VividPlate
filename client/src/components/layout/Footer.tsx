import { Link } from "wouter";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  MapPin, 
  Mail, 
  Phone 
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-6 mt-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-heading font-bold mb-3">MenuMate</h3>
            <p className="text-gray-400 text-xs mb-3">
              Create beautiful digital menus for your restaurant and share them instantly with customers.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-heading font-semibold mb-3">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <MapPin className="h-4 w-4 text-primary mt-1 mr-2" />
                <span className="text-gray-400 text-xs">Ethiopia, Addis Abeba</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 text-primary mr-2" />
                <span className="text-gray-400 text-xs">menumate.spp@gmail.com</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 text-primary mr-2" />
                <span className="text-gray-400 text-xs">+251-913-690-687</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 pt-4 text-center text-gray-500 text-xs">
          <p>&copy; {new Date().getFullYear()} MenuMate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
