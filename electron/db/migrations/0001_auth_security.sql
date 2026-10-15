-- 0001_auth_security.sql: Security hardening, mandatory password change, pin hash, and persistent login lockout attempts

ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN pin_hash TEXT;
ALTER TABLE users ADD COLUMN pin_attempts INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS login_attempts (
  user_id TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_locked ON login_attempts(locked_until);
