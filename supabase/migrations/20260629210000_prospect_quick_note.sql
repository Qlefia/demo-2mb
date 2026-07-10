-- Sticky scratch-pad note on the company card (right rail), not an activity row.
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS quick_note text;

COMMENT ON COLUMN prospects.quick_note IS
  'Private workspace scratch pad for Ops/Sales on this company card; autosaved from UI.';
