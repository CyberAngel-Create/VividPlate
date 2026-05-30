-- Migration: website builder addon tables and user columns

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS website_addon_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS website_addon_subscription_id text;

CREATE TABLE IF NOT EXISTS restaurant_websites (
  id serial PRIMARY KEY,
  restaurant_id integer NOT NULL UNIQUE,
  user_id integer NOT NULL,
  slug text NOT NULL UNIQUE,
  template text DEFAULT 'elegant',
  is_published boolean DEFAULT false,
  booking_enabled boolean DEFAULT true,
  hero_image_url text,
  tagline text,
  about_text text,
  gallery_images jsonb DEFAULT '[]',
  social_links jsonb DEFAULT '{}',
  custom_settings jsonb DEFAULT '{}',
  booking_settings jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS table_bookings (
  id serial PRIMARY KEY,
  restaurant_id integer NOT NULL,
  website_id integer NOT NULL,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text,
  party_size integer NOT NULL,
  booking_date text NOT NULL,
  booking_time text NOT NULL,
  notes text,
  status text DEFAULT 'pending',
  owner_notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_websites_restaurant_id ON restaurant_websites(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_websites_slug ON restaurant_websites(slug);
CREATE INDEX IF NOT EXISTS idx_table_bookings_website_id ON table_bookings(website_id);
CREATE INDEX IF NOT EXISTS idx_table_bookings_status ON table_bookings(status);
