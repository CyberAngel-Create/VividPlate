# VividPlate - Digital Restaurant Menu Platform

## Overview
VividPlate is a comprehensive digital restaurant menu platform designed to empower restaurants with dynamic, mobile-responsive menus featuring QR code integration, advanced file management, subscription-based access, and robust administrative tools. It aims to streamline menu creation, enhance customer engagement, and provide valuable business analytics for restaurant owners, ultimately improving the dining experience for customers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **Styling**: Tailwind CSS with custom design system, Radix UI primitives, shadcn/ui
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle with PostgreSQL
- **Authentication**: Session-based with Passport.js
- **File Uploads**: Multer with multi-backend support
- **Payment Processing**: Stripe integration
- **Image Processing**: Sharp

### Database
- **Primary Database**: PostgreSQL (Neon serverless)
- **Schema Management**: Drizzle Kit migrations
- **Connection Pooling**: Neon serverless pool

### Core Features
- **Authentication System**: Multi-strategy authentication with admin and regular user roles, role-based access control, password reset, session management, and Telegram bot password recovery integration.
- **Restaurant Management**: Supports multiple restaurants per user based on subscription tier, restaurant profile management, menu categorization, item management, theme customization, and QR code generation.
- **File Management**: Multi-backend file storage (Local, Backblaze B2, ImageKit, Filen, AWS S3) with smart image compression (70-100KB target), support for various file types, and automatic fallbacks. Permanent image storage using PostgreSQL for base64 encoded images.
- **Subscription System**: Stripe-powered subscription management with multiple tiers (Free, Premium, Admin) and usage-based limitations.
- **Admin Dashboard**: User management, restaurant oversight, analytics, system logs, pricing plan management, and content management.
- **PWA Implementation**: Full Progressive Web App functionality with custom icons, service worker caching, offline support, and install prompts.
- **Phone Number Management**: Required phone number field on registration with conditional profile management - prompts users to add phone if missing, allows updates if already provided.
- **Telegram Bot Integration**: Automated password reset system via Telegram bot using phone number verification.
- **Internationalization**: Comprehensive menu translation system supporting English, Amharic, French, Arabic, and Chinese, including category and item-level translations.

### System Design Choices
- **Stateless application design** for horizontal scaling.
- **Database connection pooling** for concurrent users.
- **CDN integration** for global asset delivery.
- **Caching strategies** for frequently accessed data (HTTP caching, ETag support).
- **Environment-based configuration** with graceful degradation for unavailable services.
- **Robust error handling** with connection validation, retry logic, and graceful shutdown.
- **Responsive UI/UX** design for seamless viewing across devices, including tablet optimization.
- **AdSense Policy Compliance** with content validation to ensure ads display only on meaningful content.

## External Dependencies

### Cloud Storage Services
- Backblaze B2
- ImageKit
- Filen
- AWS S3

### Payment Processing
- Stripe
- Telebirr (planned)

### Database Services
- Neon (PostgreSQL hosting)

### Image Processing Libraries
- Sharp