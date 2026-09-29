-- One-time admin invite links.
-- An invite is created from inside /admin (already authenticated), sent to a
-- customer as /admin/setup?token=..., and can only be redeemed once.

CREATE TABLE IF NOT EXISTS admin_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE,
  claimed_email TEXT,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Matches the "no auth needed" model already used by every other table in
-- this schema (see supabase-schema.sql) — the app enforces access, not RLS.
ALTER TABLE admin_invites DISABLE ROW LEVEL SECURITY;

-- Belt-and-suspenders: if RLS ever gets flipped back on (e.g. by Supabase's
-- security advisor), this permissive policy keeps reads/writes working
-- instead of hard-failing with "new row violates row-level security policy".
DROP POLICY IF EXISTS "admin invites open access" ON admin_invites;
CREATE POLICY "admin invites open access" ON admin_invites FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_admin_invites_token ON admin_invites(token);
