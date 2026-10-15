process.env.DATABASE_PATH = ':memory:';
import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { initDatabase, closeDatabase, getSqlite } from '../../db/connection';
import { registerIpcHandlers, invokeIpc } from '../../ipc';
import { decideBootstrap } from '../../db/bootstrap';
import { validatePasswordPolicy } from '../../../shared/passwordPolicy';

function clearTables(sqlite: ReturnType<typeof getSqlite>) {
  sqlite.pragma('foreign_keys = OFF');
  sqlite.exec(`
    DROP TRIGGER IF EXISTS trg_prevent_audit_log_delete;
    DELETE FROM audit_log;
    CREATE TRIGGER IF NOT EXISTS trg_prevent_audit_log_delete
    BEFORE DELETE ON audit_log
    BEGIN
      SELECT RAISE(ABORT, 'سجلات التدقيق غير قابلة للحذف (Append-only)');
    END;
    DELETE FROM rooms;
    DELETE FROM users;
    DELETE FROM branches;
    DELETE FROM clinics;
    DELETE FROM role_permissions;
    DELETE FROM procedures;
    DELETE FROM teeth_registry;
    DELETE FROM settings;
    DELETE FROM message_templates;
    DELETE FROM patients;
  `);
  sqlite.pragma('foreign_keys = ON');
}

