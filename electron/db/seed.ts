import { getSqlite } from './connection';
import bcrypt from 'bcryptjs';
import { logger } from '../services/logger';
import { DEV_CREDENTIALS } from '@shared/devCredentials';
import {
  seedClinic,
  seedBranch,
  seedUsers,
  seedRooms,
  seedInsuranceCompanies,
  seedProcedures,
  seedPatients,
  seedMedicalHistories,
  seedAllergies,
  seedAppointments,
  seedInvoices,
  seedInvoiceItems,
  seedPayments,
  seedToothRecords,
  seedSuppliers,
  seedInventoryItems,
} from './seedData';
import {
  seedTeethRegistry,
  seedRolePermissions,
  seedSettings,
  seedMessageTemplates,
  seedLabs,
  seedLabOrders,
  seedPrescriptions,
  seedPrescriptionItems,
  seedExpenses,
  seedTreatmentPlans,
  seedTreatmentPlanItems,
  seedNotifications,
} from './seedExtended';

/**
 * 1. زراعة البيانات المرجعية الأساسية فقط (الإجراءات، الأسنان، الصلاحيات، الإعدادات، القوالب، الغرف)
 */
export function seedReferenceData(
  sqlite: ReturnType<typeof getSqlite>,
  clinicId: string,
  _ownerId: string
): void {
  // 1. Role Permissions (Full matrix for 5 roles)
  const insertRolePerm = sqlite.prepare(`
    INSERT OR REPLACE INTO role_permissions (id, clinic_id, created_at, updated_at, deleted_at, role, resource, action)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @role, @resource, @action)
  `);
  for (const rp of seedRolePermissions) {
    insertRolePerm.run({
      ...rp,
      clinic_id: clinicId,
    });
  }

  // 2. Rooms (Linked to default branch)
  const branchRow = sqlite
    .prepare('SELECT id FROM branches WHERE clinic_id = ? LIMIT 1')
    .get(clinicId) as { id: string } | undefined;
  const defaultBranchId = branchRow?.id || seedBranch.id;

  const insertRoom = sqlite.prepare(`
    INSERT OR REPLACE INTO rooms (id, clinic_id, created_at, updated_at, deleted_at, branch_id, name, number, status, equipment)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @branch_id, @name, @number, @status, @equipment)
  `);
  for (const r of seedRooms) {
    insertRoom.run({
      ...r,
      clinic_id: clinicId,
      branch_id: defaultBranchId,
      equipment: JSON.stringify(r.equipment),
    });
  }

  // 3. Procedures (60 procedures)
  const insertProc = sqlite.prepare(`
    INSERT OR REPLACE INTO procedures (id, clinic_id, created_at, updated_at, deleted_at, code, name_ar, name_en, category, default_price_halalas, default_duration_min, requires_tooth, requires_surface, is_active, color)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @code, @name_ar, @name_en, @category, @default_price_halalas, @default_duration_min, @requires_tooth, @requires_surface, @is_active, @color)
  `);
  for (const p of seedProcedures) {
    insertProc.run({
      ...p,
      clinic_id: clinicId,
      requires_tooth: p.requires_tooth ? 1 : 0,
      requires_surface: p.requires_surface ? 1 : 0,
      is_active: p.is_active ? 1 : 0,
    });
  }

  // 4. Teeth Registry (32 Permanent + 20 Primary FDI)
  const insertToothReg = sqlite.prepare(`
    INSERT OR REPLACE INTO teeth_registry (id, clinic_id, created_at, updated_at, deleted_at, fdi_number, universal_number, quadrant, type, is_primary, name_ar, name_en)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @fdi_number, @universal_number, @quadrant, @type, @is_primary, @name_ar, @name_en)
  `);
  for (const t of seedTeethRegistry) {
    insertToothReg.run({
      ...t,
      clinic_id: clinicId,
      is_primary: t.is_primary ? 1 : 0,
    });
  }

  // 5. Settings (Defaults from defaultSettings.ts)
  const insertSetting = sqlite.prepare(`
    INSERT OR REPLACE INTO settings (id, clinic_id, created_at, updated_at, deleted_at, key, value, scope)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @key, @value, @scope)
  `);
  for (const s of seedSettings) {
    insertSetting.run({
      ...s,
      clinic_id: clinicId,
      value: JSON.stringify(s.value),
    });
  }

  // 6. Message Templates
  const insertTemplate = sqlite.prepare(`
    INSERT OR REPLACE INTO message_templates (id, clinic_id, created_at, updated_at, deleted_at, key, channel, body_ar)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @key, @channel, @body_ar)
  `);
  for (const tmpl of seedMessageTemplates) {
    insertTemplate.run({
      ...tmpl,
      clinic_id: clinicId,
    });
  }
}

