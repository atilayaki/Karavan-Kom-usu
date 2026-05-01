-- =====================================================================
-- v4 fix: 400/403 hatalarını çöz (DEV MODE — RLS off)
-- - PostgREST schema cache'i yenile (FK embed resolve etsin)
-- - RLS'i tüm yeni tablolarda netleştir
-- - anon/authenticated için DML grant'lerini garanti altına al
-- =====================================================================

-- 1. RLS'i kesin kapat (sadece var olan tablolar için)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='messages')          THEN EXECUTE 'ALTER TABLE messages DISABLE ROW LEVEL SECURITY'; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='geographic_notes')  THEN EXECUTE 'ALTER TABLE geographic_notes DISABLE ROW LEVEL SECURITY'; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='routes')            THEN EXECUTE 'ALTER TABLE routes DISABLE ROW LEVEL SECURITY'; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='profiles')          THEN EXECUTE 'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY'; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='posts')             THEN EXECUTE 'ALTER TABLE posts DISABLE ROW LEVEL SECURITY'; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='marketplace_items') THEN EXECUTE 'ALTER TABLE marketplace_items DISABLE ROW LEVEL SECURITY'; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='friendships')       THEN EXECUTE 'ALTER TABLE friendships DISABLE ROW LEVEL SECURITY'; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='spots')             THEN EXECUTE 'ALTER TABLE spots DISABLE ROW LEVEL SECURITY'; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='comments')          THEN EXECUTE 'ALTER TABLE comments DISABLE ROW LEVEL SECURITY'; END IF;
END $$;

-- 2. anon/authenticated rollerine DML grant'leri (Supabase otomatik yapmadıysa)
GRANT SELECT, INSERT, UPDATE, DELETE ON messages           TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON geographic_notes   TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON routes             TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles           TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON posts              TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_items  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON friendships        TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON spots              TO anon, authenticated;

-- comments v6'da geliyor; varsa grant ver
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='comments') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON comments TO anon, authenticated';
  END IF;
END $$;

-- View grant'leri
GRANT SELECT ON vw_spots             TO anon, authenticated;
GRANT SELECT ON vw_geographic_notes  TO anon, authenticated;
GRANT SELECT ON vw_routes            TO anon, authenticated;

-- IDENTITY/sequence grant'leri (insert sırasında gerekli)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 3. PostgREST schema cache'i yenile (FK embed resolve olsun)
NOTIFY pgrst, 'reload schema';