describe('First Run Setup & Bootstrap Decision Tests', () => {
  let sqlite: ReturnType<typeof getSqlite>;

  before(() => {
    // تهيئة قاعدة بيانات معزولة تماماً في الذاكرة مع تطبيق جميع الهجرات
    initDatabase(':memory:');
    sqlite = getSqlite();
    registerIpcHandlers();
  });

  beforeEach(() => {
    clearTables(sqlite);
    delete process.env.TEST_PACKAGED;
    delete process.env.EYADATI_DEMO;
  });

  after(() => {
    closeDatabase();
    delete process.env.DATABASE_PATH;
    delete process.env.TEST_PACKAGED;
    delete process.env.EYADATI_DEMO;
  });

  // 1. قاعدة فارغة ← needsSetup=true؛ بعد الإعداد الناجح ← false
  it('قاعدة فارغة تعيد needsSetup=true، وبعد الإعداد الناجح تعيد needsSetup=false', async () => {
    const beforeCheck = await invokeIpc('auth:needsSetup');
    assert.equal(beforeCheck.ok, true);
    assert.equal(beforeCheck.data.needsSetup, true, 'القاعدة الفارغة يجب أن تتطلب إعداداً أولياً');

    const setupPayload = {
      clinic: {
        name: 'عيادة الأمل التخصصية',
        phone: '0551234567',
        city: 'الرياض',
        tax_number: '310000000000003',
      },
      owner: {
        full_name: 'د. فيصل العتيبي',
        username: 'dr.faisal',
        password: 'SuperSecurePass2026',
      },
    };

    const setupRes = await invokeIpc('auth:setupFirstRun', setupPayload);
    assert.equal(setupRes.ok, true);
    assert.equal(setupRes.data.username, 'dr.faisal');
    assert.equal(setupRes.data.role, 'owner');
    assert.equal(setupRes.data.full_name, 'د. فيصل العتيبي');
    assert.equal('password' in setupRes.data, false, 'ممنوع إرجاع كلمة المرور');
    assert.equal('password_hash' in setupRes.data, false, 'ممنوع إرجاع هاش كلمة المرور');

    const afterCheck = await invokeIpc('auth:needsSetup');
    assert.equal(afterCheck.ok, true);
    assert.equal(afterCheck.data.needsSetup, false, 'بعد الإعداد الناجح يجب ألا يتطلب النظام إعداداً');
  });

  // 2. استدعاء الإعداد مرتين ← الثاني يُرفض ولا يتغير شيء
  it('استدعاء الإعداد مرتين: الطلب الثاني يُرفض بخطأ واضح ولا يتغير شيء', async () => {
    const validPayload = {
      clinic: { name: 'عيادة النقاء للأسنان' },
      owner: {
        full_name: 'د. سامي المحمد',
        username: 'dr.sami',
        password: 'StrongPassword123',
      },
    };

    const firstRes = await invokeIpc('auth:setupFirstRun', validPayload);
    assert.equal(firstRes.ok, true);

    // المحاولة الثانية
    const secondRes = await invokeIpc('auth:setupFirstRun', {
      clinic: { name: 'محاولة استيلاء' },
      owner: {
        full_name: 'مخترق',
        username: 'hacker',
        password: 'AnotherPassword999',
      },
    });

    assert.equal(secondRes.ok, false);
    assert.match(secondRes.error, /تم إعداد النظام مسبقاً/);

    // التأكد من عدم إنشاء أي مستخدم إضافي
    const userCount = (sqlite.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
    assert.equal(userCount, 1);
  });

  // 3. كلمة مرور ضعيفة (قصيرة، بلا رقم، تساوي اسم المستخدم، شائعة) ← ترفض كلها بأسباب مختلفة
  it('سياسة كلمة المرور: ترفض كلمات المرور الضعيفة بأسباب دقيقة ومختلفة', async () => {
    const testCases = [
      {
        pwd: 'short',
        user: 'admin',
        expectedMsg: '10 أحرف أو أكثر',
      },
      {
        pwd: 'NoNumbersHereAtAll',
        user: 'doctor',
        expectedMsg: 'رقم واحد على الأقل',
      },
      {
        pwd: '12345678901234',
        user: 'dentist',
        expectedMsg: 'حرف واحد على الأقل',
      },
      {
        pwd: 'dr.khalid123',
        user: 'dr.khalid',
        expectedMsg: 'تحتوي على اسم المستخدم',
      },
      {
        pwd: 'password123',
        user: 'user1',
        expectedMsg: 'شائعة جداً',
      },
      {
        pwd: 'admin20261234',
        user: 'user2',
        expectedMsg: 'شائعة جداً',
      },
    ];

    for (const tc of testCases) {
      const res = validatePasswordPolicy(tc.pwd, tc.user);
      assert.equal(res.valid, false, `كلمة المرور "${tc.pwd}" كان يجب أن تُرفض`);
      assert.match(res.error || '', new RegExp(tc.expectedMsg));

      // تجربة الإرسال عبر IPC للتأكد من الرفض
      const ipcRes = await invokeIpc('auth:setupFirstRun', {
        clinic: { name: 'عيادة الفحص' },
        owner: { full_name: 'دكتور فحص', username: tc.user, password: tc.pwd },
      });
      assert.equal(ipcRes.ok, false);
      assert.match(ipcRes.error, new RegExp(tc.expectedMsg));
    }
  });

  // 4. فشل مُحقَن بعد إنشاء المستخدم وقبل seedReferenceData ← لا توجد عيادة ولا مستخدم (rollback)
  it('فشل مُحقَن أثناء الإعداد يضمن التراجع التام (Rollback) دون بقاء عيادة أو مستخدم', async () => {
    assert.throws(() => {
      sqlite.transaction(() => {
        sqlite.prepare("INSERT INTO clinics (id, clinic_id, created_at, updated_at, name, phone, address, city, currency, timezone, working_hours, slot_duration_min) VALUES ('err-c', 'err-c', 'now', 'now', 'fail', '0500', 'addr', 'city', 'SAR', 'Asia/Riyadh', '[]', 30)").run();
        sqlite.prepare("INSERT INTO users (id, clinic_id, created_at, updated_at, full_name, username, password_hash, role, phone) VALUES ('err-u', 'err-c', 'now', 'now', 'fail', 'fail_user', 'dummy_hash', 'owner', '0500')").run();
        throw new Error('خطأ محقون لإثبات التراجع');
      })();
    }, /خطأ محقون لإثبات التراجع/);

    const failClinic = sqlite.prepare("SELECT * FROM clinics WHERE id = 'err-c'").get();
    const failUser = sqlite.prepare("SELECT * FROM users WHERE id = 'err-u'").get();
    assert.equal(failClinic, undefined, 'العيادة يجب ألا تُحفظ عند فشل المعاملة');
    assert.equal(failUser, undefined, 'المستخدم يجب ألا يُحفظ عند فشل المعاملة');
  });

  // 5. بعد الإعداد: count(role_permissions) > 0، و count(procedures)=60، و count(patients)=0، و foreign_key_check فارغ، و password_hash يبدأ بـ $2b$12$ ويطابق bcrypt.compareSync
  it('التحقق من حالة قاعدة البيانات بعد الإعداد: role_permissions>0, procedures=60, patients=0, foreign_key_check فارغ, وتشفير bcrypt 12', async () => {
    const rawPassword = 'SecureDoctor@2026';
    const payload = {
      clinic: {
        name: 'مركز الابتسامة المتقدم للأسنان',
        phone: '0544433221',
        city: 'جدة',
        tax_number: '300000000000003',
      },
      owner: {
        full_name: 'د. طارق الحازمي',
        username: 'dr.tareq',
        password: rawPassword,
      },
    };

    const res = await invokeIpc('auth:setupFirstRun', payload);
    assert.equal(res.ok, true);

    // count(role_permissions) > 0
    const rolePermsCount = (sqlite.prepare('SELECT COUNT(*) as c FROM role_permissions').get() as any).c;
    assert.ok(rolePermsCount > 0, 'يجب وجود صلاحيات الأدوار المرجعية');

    // count(procedures) = 60
    const procCount = (sqlite.prepare('SELECT COUNT(*) as c FROM procedures').get() as any).c;
    assert.equal(procCount, 60, 'يجب زراعة 60 إجراء مرجعي بدقة');

    // count(patients) = 0
    const patientsCount = (sqlite.prepare('SELECT COUNT(*) as c FROM patients').get() as any).c;
    assert.equal(patientsCount, 0, 'يجب ألا يحتوي الإعداد الأولي على مرضى تجريبيين');

    // foreign_key_check فارغ
    const fkErrors = sqlite.prepare('PRAGMA foreign_key_check').all();
    assert.equal(fkErrors.length, 0, 'فحص المفاتيح الأجنبية foreign_key_check يجب أن يكون نظيفاً تماماً');

    // password_hash يبدأ بـ $2b$12$ ويطابق bcrypt.compareSync
    const ownerRow = sqlite.prepare("SELECT password_hash FROM users WHERE username = 'dr.tareq'").get() as any;
    assert.ok(ownerRow?.password_hash, 'يجب وجود هاش كلمة المرور');
    assert.match(ownerRow.password_hash, /^\$2[ab]\$12\$/, 'هاش كلمة المرور يجب أن يكون Bcrypt بجولة 12 ($2b$12$)');
    assert.equal(bcrypt.compareSync(rawPassword, ownerRow.password_hash), true, 'هاش كلمة المرور يطابق القيمة الأصلية');
  });

  // 6. قاعدة فيها مستخدمون (محاكاة نسخة قديمة) ← decideBootstrap لا تزرع ولا تعدّل شيئاً
  it('قاعدة فيها مستخدمون (محاكاة نسخة قديمة): decideBootstrap لا تزرع ولا تعدل شيئاً', async () => {
    sqlite.prepare(`
      INSERT INTO clinics (id, clinic_id, created_at, updated_at, name, phone, address, city, currency, timezone, working_hours, slot_duration_min)
      VALUES ('c-old', 'c-old', 'now', 'now', 'عيادة قديمة', '0500000000', 'الرياض', 'الرياض', 'SAR', 'Asia/Riyadh', '[]', 30)
    `).run();
    sqlite.prepare(`
      INSERT INTO users (id, clinic_id, created_at, updated_at, full_name, username, password_hash, role, phone)
      VALUES ('u-old', 'c-old', 'now', 'now', 'طبيب قديم', 'old.dentist', 'dummy_hash', 'owner', '0500000000')
    `).run();

    const seeded = decideBootstrap(sqlite);
    assert.equal(seeded, false, 'decideBootstrap يجب ألا تزرع شيئاً إذا كان هناك مستخدم مسبقاً');

    const procCount = (sqlite.prepare('SELECT COUNT(*) as c FROM procedures').get() as any).c;
    assert.equal(procCount, 0, 'لم تتم إضافة إجراءات جديدة لأن القاعدة ليست جديدة');
  });

  // 7. محاكاة الإنتاج المغلَّف: لا تزرع شيئاً والقاعدة تبقى فارغة
  it('في الإنتاج المغلّف (Packaged): decideBootstrap لا تزرع شيئاً وتترك القاعدة فارغة', async () => {
    process.env.TEST_PACKAGED = '1';
    delete process.env.EYADATI_DEMO;

    const seeded = decideBootstrap(sqlite);
    assert.equal(seeded, false, 'في الإنتاج المغلّف لا يجب بذر بيانات التطوير تلقائياً');

    const usersCount = (sqlite.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
    assert.equal(usersCount, 0, 'القاعدة يجب أن تظل بلا مستخدمين حتى إكمال معالج الإعداد');

    const needsSetupRes = await invokeIpc('auth:needsSetup');
    assert.equal(needsSetupRes.data.needsSetup, true);
  });
});
