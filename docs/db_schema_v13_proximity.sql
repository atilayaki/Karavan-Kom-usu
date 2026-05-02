-- =====================================================================
-- v13 — Proximity & Location Sharing (Yakınımdaki Komşular)
-- - profiles.last_location: Son bilinen konum
-- - profiles.share_location: Konum paylaşımı aktif mi?
-- =====================================================================

-- 1. Konum Kolonlarını Ekle
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='last_location') THEN
    ALTER TABLE profiles ADD COLUMN last_location GEOGRAPHY(POINT);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='share_location') THEN
    ALTER TABLE profiles ADD COLUMN share_location BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 2. Yakındaki Komşuları Bulan Fonksiyon
CREATE OR REPLACE FUNCTION get_nearby_neighbors(
  p_user_id UUID, 
  p_lat DOUBLE PRECISION, 
  p_lng DOUBLE PRECISION, 
  p_radius_km DOUBLE PRECISION DEFAULT 50
) 
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  caravan_type TEXT,
  avatar_url TEXT,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, 
    p.full_name, 
    p.caravan_type, 
    p.avatar_url,
    ST_Distance(p.last_location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000 as distance_km
  FROM profiles p
  WHERE 
    p.id != p_user_id AND
    p.share_location = true AND
    ST_DWithin(p.last_location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_km * 1000)
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
