-- Add banner_urls to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS banner_urls JSONB DEFAULT '[]'::jsonb;

-- Add advertisements table if not exists
CREATE TABLE IF NOT EXISTS advertisements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  position TEXT DEFAULT 'bottom',
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER NOT NULL
);