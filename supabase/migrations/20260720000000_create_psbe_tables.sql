-- Premium Engineering (PSBE) — engineering-only fork of PSB Pricing.
-- Tables prefixed `psbe_` to avoid collision with the live PSB Pricing app's
-- `psb_*` tables in the shared Supabase instance (xockuiyvxijuzlwlsfbu).
-- No quotes, customers, or app-config — this app only calculates engineering.

-- =============================================================================
-- Regions (South: IN/OH/KY/IL/TN/MO/WV; North: MI/WI/PA/MN)
-- =============================================================================
CREATE TABLE psbe_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  states TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Per-state defaults (state picker seeds snow load + wind + region routing)
-- =============================================================================
CREATE TABLE psbe_state_defaults (
  state_code TEXT PRIMARY KEY,
  region_id UUID REFERENCES psbe_regions(id) ON DELETE SET NULL,
  default_snow_load TEXT NOT NULL DEFAULT '30 Ground Load',
  default_wind_mph INT NOT NULL DEFAULT 105,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Upload tracking
-- =============================================================================
CREATE TABLE psbe_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES psbe_regions(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),
  filename TEXT NOT NULL,
  sheet_count INT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Parsed engineering matrices (versioned JSON snapshot)
-- Only stores the 7 snow-* sheets and header meta — no base pricing.
-- =============================================================================
CREATE TABLE psbe_pricing_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES psbe_regions(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT false,
  matrices JSONB NOT NULL DEFAULT '{}',
  upload_id UUID REFERENCES psbe_uploads(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_psbe_pricing_data_current
  ON psbe_pricing_data (region_id)
  WHERE is_current = true;

-- =============================================================================
-- Audit log
-- =============================================================================
CREATE TABLE psbe_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  actor_email TEXT,
  entity TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  diff JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_psbe_audit_log_entity ON psbe_audit_log (entity, entity_id);
CREATE INDEX idx_psbe_audit_log_created ON psbe_audit_log (created_at DESC);

-- =============================================================================
-- updated_at triggers
-- =============================================================================
CREATE OR REPLACE FUNCTION update_psbe_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER psbe_regions_updated_at BEFORE UPDATE ON psbe_regions
  FOR EACH ROW EXECUTE FUNCTION update_psbe_updated_at();
CREATE TRIGGER psbe_state_defaults_updated_at BEFORE UPDATE ON psbe_state_defaults
  FOR EACH ROW EXECUTE FUNCTION update_psbe_updated_at();

-- =============================================================================
-- RLS — authenticated read, service role full
-- =============================================================================
ALTER TABLE psbe_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE psbe_state_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE psbe_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE psbe_pricing_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE psbe_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_regions" ON psbe_regions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_state_defaults" ON psbe_state_defaults FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_uploads" ON psbe_uploads FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_pricing_data" ON psbe_pricing_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_audit_log" ON psbe_audit_log FOR SELECT TO authenticated USING (true);

-- =============================================================================
-- Seed: regions
-- =============================================================================
INSERT INTO psbe_regions (name, slug, states) VALUES
  ('South', 'south', ARRAY['IN','OH','KY','IL','TN','MO','WV']),
  ('North', 'north', ARRAY['MI','WI','PA','MN']);

-- =============================================================================
-- Seed: per-state defaults — south defaults 60 GL, north defaults 30 GL.
-- =============================================================================
INSERT INTO psbe_state_defaults (state_code, region_id, default_snow_load, default_wind_mph)
SELECT s, (SELECT id FROM psbe_regions WHERE slug = 'south'), '60 Ground Load', 105
FROM unnest(ARRAY['IN','OH','KY','IL','TN','MO','WV']) AS s;

INSERT INTO psbe_state_defaults (state_code, region_id, default_snow_load, default_wind_mph)
SELECT s, (SELECT id FROM psbe_regions WHERE slug = 'north'), '30 Ground Load', 105
FROM unnest(ARRAY['MI','WI','PA','MN']) AS s;
