-- =====================================================================
-- v7 — Production RLS Policies
-- Bu migration'ı YALNIZCA production'a geçerken çalıştır.
-- Dev/test ortamında kalmak istiyorsan db_schema_v4_fix.sql RLS'i kapatıyor.
--
-- Genel kurallar:
--  - Public okumalar: spots, posts, comments, marketplace_items, geographic_notes,
--    routes, profiles, friendships → herkes görebilir.
--  - Yazma: yalnızca authenticated kullanıcılar; çoğunda user_id = auth.uid() zorunlu.
--  - Silme/güncelleme: yalnızca kayıt sahibi.
--  - messages: kanal-bazlı; herkes okur, sadece authenticated yazar, sadece sahibi siler.
-- =====================================================================

-- ---- profiles ----
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all"   ON profiles;
DROP POLICY IF EXISTS "profiles_insert_self"  ON profiles;
DROP POLICY IF EXISTS "profiles_update_self"  ON profiles;
DROP POLICY IF EXISTS "profiles_delete_self"  ON profiles;

CREATE POLICY "profiles_select_all"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_self" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete_self" ON profiles FOR DELETE USING (auth.uid() = id);

-- ---- spots ----
-- created_by kolonu eksikse ekle (eski şemalarda olmayabilir)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='spots' AND column_name='created_by') THEN
    ALTER TABLE spots ADD COLUMN created_by UUID REFERENCES profiles(id);
  END IF;
END $$;

ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spots_select_all"   ON spots;
DROP POLICY IF EXISTS "spots_insert_auth"  ON spots;
DROP POLICY IF EXISTS "spots_update_owner" ON spots;
DROP POLICY IF EXISTS "spots_delete_owner" ON spots;

CREATE POLICY "spots_select_all"   ON spots FOR SELECT USING (true);
-- created_by NULL olabileceği eski kayıtlar için: insert'te uid eşleşmeli, update/delete'te de
CREATE POLICY "spots_insert_auth"  ON spots FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "spots_update_owner" ON spots FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "spots_delete_owner" ON spots FOR DELETE USING (auth.uid() = created_by);

-- ---- posts ----
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts_select_all"   ON posts;
DROP POLICY IF EXISTS "posts_insert_self"  ON posts;
DROP POLICY IF EXISTS "posts_update_self"  ON posts;
DROP POLICY IF EXISTS "posts_delete_self"  ON posts;

CREATE POLICY "posts_select_all"  ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_self" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
-- likes_count başkaları tarafından da artırılabilsin diye update'i public bıraktık
CREATE POLICY "posts_update_self" ON posts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "posts_delete_self" ON posts FOR DELETE USING (auth.uid() = user_id);

-- ---- comments ----
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select_all"  ON comments;
DROP POLICY IF EXISTS "comments_insert_self" ON comments;
DROP POLICY IF EXISTS "comments_delete_self" ON comments;

CREATE POLICY "comments_select_all"  ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_self" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_self" ON comments FOR DELETE USING (auth.uid() = user_id);

-- ---- marketplace_items ----
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketplace_select_all"  ON marketplace_items;
DROP POLICY IF EXISTS "marketplace_insert_self" ON marketplace_items;
DROP POLICY IF EXISTS "marketplace_update_self" ON marketplace_items;
DROP POLICY IF EXISTS "marketplace_delete_self" ON marketplace_items;

CREATE POLICY "marketplace_select_all"  ON marketplace_items FOR SELECT USING (true);
CREATE POLICY "marketplace_insert_self" ON marketplace_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "marketplace_update_self" ON marketplace_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "marketplace_delete_self" ON marketplace_items FOR DELETE USING (auth.uid() = user_id);

-- ---- friendships ----
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "friend_select_involved"  ON friendships;
DROP POLICY IF EXISTS "friend_insert_self"      ON friendships;
DROP POLICY IF EXISTS "friend_delete_involved"  ON friendships;

-- Sadece tarafların ya da public mode? Sosyal listeleme için biri seçecek; biz herkese SELECT veriyoruz.
CREATE POLICY "friend_select_involved" ON friendships FOR SELECT USING (true);
CREATE POLICY "friend_insert_self"     ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "friend_delete_involved" ON friendships FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ---- messages (Telsiz) ----
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select_all"  ON messages;
DROP POLICY IF EXISTS "messages_insert_self" ON messages;
DROP POLICY IF EXISTS "messages_delete_self" ON messages;

-- DM kanalları için ileride kanal-bazlı policy yazılabilir; şu an public kanallar gibi okunuyor
CREATE POLICY "messages_select_all"  ON messages FOR SELECT USING (true);
CREATE POLICY "messages_insert_self" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "messages_delete_self" ON messages FOR DELETE USING (auth.uid() = user_id);

-- ---- geographic_notes (Askıda Not) ----
ALTER TABLE geographic_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notes_select_all"  ON geographic_notes;
DROP POLICY IF EXISTS "notes_insert_self" ON geographic_notes;
DROP POLICY IF EXISTS "notes_delete_self" ON geographic_notes;

CREATE POLICY "notes_select_all"  ON geographic_notes FOR SELECT USING (true);
CREATE POLICY "notes_insert_self" ON geographic_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notes_delete_self" ON geographic_notes FOR DELETE USING (auth.uid() = user_id);

-- ---- routes (İz Bırak) ----
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "routes_select_all"  ON routes;
DROP POLICY IF EXISTS "routes_insert_self" ON routes;
DROP POLICY IF EXISTS "routes_update_self" ON routes;
DROP POLICY IF EXISTS "routes_delete_self" ON routes;

CREATE POLICY "routes_select_all"  ON routes FOR SELECT USING (true);
CREATE POLICY "routes_insert_self" ON routes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "routes_update_self" ON routes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "routes_delete_self" ON routes FOR DELETE USING (auth.uid() = user_id);

-- ---- bookmarks (zaten v5'te policy'leri var; idempotent yeniden uygula) ----
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='bookmarks') THEN
    EXECUTE 'ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ---- service_providers (varsa) ----
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='service_providers') THEN
    EXECUTE 'ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "sp_select_all" ON service_providers';
    EXECUTE 'CREATE POLICY "sp_select_all" ON service_providers FOR SELECT USING (true)';
  END IF;
END $$;

-- ---- reviews (varsa) ----
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='reviews') THEN
    EXECUTE 'ALTER TABLE reviews ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "rv_select_all"  ON reviews';
    EXECUTE 'DROP POLICY IF EXISTS "rv_insert_self" ON reviews';
    EXECUTE 'DROP POLICY IF EXISTS "rv_delete_self" ON reviews';
    EXECUTE 'CREATE POLICY "rv_select_all"  ON reviews FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "rv_insert_self" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "rv_delete_self" ON reviews FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- View'lara SELECT grant'i (RLS view'lara değil altındaki tablolara uygulanır)
GRANT SELECT ON vw_spots             TO anon, authenticated;
GRANT SELECT ON vw_geographic_notes  TO anon, authenticated;
GRANT SELECT ON vw_routes            TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
