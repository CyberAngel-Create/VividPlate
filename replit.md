# VividPlate - Digital Restaurant Menu Platform

## Overview

VividPlate is a comprehensive digital restaurant menu platform that enables restaurants to create dynamic, mobile-responsive menus with QR code integration, file management, subscription-based tiers, and administrative capabilities. The application serves both restaurant owners and their customers, providing tools for menu creation, customer engagement, and business analytics.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle with PostgreSQL
- **Authentication**: Session-based with Passport.js
- **File Uploads**: Multer with multiple storage backends
- **Payment Processing**: Stripe integration
- **Image Processing**: Sharp for optimization

### Database Architecture
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle Kit migrations
- **Connection Pooling**: Neon serverless pool with WebSocket support

## Key Components

### Authentication System
- Multi-strategy authentication (username/email + password)
- Admin and regular user roles with role-based access control
- Password reset functionality with secure tokens
- Session management with memory store
- Fallback memory-based authentication for development

### Restaurant Management
- Multi-restaurant support per user based on subscription tier
- Restaurant profile management (logo, banners, contact info)
- Menu categorization and item management
- Theme customization and branding
- QR code generation for contactless access

### File Management
- Multi-backend file storage (Local, Backblaze B2, ImageKit, Filen)
- Smart image compression with size optimization (70-100KB target)
- Support for logos, banners, and menu item images
- File type validation and metadata storage
- Automatic fallback to local storage when cloud services unavailable

### Subscription System
- Stripe-powered subscription management
- Multiple tiers (Free, Premium, Admin)
- Usage-based limitations (restaurant count, features)
- Payment intent verification and status tracking

### Admin Dashboard
- User management with role assignment
- Restaurant oversight and analytics
- System logs and audit trails
- Pricing plan management
- Content management (testimonials, examples, advertisements)

## Data Flow

### Menu Creation Flow
1. Restaurant owner authenticates and selects active restaurant
2. Creates menu categories with display ordering
3. Adds menu items to categories with images and details
4. System processes and optimizes uploaded images
5. Menu becomes accessible via shareable URL and QR code

### Customer Menu Viewing Flow
1. Customer scans QR code or visits menu URL
2. System tracks view analytics and increments counters
3. Menu displays with responsive design and filtering options
4. Customer can provide feedback and dietary preferences
5. Analytics data collected for restaurant insights

### File Upload Flow
1. User uploads file through drag-and-drop interface
2. System validates file type and size constraints
3. Image processing optimizes file size and format
4. File stored to configured backend (cloud or local)
5. Database records file metadata and URLs
6. Cleanup routines manage temporary files

## External Dependencies

### Cloud Storage Services
- **Backblaze B2**: S3-compatible object storage for scalable file hosting
- **ImageKit**: CDN and image optimization service
- **Filen**: Encrypted cloud storage alternative
- **AWS S3**: Primary cloud storage option

### Payment Processing
- **Stripe**: Subscription billing and payment processing
- **Telebirr**: Ethiopian payment gateway integration (planned)

### Database Services
- **Neon**: Serverless PostgreSQL hosting
- **WebSocket**: Real-time database connections

### Image Processing
- **Sharp**: High-performance image processing library
- Supports JPEG, PNG, WebP, and AVIF formats
- Smart compression algorithms for optimal file sizes

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Hot Reload**: Vite development server on port 5000
- **API Server**: Express.js with automatic restart

### Production Build
- **Frontend**: Vite production build to `dist/public`
- **Backend**: ESBuild bundling for Node.js deployment
- **Static Assets**: Served through Express static middleware
- **Process Management**: Single Node.js process with graceful shutdown

### Environment Configuration
- Environment-based configuration for database URLs
- Conditional cloud service initialization
- Graceful degradation when services unavailable
- Health check endpoints for monitoring

### Scaling Considerations
- Stateless application design for horizontal scaling
- Database connection pooling for concurrent users
- CDN integration for global asset delivery
- Caching strategies for frequently accessed data

## Changelog

- June 26, 2025: Comprehensive PWA Implementation
  - Added complete Progressive Web App functionality for all devices
  - Integrated custom VividPlate logo as PWA icons (72x72 to 512x512) replacing generic SVG icons
  - Enhanced service worker with caching strategies and offline support
  - Added comprehensive meta tags for iOS, Android, and Windows devices
  - Implemented PWA installer component with install prompts
  - Updated manifest.json for optimal installability with custom branding

- June 26, 2025: User Interface Improvements
  - Removed red "View" button from customer menu interface as requested
  - Enhanced image interaction - clicking image area directly opens dialog
  - Improved customer menu experience with cleaner interface

- June 26, 2025: Admin Panel Enhancements
  - Completed comprehensive SubscriptionManager component
  - Added subscription duration controls (1 month, 3 month, 6 month, 1 year)
  - Implemented full subscription management functionality
  - Resolved database schema inconsistencies
  - Added missing updateUserSubscription method

- June 26, 2025: Infrastructure Fixes
  - Resolved server issues and banner loading problems
  - Fixed empty banner validation logic
  - Improved error handling for missing images
  - Enhanced file serving with fallback SVG placeholders

- June 25, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.