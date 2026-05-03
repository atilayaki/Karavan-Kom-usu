-- Karavan Komşusu — v20: Kamp Ateşi nightly chat room
-- Messages auto-delete after 24h via pg_cron or manual cleanup policy

CREATE TABLE IF NOT EXISTS kamp_atesi_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(trim(content)) > 0 AND length(content) <= 300),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kamp_atesi_created ON kamp_atesi_messages(created_at DESC);

-- RLS
ALTER TABLE kamp_atesi_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kamp_atesi_read_all" ON kamp_atesi_messages;
CREATE POLICY "kamp_atesi_read_all" ON kamp_atesi_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "kamp_atesi_insert_own" ON kamp_atesi_messages;
CREATE POLICY "kamp_atesi_insert_own" ON kamp_atesi_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable Supabase Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE kamp_atesi_messages;

-- Optional: auto-delete messages older than 24h (run via pg_cron if available)
-- SELECT cron.schedule('cleanup-kamp-atesi', '0 1 * * *',
--   'DELETE FROM kamp_atesi_messages WHERE created_at < now() - interval ''24 hours''');
