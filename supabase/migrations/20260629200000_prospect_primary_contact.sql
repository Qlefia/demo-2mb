-- Stable primary contact for prospect card comms + glance (#66)
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS primary_contact_id uuid
    REFERENCES contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS prospects_primary_contact_id_idx
  ON prospects(primary_contact_id);

COMMENT ON COLUMN prospects.primary_contact_id IS
  'Explicit primary contact for outreach; ON DELETE SET NULL when contact removed.';
