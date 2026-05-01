-- =====================================================================
-- activities tablosuna eksik kolonları ekler
-- ERROR: column "ref_id" of relation "activities" does not exist
-- =====================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='activities' AND column_name='ref_id') THEN
    ALTER TABLE activities ADD COLUMN ref_id BIGINT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='activities' AND column_name='activity_type') THEN
    ALTER TABLE activities ADD COLUMN activity_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='activities' AND column_name='description') THEN
    ALTER TABLE activities ADD COLUMN description TEXT;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
