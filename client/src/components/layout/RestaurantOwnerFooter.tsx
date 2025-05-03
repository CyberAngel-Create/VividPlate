import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Github, Mail, Phone } from "lucide-react";

const RestaurantOwnerFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">MenuMate</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Create beautiful digital menus for your restaurant. Engage customers and increase sales with our easy-to-use platform.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-primary"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-primary"
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-primary"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard">
                  <a className="text-gray-600 hover:text-primary">Dashboard</a>
                </Link>
              </li>
              <li>
                <Link href="/restaurants">
                  <a className="text-gray-600 hover:text-primary">My Restaurants</a>
                </Link>
              </li>
              <li>
                <Link href="/create-menu">
                  <a className="text-gray-600 hover:text-primary">Create Menu</a>
                </Link>
              </li>
              <li>
                <Link href="/share-menu">
                  <a className="text-gray-600 hover:text-primary">Share Menu</a>
                </Link>
              </li>
              <li>
                <Link href="/profile">
                  <a className="text-gray-600 hover:text-primary">Profile</a>
                </Link>
              </li>
              <li>
                <Link href="/pricing">
                  <a className="text-gray-600 hover:text-primary">Pricing</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <Mail className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <span className="text-gray-600">menumate.spp@gmail.com</span>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <span className="text-gray-600">+251-913-690-687</span>
              </li>
              <li className="text-gray-600">
                Ethiopia, Addis Abeba
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 mb-4 md:mb-0">
            &copy; {year} MenuMate. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm">
            <Link href="/privacy">
              <a className="text-gray-600 hover:text-primary">Privacy Policy</a>
            </Link>
            <Link href="/terms">
              <a className="text-gray-600 hover:text-primary">Terms of Service</a>
            </Link>
            <Link href="/contact">
              <a className="text-gray-600 hover:text-primary">Contact</a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default RestaurantOwnerFooter;