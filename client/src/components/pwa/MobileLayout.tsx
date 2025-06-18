import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Home, MenuSquare, User, Settings } from 'lucide-react';
import { PWAStatus } from './InstallBanner';

interface MobileLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export function MobileLayout({ children, showBottomNav = true }: MobileLayoutProps) {
  const [location] = useLocation();

  const navigationItems = [
    { icon: Home, label: 'Home', path: '/', active: location === '/' },
    { icon: MenuSquare, label: 'Menu', path: '/dashboard', active: location.startsWith('/dashboard') },
    { icon: User, label: 'Profile', path: '/profile', active: location.startsWith('/profile') },
    { icon: Settings, label: 'Settings', path: '/settings', active: location.startsWith('/settings') }
  ];

  return (
    <div className="flex flex-col min-h-screen pwa-safe-area">
      {/* Main Content */}
      <main className={`flex-1 ${showBottomNav ? 'pb-16' : ''}`}>
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      {showBottomNav && (
        <nav className="mobile-nav">
          <div className="flex justify-around items-center max-w-md mx-auto">
            {navigationItems.map(({ icon: Icon, label, path, active }) => (
              <a
                key={path}
                href={path}
                className={`mobile-nav-item ${active ? 'active' : ''}`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span>{label}</span>
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* PWA Status Indicator */}
      <div className="fixed top-2 right-2 z-50">
        <PWAStatus />
      </div>
    </div>
  );
}

interface MobilePageProps {
  title: string;
  children: ReactNode;
  showBackButton?: boolean;
  actions?: ReactNode;
}

export function MobilePage({ title, children, showBackButton = false, actions }: MobilePageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button
                onClick={() => window.history.back()}
                className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            )}
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </header>

      {/* Page Content */}
      <div className="container px-4 py-4">
        {children}
      </div>
    </div>
  );
}

interface MobileCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MobileCard({ children, onClick, className = '' }: MobileCardProps) {
  return (
    <div
      className={`mobile-card ${onClick ? 'cursor-pointer haptic-light' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface MobileListItemProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  onClick?: () => void;
}

export function MobileListItem({ title, subtitle, icon, action, onClick }: MobileListItemProps) {
  return (
    <div
      className={`flex items-center gap-3 p-4 border-b border-border/50 last:border-0 ${
        onClick ? 'cursor-pointer hover:bg-accent/50 active:bg-accent haptic-light' : ''
      }`}
      onClick={onClick}
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface MobileGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  gap?: 2 | 3 | 4;
}

export function MobileGrid({ children, columns = 2, gap = 4 }: MobileGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  };

  const gridGap = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4'
  };

  return (
    <div className={`grid ${gridCols[columns]} ${gridGap[gap]}`}>
      {children}
    </div>
  );
}