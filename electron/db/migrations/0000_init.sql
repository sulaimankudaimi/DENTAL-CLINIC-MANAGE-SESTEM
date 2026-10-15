-- ============================================================================
-- Eyadati Dental Clinic Management Database Schema - SQLite Migration 0000
-- ============================================================================

-- 1. Clinics
CREATE TABLE IF NOT EXISTS clinics (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  name TEXT NOT NULL,
  logo_path TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT NOT NULL DEFAULT 'الرياض',
  tax_number TEXT,
  cr_number TEXT,
  currency TEXT NOT NULL DEFAULT 'SAR',
  timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh',
  working_hours TEXT NOT NULL,
  slot_duration_min INTEGER NOT NULL DEFAULT 30
);
CREATE INDEX IF NOT EXISTS idx_clinics_clinic_id ON clinics(clinic_id);

-- 2. Branches
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_branches_clinic_id ON branches(clinic_id);

-- 3. Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  specialty TEXT,
  license_number TEXT,
  phone TEXT,
  email TEXT,
  avatar_path TEXT,
  color TEXT NOT NULL DEFAULT '#1E4E9C',
  commission_percent INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);

-- 4. Role Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  role TEXT NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_resource_action ON role_permissions(role, resource, action);
CREATE INDEX IF NOT EXISTS idx_role_permissions_clinic_id ON role_permissions(clinic_id);

-- 5. Patients
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  code TEXT NOT NULL,
  first_name TEXT NOT NULL,
  father_name TEXT,
  family_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date TEXT,
  national_id TEXT,
  phone TEXT NOT NULL,
  phone_alt TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  blood_type TEXT NOT NULL DEFAULT 'unknown',
  marital_status TEXT NOT NULL DEFAULT 'single',
  occupation TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  referral_source TEXT,
  primary_dentist_id TEXT REFERENCES users(id),
  insurance_company_id TEXT,
  insurance_policy_no TEXT,
  insurance_expiry TEXT,
  notes TEXT,
  photo_path TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_code ON patients(code);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_family_name ON patients(family_name);
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_primary_dentist_id ON patients(primary_dentist_id);

-- 6. Medical History
CREATE TABLE IF NOT EXISTS medical_history (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  condition_key TEXT NOT NULL,
  has_condition INTEGER NOT NULL DEFAULT 0,
  details TEXT
);
CREATE INDEX IF NOT EXISTS idx_medical_history_patient_condition ON medical_history(patient_id, condition_key);
CREATE INDEX IF NOT EXISTS idx_medical_history_clinic_id ON medical_history(clinic_id);

