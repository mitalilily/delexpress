ALTER TABLE ekart_waybill_sequences
  ADD COLUMN IF NOT EXISTS prefix varchar(30) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sequence_pad integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS used_count bigint NOT NULL DEFAULT 0;

UPDATE ekart_waybill_sequences
SET used_count = last_sequence
WHERE used_count = 0
  AND last_sequence > 0
  AND last_sequence < 199;

INSERT INTO ekart_waybill_sequences (bucket, prefix, sequence_pad, last_sequence, used_count)
VALUES
  ('prepaid_upto_5kg', 'ZCEP', 10, 199, 0),
  ('cod_upto_5kg', 'ZCEC', 10, 199, 0),
  ('prepaid_above_5kg', 'ZCFP', 10, 199, 0),
  ('cod_above_5kg', 'ZCFC', 10, 199, 0)
ON CONFLICT (bucket) DO UPDATE
SET
  prefix = CASE
    WHEN ekart_waybill_sequences.prefix = '' THEN EXCLUDED.prefix
    ELSE ekart_waybill_sequences.prefix
  END,
  sequence_pad = CASE
    WHEN ekart_waybill_sequences.sequence_pad <= 0 THEN EXCLUDED.sequence_pad
    ELSE ekart_waybill_sequences.sequence_pad
  END,
  last_sequence = GREATEST(ekart_waybill_sequences.last_sequence, 199),
  updated_at = now();
