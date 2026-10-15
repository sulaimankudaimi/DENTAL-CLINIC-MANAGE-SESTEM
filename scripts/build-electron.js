import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.join(process.cwd(), 'dist-electron');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('[بناء إلكترون] جاري تجميع ملفات العملية الرئيسية (Main Process) وملف الربط (Preload)...');

// 1. Build Main Process
await esbuild.build({
  entryPoints: ['electron/main.ts'],
  outfile: 'dist-electron/main.cjs',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: true,
  external: [
    'electron',
    'better-sqlite3',
    'electron-updater',
    'electron-log',
    'fsevents',
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env.LICENSE_SERVER_URL': JSON.stringify(process.env.LICENSE_SERVER_URL || ''),
    'process.env.UPDATE_URL': JSON.stringify(process.env.UPDATE_URL || ''),
  },
});

// 2. Build Preload Script
await esbuild.build({
  entryPoints: ['electron/preload.ts'],
  outfile: 'dist-electron/preload.cjs',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: true,
  external: ['electron'],
});

// Copy migrations
const migrationsSrc = path.join(process.cwd(), 'electron', 'db', 'migrations');
const migrationsDest = path.join(outDir, 'migrations');
if (fs.existsSync(migrationsSrc)) {
  fs.mkdirSync(migrationsDest, { recursive: true });
  for (const file of fs.readdirSync(migrationsSrc)) {
    fs.copyFileSync(path.join(migrationsSrc, file), path.join(migrationsDest, file));
  }
}

// Copy assets if any
const assetsSrc = path.join(process.cwd(), 'electron', 'assets');
const assetsDest = path.join(outDir, 'assets');
if (fs.existsSync(assetsSrc)) {
  fs.mkdirSync(assetsDest, { recursive: true });
  for (const file of fs.readdirSync(assetsSrc)) {
    fs.copyFileSync(path.join(assetsSrc, file), path.join(assetsDest, file));
  }
}

console.log('[بناء إلكترون] اكتمل البناء بنجاح في مجلد dist-electron/');
