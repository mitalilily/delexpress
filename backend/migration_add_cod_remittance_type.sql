DO $$
BEGIN
  CREATE TYPE cod_remittance_type AS ENUM ('cod', 'cancellation');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE cod_remittances
ADD COLUMN IF NOT EXISTS remittance_type cod_remittance_type NOT NULL DEFAULT 'cod';

UPDATE cod_remittances
SET remittance_type = 'cod'
WHERE remittance_type IS NULL;
