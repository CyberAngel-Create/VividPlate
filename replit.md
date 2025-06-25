# MenuMate - Digital Menu Platform

## Project Overview
MenuMate is a comprehensive digital menu platform for restaurants that enables contactless dining experiences through QR codes and web links. The platform includes both free and premium subscription tiers with time-based premium subscriptions.

## Recent Changes (June 2025)

### Complete Rollback - All Today's Changes Removed (Latest - June 25, 2025)
- ✅ **FULL ROLLBACK COMPLETED** - All today's changes completely removed
- ✅ **Pure Static App** - Single React component, no external dependencies
- ✅ **No Backend Connections** - Zero API calls, no authentication system
- ✅ **No CSS Files** - Inline styles only, removed index.css dependency
- ✅ **Alert Messages** - Clear warnings about rollback demo status
- ✅ **Static Homepage** - VividPlate landing page with feature showcase
- ✅ **Disabled Features** - All login and admin functionality shows alerts
- ✅ **Clean State** - Yesterday's complex features completely removed

### Adaptive UI Components
- ✅ Implemented responsive design system with useResponsive hook
- ✅ Created AdaptiveGrid for responsive layouts
- ✅ Added AdaptiveContainer for consistent spacing across devices
- ✅ Built AdaptiveText, AdaptiveButton, AdaptiveCard, and AdaptiveModal components
- ✅ Enhanced Dashboard with adaptive components for mobile, tablet, and desktop
- ✅ Integrated responsive breakpoints following Tailwind CSS standards

### Critical Bug Fixes
- ✅ Fixed Restaurant switcher visibility issue on mobile devices
- ✅ Implemented Chrome browser compatibility fixes for desktop loading
- ✅ Enhanced PWA installation functionality for desktop browsers
- ✅ Added error boundary and improved main.tsx for cross-platform stability

### Subscription System Implementation
- ✅ Added time-based premium subscriptions with 1 month, 3 months, and 1 year duration options
- ✅ Implemented automatic subscription countdown system with expiration tracking
- ✅ Created 10-day expiration notification system for premium users
- ✅ Added automatic downgrade to free tier when premium expires
- ✅ Implemented image upload limits: free users limited to 5 menu item images maximum
- ✅ Premium users get unlimited menu item images and ad-free experience
- ✅ Created admin interface for managing user subscriptions
- ✅ Added subscription status component showing usage limits and expiry dates
- ✅ Fixed admin subscription management with upgrade/downgrade API endpoints
- ✅ Added getUserMenuItemImageCount method to database storage
- ✅ Completed admin ability to switch users between free and premium tiers

### PWA Implementation
- ✅ Complete Progressive Web App functionality with offline support
- ✅ Service worker with caching strategies and background sync
- ✅ Mobile-optimized layout components and touch interactions
- ✅ Install banner for "Add to Home Screen" functionality
- ✅ PWA manifest with proper icons and metadata
- ✅ Custom VividPlate icon implementation with all required sizes (72x72 to 512x512)
- ✅ PWA install prompt component with user-friendly interface
- ✅ Service worker registration in main.tsx with proper error handling
- ✅ Updated manifest.json with VividPlate branding and theme colors
- ✅ Enhanced desktop PWA installation with browser-specific instructions
- ✅ Native PWA install prompt integration with fallback manual instructions
- ✅ Button text changed from "Show PWA Prompt" to "Install VividPlate"
- ✅ Improved PWA manifest and service worker for browser install icon visibility

### Image Management
- ✅ Automatic image compression system limiting uploads to 1MB
- ✅ Smart compression to 70-100KB for storage efficiency
- ✅ Image upload validation based on subscription tier

## Subscription Tiers

### Free Tier
- 1 restaurant maximum
- 5 menu item images maximum
- Advertisements shown
- Basic QR code generation

### Premium Tier
- 3 restaurants maximum
- Unlimited menu item images
- Ad-free experience
- Advanced QR code customization
- Duration options: 1 month, 3 months, 1 year

## Test Credentials
- **Admin:** username: admin, password: admin1234
- **Restaurant Owner:** username: restaurant1, password: password123
- **Premium User:** email: entotocloudrestaurant@gmail.com, password: cloud123

## Architecture
- **Frontend:** React with TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js with Express
- **Database:** PostgreSQL with Drizzle ORM (using in-memory storage for development)
- **Authentication:** Passport.js with session-based auth
- **File Storage:** Local storage with image compression
- **PWA:** Service worker with offline capabilities

## Key Features
- Restaurant profile management with logo and banner uploads
- Menu category and item management with image uploads
- Dynamic QR code generation with customization
- Menu view tracking and analytics
- Multi-language support with i18next
- Theme customization for menu display
- Subscription management with time-based expiry
- Mobile-first PWA design

## User Preferences
- Focus on practical implementation over theoretical explanations
- Prefer working code over detailed documentation
- Mobile-first approach for all UI components
- Immediate feedback on subscription limits and status