-- 7. Allergies
CREATE TABLE IF NOT EXISTS allergies (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  allergen TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'moderate',
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_allergies_patient_id ON allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_allergies_clinic_id ON allergies(clinic_id);

-- 8. Medications Current
CREATE TABLE IF NOT EXISTS medications_current (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  since TEXT
);
CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON medications_current(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_clinic_id ON medications_current(clinic_id);

-- 9. Rooms
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  name TEXT NOT NULL,
  number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'free',
  equipment TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rooms_branch_id ON rooms(branch_id);
CREATE INDEX IF NOT EXISTS idx_rooms_clinic_id ON rooms(clinic_id);

-- 10. Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  dentist_id TEXT NOT NULL REFERENCES users(id),
  branch_id TEXT NOT NULL REFERENCES branches(id),
  room_id TEXT REFERENCES rooms(id),
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  procedure_ids TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  source TEXT NOT NULL DEFAULT 'phone',
  color_override TEXT,
  notes TEXT,
  reminder_sent_at TEXT,
  created_by TEXT NOT NULL REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_appointments_start_at ON appointments(start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_dentist_id ON appointments(dentist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);

-- 11. Procedures
CREATE TABLE IF NOT EXISTS procedures (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  code TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL,
  default_price_halalas INTEGER NOT NULL,
  default_duration_min INTEGER NOT NULL DEFAULT 30,
  requires_tooth INTEGER NOT NULL DEFAULT 0,
  requires_surface INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  color TEXT
);
CREATE INDEX IF NOT EXISTS idx_procedures_code ON procedures(code);
CREATE INDEX IF NOT EXISTS idx_procedures_category ON procedures(category);
CREATE INDEX IF NOT EXISTS idx_procedures_clinic_id ON procedures(clinic_id);

-- 12. Teeth Registry
CREATE TABLE IF NOT EXISTS teeth_registry (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  fdi_number INTEGER NOT NULL,
  universal_number TEXT NOT NULL,
  quadrant INTEGER NOT NULL,
  type TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_teeth_registry_fdi ON teeth_registry(fdi_number);
CREATE INDEX IF NOT EXISTS idx_teeth_registry_clinic_id ON teeth_registry(clinic_id);

-- 13. Tooth Records
CREATE TABLE IF NOT EXISTS tooth_records (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tooth_number INTEGER NOT NULL,
  surface TEXT NOT NULL DEFAULT 'whole',
  condition TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'existing',
  treatment_id TEXT,
  note TEXT,
  recorded_at TEXT NOT NULL,
  recorded_by TEXT NOT NULL REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_tooth_records_patient_id ON tooth_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_tooth_records_tooth_number ON tooth_records(tooth_number);
CREATE INDEX IF NOT EXISTS idx_tooth_records_patient_tooth ON tooth_records(patient_id, tooth_number);
CREATE INDEX IF NOT EXISTS idx_tooth_records_clinic_id ON tooth_records(clinic_id);

-- 14. Treatment Plans
CREATE TABLE IF NOT EXISTS treatment_plans (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_halalas INTEGER NOT NULL DEFAULT 0,
  discount_halalas INTEGER NOT NULL DEFAULT 0,
  patient_consent_at TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_dentist_id ON treatment_plans(dentist_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON treatment_plans(status);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_clinic_id ON treatment_plans(clinic_id);

-- 15. Treatment Plan Items
CREATE TABLE IF NOT EXISTS treatment_plan_items (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  plan_id TEXT NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  procedure_id TEXT NOT NULL REFERENCES procedures(id),
  tooth_number INTEGER,
  surface TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_halalas INTEGER NOT NULL,
  discount_halalas INTEGER NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 1,
  phase INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'planned',
  scheduled_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_plan_items_plan_id ON treatment_plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_procedure_id ON treatment_plan_items(procedure_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_clinic_id ON treatment_plan_items(clinic_id);

-- 16. Treatments
CREATE TABLE IF NOT EXISTS treatments (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES appointments(id),
  plan_item_id TEXT REFERENCES treatment_plan_items(id),
  procedure_id TEXT NOT NULL REFERENCES procedures(id),
  dentist_id TEXT NOT NULL REFERENCES users(id),
  tooth_number INTEGER,
  surface TEXT,
  performed_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  anesthesia_type TEXT,
  materials_used TEXT NOT NULL,
  clinical_notes TEXT,
  price_halalas INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_treatments_patient_id ON treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_dentist_id ON treatments(dentist_id);
CREATE INDEX IF NOT EXISTS idx_treatments_performed_at ON treatments(performed_at);
CREATE INDEX IF NOT EXISTS idx_treatments_clinic_id ON treatments(clinic_id);

-- 17. Insurance Companies
CREATE TABLE IF NOT EXISTS insurance_companies (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  name TEXT NOT NULL,
  contact TEXT,
  phone TEXT,
  email TEXT,
  coverage_percent_default INTEGER NOT NULL DEFAULT 80,
  requires_preapproval INTEGER NOT NULL DEFAULT 1,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_clinic_id ON insurance_companies(clinic_id);

-- 18. Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  number TEXT NOT NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  branch_id TEXT NOT NULL REFERENCES branches(id),
  issue_date TEXT NOT NULL,
  due_date TEXT,
  subtotal_halalas INTEGER NOT NULL,
  discount_halalas INTEGER NOT NULL DEFAULT 0,
  vat_percent INTEGER NOT NULL DEFAULT 15,
  vat_halalas INTEGER NOT NULL DEFAULT 0,
  total_halalas INTEGER NOT NULL,
  paid_halalas INTEGER NOT NULL DEFAULT 0,
  balance_halalas INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  insurance_claim_id TEXT,
  zatca_qr TEXT,
  notes TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number ON invoices(number);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_clinic_id ON invoices(clinic_id);

-- 19. Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  treatment_id TEXT REFERENCES treatments(id),
  description TEXT NOT NULL,
  tooth_number INTEGER,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_halalas INTEGER NOT NULL,
  discount_halalas INTEGER NOT NULL DEFAULT 0,
  total_halalas INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_clinic_id ON invoice_items(clinic_id);

-- 20. Payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  patient_id TEXT NOT NULL REFERENCES patients(id),
  amount_halalas INTEGER NOT NULL,
  method TEXT NOT NULL DEFAULT 'cash',
  reference TEXT,
  paid_at TEXT NOT NULL,
  received_by TEXT NOT NULL REFERENCES users(id),
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_payments_clinic_id ON payments(clinic_id);

-- 21. Installments
CREATE TABLE IF NOT EXISTS installments (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  due_date TEXT NOT NULL,
  amount_halalas INTEGER NOT NULL,
  paid_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
);
CREATE INDEX IF NOT EXISTS idx_installments_invoice_id ON installments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_clinic_id ON installments(clinic_id);

-- 22. Insurance Claims
CREATE TABLE IF NOT EXISTS insurance_claims (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  company_id TEXT NOT NULL REFERENCES insurance_companies(id),
  claim_number TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  claimed_halalas INTEGER NOT NULL,
  approved_halalas INTEGER NOT NULL DEFAULT 0,
  rejected_halalas INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  response_at TEXT,
  rejection_reason TEXT,
  attachments TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_number ON insurance_claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_patient_id ON insurance_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_company_id ON insurance_claims(company_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_clinic_id ON insurance_claims(clinic_id);

-- 23. Images
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tooth_number INTEGER,
  type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  taken_at TEXT NOT NULL,
  captured_by TEXT NOT NULL REFERENCES users(id),
  notes TEXT,
  tags TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_images_patient_id ON images(patient_id);
CREATE INDEX IF NOT EXISTS idx_images_type ON images(type);
CREATE INDEX IF NOT EXISTS idx_images_clinic_id ON images(clinic_id);

-- 24. Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id TEXT NOT NULL REFERENCES users(id),
  issued_at TEXT NOT NULL,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_dentist_id ON prescriptions(dentist_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON prescriptions(clinic_id);

-- 25. Prescription Items
CREATE TABLE IF NOT EXISTS prescription_items (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  prescription_id TEXT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  drug_name TEXT NOT NULL,
  dose TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  instructions TEXT
);
CREATE INDEX IF NOT EXISTS idx_prescription_items_id ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_clinic_id ON prescription_items(clinic_id);

-- 26. Medical Reports
CREATE TABLE IF NOT EXISTS medical_reports (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  issued_by TEXT NOT NULL REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_medical_reports_patient_id ON medical_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_type ON medical_reports(type);
CREATE INDEX IF NOT EXISTS idx_medical_reports_clinic_id ON medical_reports(clinic_id);

-- 27. Labs
CREATE TABLE IF NOT EXISTS labs (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT
);
CREATE INDEX IF NOT EXISTS idx_labs_clinic_id ON labs(clinic_id);

-- 28. Lab Orders
CREATE TABLE IF NOT EXISTS lab_orders (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  lab_id TEXT NOT NULL REFERENCES labs(id),
  treatment_id TEXT REFERENCES treatments(id),
  type TEXT NOT NULL,
  tooth_numbers TEXT NOT NULL,
  shade TEXT,
  sent_at TEXT,
  due_at TEXT,
  received_at TEXT,
  status TEXT NOT NULL DEFAULT 'ordered',
  cost_halalas INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_id ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_lab_id ON lab_orders(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_clinic_id ON lab_orders(clinic_id);

-- 29. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_suppliers_clinic_id ON suppliers(clinic_id);

-- 30. Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'مستهلكات عامة',
  unit TEXT NOT NULL DEFAULT 'قطعة',
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 5,
  cost_halalas INTEGER NOT NULL DEFAULT 0,
  supplier_id TEXT REFERENCES suppliers(id),
  expiry_date TEXT,
  location TEXT
);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_clinic_id ON inventory_items(clinic_id);

-- 31. Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  item_id TEXT NOT NULL REFERENCES inventory_items(id),
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  treatment_id TEXT REFERENCES treatments(id),
  created_by TEXT NOT NULL REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_item_id ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_type ON inventory_transactions(type);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_clinic_id ON inventory_transactions(clinic_id);

-- 32. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  category TEXT NOT NULL,
  amount_halalas INTEGER NOT NULL,
  date TEXT NOT NULL,
  payee TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'transfer',
  receipt_path TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_clinic_id ON expenses(clinic_id);

-- 33. Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  check_in TEXT NOT NULL,
  check_out TEXT,
  date TEXT NOT NULL,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_clinic_id ON attendance(clinic_id);

-- 34. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  read_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_clinic_id ON notifications(clinic_id);

-- 35. Message Templates
CREATE TABLE IF NOT EXISTS message_templates (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  key TEXT NOT NULL,
  channel TEXT NOT NULL,
  body_ar TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_templates_key ON message_templates(key);
CREATE INDEX IF NOT EXISTS idx_message_templates_clinic_id ON message_templates(clinic_id);

-- 36. Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before TEXT,
  after TEXT,
  ip TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_clinic_id ON audit_log(clinic_id);

-- 37. Settings
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  key TEXT NOT NULL,
  value TEXT,
  scope TEXT NOT NULL DEFAULT 'clinic'
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_key_clinic ON settings(key, clinic_id);
CREATE INDEX IF NOT EXISTS idx_settings_clinic_id ON settings(clinic_id);

-- 38. License
CREATE TABLE IF NOT EXISTS license (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  key TEXT NOT NULL,
  plan TEXT NOT NULL,
  seats INTEGER NOT NULL DEFAULT 1,
  activated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL,
  last_check_at TEXT NOT NULL,
  signature TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_license_key ON license(key);
CREATE INDEX IF NOT EXISTS idx_license_clinic_id ON license(clinic_id);
