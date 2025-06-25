# VividPlate - Digital Restaurant Menu Platform

## Overview

VividPlate is a comprehensive digital restaurant menu platform that enables restaurants to create interactive, mobile-responsive menus with QR code generation, customer feedback collection, and subscription-based monetization. The application provides both restaurant owner and customer-facing interfaces, along with a complete administrative system.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Internationalization**: react-i18next for multi-language support
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for RESTful API
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Session-based authentication with Passport.js
- **File Storage**: Multi-tier storage system (local, Backblaze B2, ImageKit)
- **Image Processing**: Sharp for image optimization and compression
- **Payment Processing**: Stripe integration for subscriptions

### Database Schema
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle with schema-first approach
- **Key Tables**: users, restaurants, menu_categories, menu_items, subscriptions, payments, feedbacks, admin_logs

## Key Components

### Authentication System
- Session-based authentication with fallback to memory-based test accounts
- Admin and regular user role separation
- Password reset functionality with email tokens
- Subscription tier-based access control

### Restaurant Management
- Multi-restaurant support per user account
- Restaurant profile with logo, banner images, and theme customization
- Menu category and item management with image uploads
- QR code generation for contactless menu access

### File Upload System
- Smart image compression targeting 70-100KB file sizes
- Multiple storage backends: local filesystem, Backblaze B2, ImageKit
- Automatic image optimization and format conversion
- File categorization (menu-items, logos, banners)

### Subscription System
- Stripe-powered subscription management
- Multiple tier support (free, premium, enterprise)
- Usage-based restrictions (restaurant count, features)
- Automated billing and subscription status tracking

### Admin Panel
- User management with activation/deactivation controls
- Restaurant monitoring and moderation
- Pricing plan configuration
- Analytics dashboard with registration and usage metrics
- System logs and audit trails

## Data Flow

1. **User Registration/Authentication**: Users sign up → Email verification → Session creation → Dashboard access
2. **Restaurant Creation**: Profile setup → Image uploads → Menu creation → QR code generation
3. **Menu Management**: Category creation → Item addition → Image optimization → Menu publication
4. **Customer Experience**: QR scan → Menu viewing → Feedback submission → Analytics tracking
5. **Subscription Flow**: Plan selection → Stripe payment → Feature unlock → Usage monitoring

## External Dependencies

### Payment Processing
- **Stripe**: Subscription billing, payment processing, customer management
- **Integration**: Webhook handling for subscription events

### File Storage
- **Backblaze B2**: S3-compatible cloud storage for production files
- **ImageKit**: CDN and image transformation service
- **Local Storage**: Development and fallback storage

### Database
- **Neon**: Serverless PostgreSQL with connection pooling
- **WebSocket Support**: Real-time capabilities via ws library

### Image Processing
- **Sharp**: High-performance image processing and optimization
- **Smart Compression**: Adaptive quality adjustment for target file sizes

## Deployment Strategy

### Development Environment
- **Replit**: Primary development platform with live reload
- **Local Storage**: File uploads stored locally during development
- **Memory Authentication**: Fallback authentication for testing

### Production Environment
- **Build Process**: Vite frontend build + esbuild backend compilation
- **File Storage**: Backblaze B2 for persistent file storage
- **Database**: Neon PostgreSQL with connection pooling
- **Autoscale Deployment**: Replit's autoscale deployment target

### Environment Configuration
- **Database**: PostgreSQL connection via DATABASE_URL
- **Storage**: Configurable backends based on environment variables
- **Authentication**: Production vs development authentication strategies

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 25, 2025. Initial setup