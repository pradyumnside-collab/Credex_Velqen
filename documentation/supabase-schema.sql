-- Supabase schema for Velqen Day 5
-- Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS audits (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT UNIQUE NOT NULL,
  team_size             INTEGER NOT NULL DEFAULT 1,
  use_case              TEXT NOT NULL DEFAULT 'mixed',
  tools_data            JSONB NOT NULL DEFAULT '[]',
  total_monthly_savings NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_annual_savings  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  high_savings          BOOLEAN NOT NULL DEFAULT false,
  already_optimal       BOOLEAN NOT NULL DEFAULT false,
  redundancy_flagged    BOOLEAN NOT NULL DEFAULT false,
  overlap_detected      BOOLEAN NOT NULL DEFAULT false,
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id        UUID REFERENCES audits(id) ON DELETE SET NULL,
  audit_slug      TEXT NOT NULL,
  email           TEXT NOT NULL,
  company         TEXT,
  role            TEXT,
  team_size       TEXT,
  is_high_savings BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audits_slug_idx ON audits (slug);
CREATE INDEX IF NOT EXISTS leads_email_created_idx ON leads (email, created_at);

ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audits_public_read"
  ON audits FOR SELECT
  USING (true);

CREATE POLICY "audits_public_insert"
  ON audits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "leads_public_insert"
  ON leads FOR INSERT
  WITH CHECK (true);