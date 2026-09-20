-- ============================================================
-- Atelier Magazine Prototype — Supabase Schema Setup
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- 1. Artist Profile (single-artist portfolio)
CREATE TABLE IF NOT EXISTS artist_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT '',
  artist_statement TEXT DEFAULT '',
  biography TEXT DEFAULT '',
  research_academic TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  tiktok_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Credentials (education, certificates, experience)
CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artist_profile(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('education', 'certificate', 'work')),
  title TEXT NOT NULL,
  institution TEXT DEFAULT '',
  start_year INTEGER,
  end_year INTEGER,
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Exhibitions & Events
CREATE TABLE IF NOT EXISTS exhibitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artist_profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  venue TEXT DEFAULT '',
  location TEXT DEFAULT '',
  start_date DATE,
  end_date DATE,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'exhibition' CHECK (category IN ('exhibition', 'event')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Artworks
CREATE TABLE IF NOT EXISTS artworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artist_profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  year TEXT DEFAULT '',
  medium TEXT DEFAULT '',
  width_cm NUMERIC,
  height_cm NUMERIC,
  depth_cm NUMERIC,
  weight_kg NUMERIC DEFAULT 2,
  description TEXT DEFAULT '',
  price NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'not_for_sale')),
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Artwork Images (one-to-many with artworks)
CREATE TABLE IF NOT EXISTS artwork_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Orders (e-commerce)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  customer_governorate TEXT DEFAULT '',
  customer_city TEXT DEFAULT '',
  street_address TEXT DEFAULT '',
  building_number TEXT DEFAULT '',
  apartment_number TEXT DEFAULT '',
  shipping_cost NUMERIC DEFAULT 0,
  total_items_cost NUMERIC DEFAULT 0,
  calculated_weight NUMERIC DEFAULT 0,
  paymob_order_id TEXT DEFAULT '',
  payment_method TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'still packaging', 'sent to shipping', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Order Items (future use)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES artworks(id),
  price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Disable RLS on all data tables (no auth needed)
-- ============================================================
ALTER TABLE artist_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE artworks DISABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_artworks_artist_id ON artworks(artist_id);
CREATE INDEX IF NOT EXISTS idx_artworks_deleted_at ON artworks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_artworks_published ON artworks(is_published) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_artwork_images_artwork_id ON artwork_images(artwork_id);
CREATE INDEX IF NOT EXISTS idx_credentials_artist_id ON credentials(artist_id);
CREATE INDEX IF NOT EXISTS idx_exhibitions_artist_id ON exhibitions(artist_id);

-- ============================================================
-- Storage bucket for artwork images
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('artworks', 'artworks', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read artworks bucket" ON storage.objects;
CREATE POLICY "Public read artworks bucket" ON storage.objects FOR SELECT USING (bucket_id = 'artworks');

DROP POLICY IF EXISTS "Anyone can upload to artworks" ON storage.objects;
CREATE POLICY "Anyone can upload to artworks" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'artworks');

-- ============================================================
-- Fix FK constraint on artworks.artist_id
-- Supabase creates artworks with FK -> artists by default
-- We need it to point to artist_profile instead
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'artworks_artist_id_fkey'
    AND table_name = 'artworks'
  ) THEN
    -- Check what it references — if it's 'artists' and not 'artist_profile', fix it
    IF EXISTS (
      SELECT 1 FROM information_schema.referential_constraints rc
      JOIN information_schema.table_constraints tc ON rc.unique_constraint_name = tc.constraint_name
      WHERE rc.constraint_name = 'artworks_artist_id_fkey'
      AND tc.table_name = 'artists'
    ) THEN
      ALTER TABLE artworks DROP CONSTRAINT artworks_artist_id_fkey;
      ALTER TABLE artworks ADD CONSTRAINT artworks_artist_id_fkey
        FOREIGN KEY (artist_id) REFERENCES artist_profile(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;
