import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface TabItem {
  id: string;
  label: string;
  path: string;
}

interface TabNavigationProps {
  onTabChange?: (tabId: string) => void;
}

const TabNavigation = ({ onTabChange }: TabNavigationProps) => {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { id: 'create-menu', label: 'Create Menu', path: '/create-menu' },
    { id: 'edit-restaurant', label: 'Restaurant Profile', path: '/edit-restaurant' },
    { id: 'menu-preview', label: 'Menu Preview', path: '/menu-preview' },
    { id: 'share', label: 'Share Menu', path: '/share-menu' },
  ];

  useEffect(() => {
    // Determine active tab based on current location
    const currentPath = location.split('?')[0]; // Remove query params
    const tab = tabs.find(tab => tab.path === currentPath);
    if (tab) {
      setActiveTab(tab.id);
    }
  }, [location, tabs]);

  const handleTabClick = (tab: TabItem) => {
    setActiveTab(tab.id);
    setLocation(tab.path);
    if (onTabChange) {
      onTabChange(tab.id);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto py-1 space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-1 py-3 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-dark hover:text-primary'
              }`}
              onClick={() => handleTabClick(tab)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;
