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
    <footer className="bg-dark text-white py-4 mt-8">
      <div className="container mx-auto px-4">
        <div className="text-center text-gray-500 text-xs">
          <p>&copy; 2025 MenuMate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
