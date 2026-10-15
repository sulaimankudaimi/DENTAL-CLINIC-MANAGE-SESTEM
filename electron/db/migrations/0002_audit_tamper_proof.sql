-- 0002_audit_tamper_proof.sql: Ensure audit logs cannot be updated or deleted
CREATE TRIGGER IF NOT EXISTS trg_prevent_audit_log_update
BEFORE UPDATE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'سجلات التدقيق غير قابلة للتعديل (Audit logs are immutable)');
END;

CREATE TRIGGER IF NOT EXISTS trg_prevent_audit_log_delete
BEFORE DELETE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'سجلات التدقيق غير قابلة للحذف (Audit logs are append-only)');
END;
