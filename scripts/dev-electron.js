import { spawn } from 'node:child_process';

// In desktop GUI environments (Windows, macOS, or Linux with DISPLAY), launch Electron.
// In headless cloud/container environments, keep running so Vite continues serving the web preview.
if (process.platform === 'win32' || process.env.DISPLAY) {
  console.log('[عيادتي] تشغيل نافذة سطح المكتب Electron بنظام SQLite...');
  const entry = process.env.ELECTRON_ENTRY || 'electron/main.ts';
  const electronProcess = spawn('npx', ['electron', '-r', 'tsx/cjs', entry], { stdio: 'inherit', shell: true });
  electronProcess.on('close', (code) => {
    process.exit(code ?? 0);
  });
} else {
  console.log('[عيادتي] تشغيل بيئة المعاينة السحابية: خادم Vite نشط على المنفذ 3000');
  // Keep alive for concurrently
  setInterval(() => {}, 1000 * 60 * 60);
}
