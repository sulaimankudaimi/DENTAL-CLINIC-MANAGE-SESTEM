-- 0003_purchase_orders.sql: Purchase orders and order items tables
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, partial, received, cancelled
  ordered_at TEXT,
  expected_at TEXT,
  received_at TEXT,
  total_halalas INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_clinic_id ON purchase_orders(clinic_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  po_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES inventory_items(id),
  quantity INTEGER NOT NULL,
  received_quantity INTEGER NOT NULL DEFAULT 0,
  unit_cost_halalas INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_po_items_clinic_id ON purchase_order_items(clinic_id);
CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_po_items_item_id ON purchase_order_items(item_id);

-- Leave requests table if not already present
CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL DEFAULT 'annual', -- annual, sick, emergency, unpaid
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  days_count INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_clinic_id ON leave_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
