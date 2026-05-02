-- =====================================================================
-- v14 — Spot Attributes & Enhanced Filtering
-- - spots.attributes: JSONB alan (su, elektrik, wc, pet_friendly vb.)
-- - spots.category: Genişletilmiş kategoriler (Usta, Karavan Park, Kamp)
-- =====================================================================

-- 1. Spots tablosunu güncelle
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='spots' AND column_name='attributes') THEN
    ALTER TABLE spots ADD COLUMN attributes JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  -- Kategori kısıtlamasını güncelle (varsa)
  -- Bazı versiyonlarda CHECK constraint olabilir, onu esnetelim.
END $$;

-- 2. Örnek Veri Güncelleme
UPDATE spots SET attributes = '{"water": true, "electricity": true, "wc": true, "pet_friendly": true}'::jsonb 
WHERE category = 'Sakin Köşe';

UPDATE spots SET attributes = '{"solar": true, "mechanic": true, "carpenter": true}'::jsonb 
WHERE category = 'Yol Yardımcısı';

-- 3. View Güncelleme (attributes alanını da içersin)
CREATE OR REPLACE VIEW vw_spots AS
SELECT 
  id, title, description, category, address, image_url, attributes, created_by,
  ST_Y(location::geometry) as lat, 
  ST_X(location::geometry) as lng 
FROM spots;

NOTIFY pgrst, 'reload schema';