/**
 * 2. زراعة البيانات التشغيلية والتجريبية (المرضى، المواعيد، الفواتير، المخزون، الوصفات...)
 * وتُنشئ المستخدمين غير المالكين من DEV_CREDENTIALS إن لم يكونوا مسجلين بالفعل
 */
export function seedDemoData(
  sqlite: ReturnType<typeof getSqlite>,
  clinicId: string,
  _ownerId: string
): void {
  const branchRow = sqlite
    .prepare('SELECT id FROM branches WHERE clinic_id = ? LIMIT 1')
    .get(clinicId) as { id: string } | undefined;
  const defaultBranchId = branchRow?.id || seedBranch.id;

  // 1. Ensure staff/dentists exist from DEV_CREDENTIALS
  const insertUser = sqlite.prepare(`
    INSERT OR REPLACE INTO users (
      id, clinic_id, created_at, updated_at, deleted_at,
      full_name, username, password_hash, role, specialty,
      license_number, phone, email, avatar_path, color,
      commission_percent, is_active, last_login_at,
      must_change_password, pin_hash, pin_attempts
    )
    VALUES (
      @id, @clinic_id, @created_at, @updated_at, @deleted_at,
      @full_name, @username, @password_hash, @role, @specialty,
      @license_number, @phone, @email, @avatar_path, @color,
      @commission_percent, @is_active, @last_login_at,
      @must_change_password, @pin_hash, @pin_attempts
    )
  `);

  const INITIAL_CREDENTIALS = DEV_CREDENTIALS;
  for (const u of seedUsers) {
    const existing = sqlite.prepare('SELECT id FROM users WHERE id = ? OR username = ?').get(u.id, u.username);
    if (!existing) {
      const creds = INITIAL_CREDENTIALS[u.username] || {
        password: `User@${u.username.replace(/[^a-zA-Z0-9]/g, '')}2026`,
        pin: '9876',
      };
      const passwordHash = bcrypt.hashSync(creds.password, 12);
      const pinHash = bcrypt.hashSync(creds.pin, 10);

      insertUser.run({
        ...u,
        clinic_id: clinicId,
        password_hash: passwordHash,
        pin_hash: pinHash,
        pin_attempts: 0,
        must_change_password: 1,
        is_active: u.is_active ? 1 : 0,
      });
    }
  }

  // 2. Insurance Companies
  const insertInsurance = sqlite.prepare(`
    INSERT OR REPLACE INTO insurance_companies (id, clinic_id, created_at, updated_at, deleted_at, name, contact, phone, email, coverage_percent_default, requires_preapproval, notes)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @name, @contact, @phone, @email, @coverage_percent_default, @requires_preapproval, @notes)
  `);
  for (const ins of seedInsuranceCompanies) {
    insertInsurance.run({
      ...ins,
      clinic_id: clinicId,
      requires_preapproval: ins.requires_preapproval ? 1 : 0,
    });
  }

  // 3. Suppliers
  const insertSupplier = sqlite.prepare(`
    INSERT OR REPLACE INTO suppliers (id, clinic_id, created_at, updated_at, deleted_at, name, phone, email, notes)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @name, @phone, @email, @notes)
  `);
  for (const sup of seedSuppliers) {
    insertSupplier.run({ ...sup, clinic_id: clinicId });
  }

  // 4. Inventory Items
  const insertInventory = sqlite.prepare(`
    INSERT OR REPLACE INTO inventory_items (id, clinic_id, created_at, updated_at, deleted_at, name, sku, category, unit, quantity, min_quantity, cost_halalas, supplier_id, expiry_date, location)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @name, @sku, @category, @unit, @quantity, @min_quantity, @cost_halalas, @supplier_id, @expiry_date, @location)
  `);
  for (const item of seedInventoryItems) {
    insertInventory.run({ ...item, clinic_id: clinicId });
  }

  // 5. Labs
  const insertLab = sqlite.prepare(`
    INSERT OR REPLACE INTO labs (id, clinic_id, created_at, updated_at, deleted_at, name, phone, email, address)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @name, @phone, @email, @address)
  `);
  for (const lab of seedLabs) {
    insertLab.run({ ...lab, clinic_id: clinicId });
  }

  // 6. Patients
  const insertPatient = sqlite.prepare(`
    INSERT OR REPLACE INTO patients (id, clinic_id, created_at, updated_at, deleted_at, code, first_name, father_name, family_name, gender, birth_date, national_id, phone, phone_alt, email, address, city, blood_type, marital_status, occupation, emergency_contact_name, emergency_contact_phone, referral_source, primary_dentist_id, insurance_company_id, insurance_policy_no, insurance_expiry, notes, photo_path, is_active)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @code, @first_name, @father_name, @family_name, @gender, @birth_date, @national_id, @phone, @phone_alt, @email, @address, @city, @blood_type, @marital_status, @occupation, @emergency_contact_name, @emergency_contact_phone, @referral_source, @primary_dentist_id, @insurance_company_id, @insurance_policy_no, @insurance_expiry, @notes, @photo_path, @is_active)
  `);
  for (const pat of seedPatients) {
    insertPatient.run({
      ...pat,
      clinic_id: clinicId,
      is_active: pat.is_active ? 1 : 0,
    });
  }

  // 7. Medical History & Allergies
  const insertMH = sqlite.prepare(`
    INSERT OR REPLACE INTO medical_history (id, clinic_id, created_at, updated_at, deleted_at, patient_id, condition_key, has_condition, details)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @patient_id, @condition_key, @has_condition, @details)
  `);
  for (const mh of seedMedicalHistories) {
    insertMH.run({
      ...mh,
      clinic_id: clinicId,
      has_condition: mh.has_condition ? 1 : 0,
    });
  }

  const insertAllergy = sqlite.prepare(`
    INSERT OR REPLACE INTO allergies (id, clinic_id, created_at, updated_at, deleted_at, patient_id, allergen, severity, notes)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @patient_id, @allergen, @severity, @notes)
  `);
  for (const al of seedAllergies) {
    insertAllergy.run({ ...al, clinic_id: clinicId });
  }

  // 8. Appointments
  const insertAppt = sqlite.prepare(`
    INSERT OR REPLACE INTO appointments (id, clinic_id, created_at, updated_at, deleted_at, patient_id, dentist_id, branch_id, room_id, start_at, end_at, procedure_ids, status, source, color_override, notes, reminder_sent_at, created_by)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @patient_id, @dentist_id, @branch_id, @room_id, @start_at, @end_at, @procedure_ids, @status, @source, @color_override, @notes, @reminder_sent_at, @created_by)
  `);
  for (const apt of seedAppointments) {
    insertAppt.run({
      ...apt,
      clinic_id: clinicId,
      branch_id: defaultBranchId,
      procedure_ids: JSON.stringify(apt.procedure_ids),
    });
  }

  // 9. Treatment Plans
  const insertTreatmentPlan = sqlite.prepare(`
    INSERT OR REPLACE INTO treatment_plans (id, clinic_id, created_at, updated_at, deleted_at, patient_id, dentist_id, title, status, total_halalas, discount_halalas, patient_consent_at, notes)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @patient_id, @dentist_id, @title, @status, @total_halalas, @discount_halalas, @patient_consent_at, @notes)
  `);
  for (const tp of seedTreatmentPlans) {
    insertTreatmentPlan.run({ ...tp, clinic_id: clinicId });
  }

  const insertTreatmentPlanItem = sqlite.prepare(`
    INSERT OR REPLACE INTO treatment_plan_items (id, clinic_id, created_at, updated_at, deleted_at, plan_id, procedure_id, tooth_number, surface, quantity, unit_price_halalas, discount_halalas, priority, phase, status, scheduled_date)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @plan_id, @procedure_id, @tooth_number, @surface, @quantity, @unit_price_halalas, @discount_halalas, @priority, @phase, @status, @scheduled_date)
  `);
  for (const tpi of seedTreatmentPlanItems) {
    insertTreatmentPlanItem.run({ ...tpi, clinic_id: clinicId });
  }

  // 10. Tooth records
  const insertTooth = sqlite.prepare(`
    INSERT OR REPLACE INTO tooth_records (id, clinic_id, created_at, updated_at, deleted_at, patient_id, tooth_number, surface, condition, status, treatment_id, note, recorded_at, recorded_by)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @patient_id, @tooth_number, @surface, @condition, @status, @treatment_id, @note, @recorded_at, @recorded_by)
  `);
  for (const tr of seedToothRecords) {
    insertTooth.run({ ...tr, clinic_id: clinicId });
  }

  // 11. Invoices & Items & Payments
  const insertInv = sqlite.prepare(`
    INSERT OR REPLACE INTO invoices (id, clinic_id, created_at, updated_at, deleted_at, number, patient_id, branch_id, issue_date, due_date, subtotal_halalas, discount_halalas, vat_percent, vat_halalas, total_halalas, paid_halalas, balance_halalas, status, insurance_claim_id, zatca_qr, notes)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @number, @patient_id, @branch_id, @issue_date, @due_date, @subtotal_halalas, @discount_halalas, @vat_percent, @vat_halalas, @total_halalas, @paid_halalas, @balance_halalas, @status, @insurance_claim_id, @zatca_qr, @notes)
  `);
  for (const inv of seedInvoices) {
    insertInv.run({ ...inv, clinic_id: clinicId, branch_id: defaultBranchId });
  }

  const insertInvItem = sqlite.prepare(`
    INSERT OR REPLACE INTO invoice_items (id, clinic_id, created_at, updated_at, deleted_at, invoice_id, treatment_id, description, tooth_number, quantity, unit_price_halalas, discount_halalas, total_halalas)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @invoice_id, @treatment_id, @description, @tooth_number, @quantity, @unit_price_halalas, @discount_halalas, @total_halalas)
  `);
  for (const item of seedInvoiceItems) {
    insertInvItem.run({ ...item, clinic_id: clinicId });
  }

  const insertPay = sqlite.prepare(`
    INSERT OR REPLACE INTO payments (id, clinic_id, created_at, updated_at, deleted_at, invoice_id, patient_id, amount_halalas, method, reference, paid_at, received_by, notes)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @invoice_id, @patient_id, @amount_halalas, @method, @reference, @paid_at, @received_by, @notes)
  `);
  for (const pay of seedPayments) {
    insertPay.run({ ...pay, clinic_id: clinicId });
  }

  // 12. Lab Orders
  const insertLabOrder = sqlite.prepare(`
    INSERT OR REPLACE INTO lab_orders (id, clinic_id, created_at, updated_at, deleted_at, patient_id, lab_id, treatment_id, type, tooth_numbers, shade, sent_at, due_at, received_at, status, cost_halalas, notes)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @patient_id, @lab_id, @treatment_id, @type, @tooth_numbers, @shade, @sent_at, @due_at, @received_at, @status, @cost_halalas, @notes)
  `);
  for (const lbo of seedLabOrders) {
    insertLabOrder.run({
      ...lbo,
      clinic_id: clinicId,
      tooth_numbers: JSON.stringify(lbo.tooth_numbers),
    });
  }

  // 13. Prescriptions & items
  const insertPrescription = sqlite.prepare(`
    INSERT OR REPLACE INTO prescriptions (id, clinic_id, created_at, updated_at, deleted_at, patient_id, dentist_id, issued_at, notes)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @patient_id, @dentist_id, @issued_at, @notes)
  `);
  for (const rx of seedPrescriptions) {
    insertPrescription.run({ ...rx, clinic_id: clinicId });
  }

  const insertPrescriptionItem = sqlite.prepare(`
    INSERT OR REPLACE INTO prescription_items (id, clinic_id, created_at, updated_at, deleted_at, prescription_id, drug_name, dose, frequency, duration_days, instructions)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @prescription_id, @drug_name, @dose, @frequency, @duration_days, @instructions)
  `);
  for (const rxi of seedPrescriptionItems) {
    insertPrescriptionItem.run({ ...rxi, clinic_id: clinicId });
  }

  // 14. Expenses
  const insertExpense = sqlite.prepare(`
    INSERT OR REPLACE INTO expenses (id, clinic_id, created_at, updated_at, deleted_at, category, amount_halalas, date, payee, payment_method, receipt_path, notes)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @category, @amount_halalas, @date, @payee, @payment_method, @receipt_path, @notes)
  `);
  for (const exp of seedExpenses) {
    insertExpense.run({ ...exp, clinic_id: clinicId });
  }

  // 15. Notifications
  const insertNotification = sqlite.prepare(`
    INSERT OR REPLACE INTO notifications (id, clinic_id, created_at, updated_at, deleted_at, user_id, type, title, body, entity_type, entity_id, read_at)
    VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @user_id, @type, @title, @body, @entity_type, @entity_id, @read_at)
  `);
  for (const notif of seedNotifications) {
    insertNotification.run({ ...notif, clinic_id: clinicId });
  }
}

