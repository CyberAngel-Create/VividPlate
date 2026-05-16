# VividPlate Design Guidelines

## Design Approach
**System-Based**: Drawing from Linear's precision, Stripe's clarity, and Notion's spatial organization. Professional SaaS aesthetic prioritizing workflow efficiency and information density.

## Typography System
- **Headings**: Inter or DM Sans (600-700 weight)
- **Body**: Same family (400-500 weight) 
- **Display**: 48-56px (hero), 32-40px (h1), 24-28px (h2), 18-20px (h3)
- **Body**: 16px standard, 14px secondary, 12px captions
- **Line Height**: 1.5 for body, 1.2 for headings

## Spacing System
Use Tailwind units: **2, 3, 4, 6, 8, 12, 16, 24** for all spacing
- Component padding: p-6 to p-8
- Section spacing: py-16 to py-24
- Card gaps: gap-6
- Form fields: space-y-4

## Layout Architecture

### Marketing Landing Page
**Hero Section** (80vh): Full-width hero image showing restaurant ambiance/digital menus in use. Centered content overlay with blurred-background buttons. Include: Bold headline (56px), value proposition (20px), dual CTAs (primary "Start Free Trial" + secondary "Watch Demo"), trust indicators below ("Trusted by 500+ restaurants").

**Features Grid** (4 columns → 2 mobile): Icon cards showcasing Digital Menus, Dashboard Analytics, Agent System, Multi-language Support. Each card: icon (48px), title (20px), description (16px), subtle border.

**Platform Preview**: Large dashboard screenshot/mockup with animated highlights pointing to key features. Side-by-side layout: image left, feature list right.

**Social Proof**: 3-column testimonial cards with restaurant logos, owner photos, quotes, restaurant names.

**Pricing Table**: 3-tier comparison (Starter/Professional/Enterprise) with feature checkmarks, prominent monthly pricing, CTA buttons.

**CTA Banner**: Full-width, background image of restaurant interior, blurred-background button "Get Started Today" with subtext.

### Dashboard Layouts
**Sidebar Navigation** (256px fixed): Logo top, icon+label menu items, user profile bottom. Collapsible on mobile (hamburger).

**Top Bar**: Search (320px width), notification bell, language selector dropdown, profile avatar with dropdown menu.

**Main Content Area**: max-w-7xl, padding px-8 py-6.

**Dashboard Cards**: Grid layout (grid-cols-3 → 1 mobile). Cards with subtle shadows, p-6 padding, rounded corners. Stat cards: large number (32px), label (14px), trend indicator.

**Data Tables**: Striped rows, sticky headers, hover states, action buttons right-aligned, pagination bottom.

### Agent Registration Flow
**Multi-Step Form**: Progress indicator top (4 steps), single form section visible, navigation buttons bottom-right.

**Document Upload Zone**: Dashed border drop zone (min-h-64), drag-and-drop area, file preview thumbnails, ID card front/back side-by-side upload areas.

**Form Fields**: Full-width inputs, floating labels, helper text below, validation states, country/region selectors as searchable dropdowns.

### Admin Approval Workflow
**Split View**: Document viewer left (60%), approval form right (40%). Document viewer: zoomable image, rotation controls, fullscreen option.

**Approval Panel**: Agent details card (photo, name, ID number), document verification checklist, notes textarea, action buttons (Approve/Reject/Request Changes) full-width at bottom.

**Queue List**: Table view with filters (Pending/Approved/Rejected), sortable columns, bulk actions toolbar.

### Restaurant Owner Dashboard
**Menu Management**: Drag-and-drop card interface for menu items, inline editing, category tabs, add item FAB bottom-right.

**Analytics Cards**: Revenue trends (line chart), popular items (bar chart), customer feedback (rating stars + count), QR code scans (number + sparkline).

**Subscription Panel**: Current plan card with usage meters (menus created, QR scans, active items), upgrade CTA, billing history table.

## Component Library

**Cards**: Elevated (shadow-md), rounded-lg, p-6, white/dark surface
**Buttons**: Rounded-md, px-6 py-3, font-medium, text-sm
**Inputs**: Rounded-md, border, px-4 py-2.5, focus ring
**Badges**: Rounded-full, px-3 py-1, text-xs, uppercase
**Modals**: max-w-2xl, rounded-lg, backdrop blur
**Dropdowns**: Rounded-md, shadow-lg, divide-y
**Tabs**: Underline style, text-sm font-medium
**Toggle Switches**: Rounded-full track, sliding circle

## Multi-Language UI
**Language Selector**: Flag icon + language name dropdown in top bar. All text content uses proper line-height for longer languages. RTL-ready layouts with reversed flexbox directions.

## Images Section
1. **Hero Image**: Modern restaurant interior with QR code menus visible on tables, soft lighting, professional photography style. Place blurred-background dual CTA buttons overlay (centered).
2. **Dashboard Preview**: Clean mockup of VividPlate dashboard showing menu management interface with colorful food photos.
3. **Platform Features**: Screenshots of mobile menu view, analytics graphs, QR code scanner in action.
4. **Testimonial Photos**: Restaurant owner headshots (professional, warm, approachable).
5. **CTA Banner Background**: Busy restaurant service scene, slightly darkened overlay for contrast.

## Authentication Screens
Phone input with country code dropdown, OTP verification (6-digit code input), centered layout (max-w-md), illustration/logo above form.