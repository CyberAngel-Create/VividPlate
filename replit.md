# VividPlate - Digital Restaurant Menu Platform

## Overview

VividPlate is a comprehensive digital restaurant menu platform that empowers restaurants to create interactive, mobile-responsive menus with QR code integration, payment processing, and advanced analytics. The application follows a full-stack architecture with a React frontend, Express.js backend, and PostgreSQL database.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based with Passport.js (configurable for both database and memory-based auth)
- **File Storage**: Multi-provider system supporting local storage, Backblaze B2, and ImageKit
- **Payment Processing**: Stripe integration for subscription management

### Database Schema
The application uses PostgreSQL with the following core entities:
- **Users**: Authentication and user management
- **Restaurants**: Restaurant profiles and settings
- **Menu Categories**: Hierarchical menu organization
- **Menu Items**: Individual menu items with images and metadata
- **Menu Views**: Analytics tracking for menu interactions
- **Subscriptions**: Payment and subscription tier management
- **File Uploads**: Centralized file management system

## Key Components

### Authentication System
- Dual authentication support (database-backed and memory-based for testing)
- Admin and regular user roles
- Password reset functionality
- Session management with secure cookies

### Restaurant Management
- Multi-restaurant support per user
- Restaurant profile customization (logos, banners, themes)
- QR code generation for contactless menu access
- Subscription tier-based feature restrictions

### Menu System
- Hierarchical category and item organization
- Rich media support (images, descriptions)
- Drag-and-drop ordering
- Dietary preference filtering
- Real-time menu preview

### File Management
- Smart image compression and optimization
- Multiple storage provider support (local, cloud)
- Automatic image resizing for different contexts
- File upload tracking and metadata

### Analytics and Insights
- Menu view tracking
- QR code scan analytics
- User engagement metrics
- Restaurant performance dashboards

### Admin Dashboard
- User management and moderation
- System-wide analytics
- Content management (pricing plans, testimonials)
- Advertisement management

## Data Flow

1. **User Registration/Login**: Users authenticate through the backend API, with session data stored server-side
2. **Restaurant Creation**: Users create restaurants within their subscription limits
3. **Menu Building**: Categories and items are created through the API with real-time updates
4. **File Uploads**: Images are processed, optimized, and stored using the configured provider
5. **Menu Sharing**: QR codes generate links to public menu views with analytics tracking
6. **Payment Processing**: Stripe handles subscription upgrades and payment processing

## External Dependencies

### Required Services
- **PostgreSQL Database**: Primary data storage (Neon serverless recommended)
- **Stripe**: Payment processing and subscription management

### Optional Services
- **Backblaze B2**: Cloud storage for images and files
- **ImageKit**: Image optimization and CDN
- **Filen**: Alternative cloud storage provider

### Development Dependencies
- **Sharp**: Image processing and optimization
- **Multer**: File upload handling
- **bcryptjs**: Password hashing
- **ws**: WebSocket support for Neon database

## Deployment Strategy

### Development Environment
- Local development server with hot reload
- Memory-based authentication for testing
- Local file storage fallback

### Production Environment
- Build process creates optimized static assets and server bundle
- Environment variables configure database and external services
- Autoscale deployment target on Replit

### Configuration
Key environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `STRIPE_SECRET_KEY`: Stripe API key
- `BACKBLAZE_*`: Cloud storage configuration
- `IMAGEKIT_*`: Image optimization service

## Changelog

Changelog:
- June 25, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.