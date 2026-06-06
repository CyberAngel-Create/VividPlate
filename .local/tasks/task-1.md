---
title: Restaurant Website Builder & Table Booking
---
# Restaurant Website Builder & Table Booking

## What & Why
Restaurant owners currently get a QR digital menu, but many want a full standalone website they can share as a link or use as their real web presence. This feature adds a Website Builder as a **$15/month add-on** on top of any existing paid plan. It includes two professional templates (Elegant Dark and Modern Bright), full customization, a table booking system with owner management, and an optional link to their existing VividPlate digital menu.

## Done looks like
- Owner sees a "My Website" card on the dashboard — if they haven't purchased the add-on, it shows the $15/month price and a "Activate Website Builder" button that takes them to a LemonSqueezy checkout
- After paying, the feature unlocks immediately and persists as long as the subscription is active
- Owner picks between two templates: **Elegant** (dark, upscale) and **Modern** (clean, bright)
- Owner customizes: headline, tagline, "About" text, accent color, hero image, gallery images (up to 6), phone, address, opening hours
- Owner toggles **"Link to Digital Menu"** on/off — when on, a "View Our Menu" button links to their `/menu/:slug` page
- Owner toggles **"Enable Table Booking"** on/off — shows or hides the booking form on the public site
- The public website is live at `/site/:restaurantSlug` — fully mobile-responsive, no login required
- The public site shows: hero, about, gallery, optional "View Our Menu" button, contact info, optional "Book a Table" button
- Customers fill in the booking form: name, email, phone, date, time, party size, optional notes — no account needed
- Owner sees a "Bookings" tab listing all bookings (pending/approved/declined) with guest details and Approve/Decline buttons
- Cancelling the add-on subscription disables the public site and the builder (data is preserved)

## Out of scope
- Email/SMS notifications to guests on booking status changes (future)
- Custom domain names (future)
- More than two templates (future)
- Online payment or deposits for bookings (future)
- Admin moderation of websites
- Embedding the full menu inline (just a link button, not an iframe embed)
- Free plan users accessing this feature (must have an existing paid plan + the add-on)

## Steps

1. **LemonSqueezy add-on product** — Create a new LemonSqueezy product and variant for the Website Builder add-on ($15/month). Store the variant ID as `LEMONSQUEEZY_WEBSITE_ADDON_VARIANT_ID` in env. Add a `websiteAddonActive` boolean and `websiteAddonSubscriptionId` field to the `users` table. Add a webhook handler branch for this new variant that sets/clears `websiteAddonActive` when the subscription is created, renewed, or cancelled.

2. **Database schema** — Add two new tables:
   - `restaurant_websites`: stores website settings per restaurant (template choice, headline, tagline, about text, hero image URL, gallery image URLs, accent color, opening hours, show_menu_link boolean, table_booking_enabled boolean, is_published boolean, created_at, updated_at)
   - `table_bookings`: stores each booking (restaurant_id, guest name, email, phone, date, time, party_size, notes, status enum pending/approved/declined, created_at)
   Run the migration.

3. **Backend API** — Add REST endpoints:
   - `GET/PUT /api/restaurants/:id/website` — get and save website settings (owner auth + addon check)
   - `GET /api/site/:restaurantSlug` — return public website data (public, no auth)
   - `POST /api/restaurants/:id/bookings` — submit a booking (public, no auth)
   - `GET /api/restaurants/:id/bookings` — list bookings (owner auth + addon check)
   - `PATCH /api/restaurants/:id/bookings/:bookingId` — approve or decline a booking (owner auth + addon check)
   - `POST /api/ls/create-website-addon-checkout` — create a LemonSqueezy checkout for the $15/month add-on (auth required)

4. **Two website templates** — Build two React components that accept the same `websiteSettings` + `restaurant` props:
   - **Elegant**: dark background (#1a1a1a), serif headings (Georgia/Playfair), gold/amber accent, full-bleed hero with overlay, minimal whitespace
   - **Modern**: white/light background, rounded cards, bold sans-serif, vibrant configurable accent, grid-based gallery
   Both render: hero section, about section, image gallery (up to 6 photos), optional "View Our Menu" button, contact/hours section, optional "Book a Table" booking form section.

5. **Public website page** — Create route `/site/:restaurantSlug` that fetches from `/api/site/:restaurantSlug` and renders the chosen template. Show a friendly 404 if the site is not published. Fully mobile responsive.

6. **Booking form component** — Modal or inline form collecting: name, email, phone, date, time, party size, notes. On submit calls the bookings API and shows a confirmation message. No login needed.

7. **Website Builder owner page** — Add page `/my-website` with two tabs:
   - **Setup tab**: Template picker with visual preview cards, all customization fields (text inputs, color picker, image uploads using existing upload infrastructure), "Link to Digital Menu" toggle, "Enable Table Booking" toggle, Publish/Unpublish toggle, Save button. Image uploads reuse the existing `/api/upload/` endpoints.
   - **Bookings tab**: Data table with columns — guest name, email, phone, date, time, party size, notes, status badge; Approve and Decline action buttons; filter buttons (All / Pending / Approved / Declined); shows empty state when no bookings.

8. **Add-on checkout & gating** — On the dashboard, show a "My Website" card. If `websiteAddonActive` is false, show the $15/month price and an "Activate" button that calls the checkout endpoint and redirects to LemonSqueezy. If active, link to `/my-website`. On all protected owner pages, check `websiteAddonActive` and redirect to the upgrade prompt if false.

## Relevant files
- `shared/schema.ts`
- `server/routes.ts`
- `server/storage.ts`
- `server/lemonsqueezy-service.ts`
- `client/src/pages/dashboard.tsx`
- `client/src/App.tsx`
- `client/src/components/restaurant/RestaurantThemeEditor.tsx`
- `client/src/hooks/use-subscription-status.tsx`