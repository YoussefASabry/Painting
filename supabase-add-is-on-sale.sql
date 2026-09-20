-- ============================================================
-- On Sale feature: schema + permanent collection row
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- 1. Add is_on_sale column
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN NOT NULL DEFAULT false;

-- 2. Add separate sort_order for On Sale collection sequencing
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS on_sale_sort_order INTEGER DEFAULT 0;

-- 3. Index for efficient on-sale queries
CREATE INDEX IF NOT EXISTS idx_artworks_is_on_sale ON artworks(is_on_sale) WHERE deleted_at IS NULL AND is_published = true;

-- 4. Permanent "On Sale" collection row (id is a well-known UUID)
INSERT INTO collections (id, artist_id, title, description, sort_order, is_published)
SELECT
  '00000000-0000-0000-0000-000000000001',
  COALESCE((SELECT id FROM artist_profile LIMIT 1), '00000000-0000-0000-0000-000000000000'),
  'On Sale',
  'Artworks currently on sale',
  -1,
  true
WHERE NOT EXISTS (SELECT 1 FROM collections WHERE id = '00000000-0000-0000-0000-000000000001');
