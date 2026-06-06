---
title: Add gallery image upload to the restaurant website builder
---
# Add gallery image upload to the restaurant website builder

  ## What & Why
  The schema and DB already have a `gallery_images` jsonb column on `restaurant_websites`, and the templates include gallery section support. However, the builder UI (`/my-website`) currently has no UI to upload or manage gallery photos. This is a visible gap in the feature.

  ## Done looks like
  - A "Gallery" section in the website builder Content tab allows uploading multiple photos
  - Photos are stored in the `gallery_images` array and displayed in both Elegant and Modern templates
  - Users can remove individual gallery photos
  - Upload reuses the `/api/my-website/hero-image` endpoint pattern (PermanentImageHelpers)

  ## Relevant files
  - `client/src/pages/my-website.tsx` — add gallery upload UI in Content tab
  - `server/routes.ts` — can add a POST /api/my-website/gallery-image endpoint (same pattern as hero-image)
  - `client/src/pages/site-page.tsx` — ElegantTemplate and ModernTemplate already have gallery placeholder spots