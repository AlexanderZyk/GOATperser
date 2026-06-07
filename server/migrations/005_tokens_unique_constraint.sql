DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tokens_user_id_key'
          AND conrelid = 'tokens'::regclass
    ) THEN
        ALTER TABLE tokens ADD CONSTRAINT tokens_user_id_key UNIQUE (user_id);
    END IF;
END $$;
