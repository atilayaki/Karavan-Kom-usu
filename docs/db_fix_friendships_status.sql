-- Arkadaşlık isteği sistemi: friendships tablosuna status ekleme
-- Supabase SQL Editor'da çalıştır

ALTER TABLE friendships
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Mevcut accepted satırları (eski sistem) accepted yap
UPDATE friendships SET status = 'accepted' WHERE status = 'pending';

-- RLS politikalarını güncelle
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friend_select_involved"  ON friendships;
DROP POLICY IF EXISTS "friend_insert_self"       ON friendships;
DROP POLICY IF EXISTS "friend_delete_involved"   ON friendships;
DROP POLICY IF EXISTS "friend_update_receiver"   ON friendships;

-- Herkes kendi ilgili satırları görebilir
CREATE POLICY "friend_select_involved" ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Sadece kendi user_id'siyle istek gönderebilir
CREATE POLICY "friend_insert_self" ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sadece alıcı taraf status güncelleyebilir (kabul/red)
CREATE POLICY "friend_update_receiver" ON friendships FOR UPDATE
  USING (auth.uid() = friend_id)
  WITH CHECK (auth.uid() = friend_id);

-- Her iki taraf silebilir
CREATE POLICY "friend_delete_involved" ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
