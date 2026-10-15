-- Migration 0004: License System Enhancements
-- إضافة الأعمدة الناقصة لجدول الترخيص لدعم التحقق الرقمي وحالات التجربة وفترة السماح

ALTER TABLE license ADD COLUMN token_hint TEXT;
ALTER TABLE license ADD COLUMN customer TEXT;
ALTER TABLE license ADD COLUMN features TEXT;
ALTER TABLE license ADD COLUMN max_doctors INTEGER;
ALTER TABLE license ADD COLUMN max_devices INTEGER;
ALTER TABLE license ADD COLUMN state_cache TEXT;
ALTER TABLE license ADD COLUMN trial_started_at TEXT;
ALTER TABLE license ADD COLUMN last_seen_at TEXT;
