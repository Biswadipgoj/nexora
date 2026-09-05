const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distElectronDir = path.join(rootDir, 'dist-electron');
const appOutDir = path.join(distElectronDir, 'NEXORA-win32-x64');
const electronDistDir = path.join(rootDir, 'node_modules', 'electron', 'dist');

console.log('🚀 Packaging NEXORA Windows Desktop App (.exe)...');

// 1. Ensure directories exist
if (!fs.existsSync(electronDistDir)) {
  console.error('❌ Electron dist directory not found at:', electronDistDir);
  process.exit(1);
}

if (fs.existsSync(appOutDir)) {
  fs.rmSync(appOutDir, { recursive: true, force: true });
}
fs.mkdirSync(appOutDir, { recursive: true });

// 2. Copy all files from electron/dist to appOutDir
console.log('📦 Copying Electron runtime binaries...');
fs.cpSync(electronDistDir, appOutDir, { recursive: true });

// 3. Rename electron.exe to NEXORA.exe
const electronExe = path.join(appOutDir, 'electron.exe');
const nexoraExe = path.join(appOutDir, 'NEXORA.exe');
if (fs.existsSync(electronExe)) {
  fs.copyFileSync(electronExe, nexoraExe);
  try {
    fs.unlinkSync(electronExe);
  } catch {
    // Ignore if Windows file scanner temporarily holds the source handle
  }
  console.log('✨ Created: NEXORA.exe (Primary Windows Executable)');
} else {
  console.error('❌ electron.exe not found in appOutDir');
  process.exit(1);
}

// 4. Create resources/app bundle
const resourcesAppDir = path.join(appOutDir, 'resources', 'app');
fs.mkdirSync(resourcesAppDir, { recursive: true });

// 5. Copy electron main & preload
const mainSrc = path.join(rootDir, 'electron', 'main.js');
const preloadSrc = path.join(rootDir, 'electron', 'preload.js');
fs.copyFileSync(mainSrc, path.join(resourcesAppDir, 'main.js'));
fs.copyFileSync(preloadSrc, path.join(resourcesAppDir, 'preload.js'));

// 6. Write app package.json
const appPkg = {
  name: 'nexora',
  version: '0.1.0',
  description: 'NEXORA Agile Orchestration Windows App',
  main: 'main.js',
};
fs.writeFileSync(
  path.join(resourcesAppDir, 'package.json'),
  JSON.stringify(appPkg, null, 2),
  'utf8'
);

// 7. Create root shortcut / launcher in dist-electron
const launcherCmd = `@echo off
title NEXORA Desktop Launcher
start "" "%~dp0\\NEXORA-win32-x64\\NEXORA.exe"
`;
fs.writeFileSync(path.join(distElectronDir, 'Launch-NEXORA.cmd'), launcherCmd, 'utf8');

const stats = fs.statSync(nexoraExe);
const mb = (stats.size / (1024 * 1024)).toFixed(2);

console.log(`\n🎉 NEXORA Windows App built successfully!`);
console.log(`📍 Executable: ${nexoraExe}`);
console.log(`📊 Binary Size: ${mb} MB`);
console.log(`⚡ Features: 120fps GPU rasterization, Frameless modern window, Safe IPC bridge`);
