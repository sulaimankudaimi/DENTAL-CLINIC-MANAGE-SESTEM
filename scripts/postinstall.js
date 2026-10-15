#!/usr/bin/env node
import { execSync } from 'node:child_process';

console.log('[عيادتي] جاري التحقق من تهيئة الحزمة الأصلية better-sqlite3 لبيئة Electron...');

try {
  // محاولة إعادة بناء better-sqlite3 لنسخة Electron المستهدفة
  execSync('npx electron-rebuild -f -w better-sqlite3', {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('[عيادتي] تم تجهيز وبناء better-sqlite3 بنجاح.');
} catch (error) {
  console.warn('\n' + '='.repeat(78));
  console.warn('⚠️  [عيادتي] تنبيه: تعذرت إعادة بناء مكتبة C++ الأصلية (better-sqlite3).');
  console.warn('إذا كنت تعمل على نظام Windows وترغب بتشغيل Electron محلياً أو إنشاء المثبت،');
  console.warn('يُرجى التأكد من تثبيت:');
  console.warn('  1. Visual Studio Build Tools 2022 (أو Visual Studio Community)');
  console.warn('  2. حزمة العمل "تطوير تطبيقات سطح المكتب بلغة C++" (Desktop development with C++)');
  console.warn('  3. Windows 10/11 SDK');
  console.warn('');
  console.warn('ملاحظة: يمكنك متابعة تطوير واجهة المستخدم عبر المتصفح (npm run dev:vite).');
  console.warn('سيتم التحقق الصارم من توفر بيئة الترجمة عند تشغيل أمر البناء النهائي (npm run build:win).');
  console.warn('='.repeat(78) + '\n');

  // الخروج بنجاح في بيئة التطوير والتثبيت
  process.exit(0);
}