/**
 * 3. بذر وضع التطوير الكامل (عيادة + المستخدمين الخمسة + المرجعية + التجريبية)
 */
export function runDevSeed(customSqlite?: ReturnType<typeof getSqlite>): void {
  const sqlite = customSqlite || getSqlite();

  // فحص ما إذا كانت العيادة موجودة مسبقاً
  const checkStmt = sqlite.prepare('SELECT COUNT(*) as count FROM clinics');
  const result = checkStmt.get() as { count: number };
  if (result.count > 0) {
    return;
  }

  const transaction = sqlite.transaction(() => {
    // 1. Clinic
    const insertClinic = sqlite.prepare(`
      INSERT OR REPLACE INTO clinics (id, clinic_id, created_at, updated_at, deleted_at, name, logo_path, phone, email, address, city, tax_number, cr_number, currency, timezone, working_hours, slot_duration_min)
      VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @name, @logo_path, @phone, @email, @address, @city, @tax_number, @cr_number, @currency, @timezone, @working_hours, @slot_duration_min)
    `);
    insertClinic.run({
      ...seedClinic,
      working_hours: JSON.stringify(seedClinic.working_hours),
    });

    // 2. Branch
    const insertBranch = sqlite.prepare(`
      INSERT OR REPLACE INTO branches (id, clinic_id, created_at, updated_at, deleted_at, name, phone, address, is_active)
      VALUES (@id, @clinic_id, @created_at, @updated_at, @deleted_at, @name, @phone, @address, @is_active)
    `);
    insertBranch.run({
      ...seedBranch,
      is_active: seedBranch.is_active ? 1 : 0,
    });

    // 3. Reference Data
    seedReferenceData(sqlite, seedClinic.id, seedUsers[0].id);

    // 4. Demo Data (includes users)
    seedDemoData(sqlite, seedClinic.id, seedUsers[0].id);

    if (process.env.NODE_ENV !== 'production') {
      const credsReport = Object.entries(DEV_CREDENTIALS)
        .map(([u, c]) => `  - ${u}: كلمة المرور = ${c.password} | PIN = ${c.pin}`)
        .join('\n');
      logger.info(
        `[تهيئة المستخدمين] تم توليد هاشات كلمات المرور (Bcrypt 12) ورموز PIN (Bcrypt 10) وتفعيل must_change_password:\n${credsReport}`
      );
    }
  });

  transaction();
}

export const runSeed = runDevSeed;
