-- Fix: friendships tablosu RLS politikaları
-- Supabase SQL Editor'da çalıştır

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friend_select_involved"  ON friendships;
DROP POLICY IF EXISTS "friend_insert_self"      ON friendships;
DROP POLICY IF EXISTS "friend_delete_involved"  ON friendships;

-- Herkese okuma (online kullanıcı listesi için gerekli)
CREATE POLICY "friend_select_involved"
  ON friendships FOR SELECT
  USING (true);

-- Sadece kendi user_id'siyle insert yapabilir
CREATE POLICY "friend_insert_self"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sadece ilgili taraflar silebilir
CREATE POLICY "friend_delete_involved"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
