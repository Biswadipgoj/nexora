# NEXORA

> **Work. Plan. Build. Live.**  
> A unified work-and-life agile orchestration platform.  
> **One Codebase powering Responsive Web, Native Android Super-App, and Windows Desktop Executable.**

---

## 🚀 Unified Cross-Platform Architecture

NEXORA runs the **exact same codebase** across three distinct environments:

- 🌐 **Responsive Web:** Next.js 16 (App Router, Turbopack, SSR, TypeScript, CSS Design Tokens).
- 🪟 **Windows Desktop App:** Standalone `NEXORA.exe` built with Electron 44, 120fps GPU acceleration, and frameless modern UI.
- 📱 **Native Android Super-App:** Native Capacitor 8.x wrapper with hardware-accelerated 120Hz refresh rate, floating `SuperAppBottomBar`, and spring-physics `SuperActionSheet`.
- 🗄️ **Database & Backend:** PostgreSQL via Supabase with row-level multi-tenancy (`workspace_id`) and 100% Row Level Security (RLS) coverage.
- 🛡️ **Automated Security:** 103 automated Vitest security tests verifying tenancy isolation, IDOR resistance, and role hierarchy.

---

## ⚡ Quick Start

### 1. Install Dependencies
```powershell
npm install
```

### 2. Configure Environment Variables
Copy the template and add your Supabase credentials:
```powershell
cp .env.local.example .env.local
```

### 3. Run Security Tests
Verify all 103 security and RLS tests:
```powershell
npm run test:security
```

### 4. Run Web Development Server
```powershell
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 🪟 Windows Desktop App (.exe)

Package the standalone Windows executable:
```powershell
npm run desktop:package
```
- **Executable Location:** `dist-electron/NEXORA-win32-x64/NEXORA.exe`
- **Quick Launcher:** `dist-electron/Launch-NEXORA.cmd`
- **Zip Archive:** `dist-electron/NEXORA-Windows-x64.zip`

👉 **Complete Guide:** [docs/WINDOWS_EXE_GUIDE.md](./docs/WINDOWS_EXE_GUIDE.md)

---

## 📱 Android Super-App (Two Build Paths)

### ☁️ Path 1: 100% Free Cloud Build (No Android Studio Needed)
No need to install Android Studio or SDKs on your PC. Build directly in the cloud:
1. Go to your repo on GitHub: [**Actions Tab**](https://github.com/Biswadipgoj/nexora/actions).
2. Select **"Build Android APK (Cloud)"** → click **Run workflow**.
3. Download the compiled `app-debug.apk` directly to your phone or PC in ~3 minutes!
4. *(Optional)* Test it live in your browser using [**Appetize.io**](https://appetize.io/upload).

👉 **Cloud Guide:** [docs/CLOUD_ANDROID_BUILD_GUIDE.md](./docs/CLOUD_ANDROID_BUILD_GUIDE.md)

### 💻 Path 2: Local Android Studio Build
Sync web assets and open in Android Studio:
```powershell
npm run build
npm run android:sync
npm run android:open
```

Or build a standalone debug APK from terminal:
```powershell
cd android
.\gradlew.bat assembleDebug
```
- **APK Location:** `android/app/build/outputs/apk/debug/app-debug.apk`

👉 **Android Studio Guide:** [docs/ANDROID_SETUP_GUIDE.md](./docs/ANDROID_SETUP_GUIDE.md)

---

## 🗄️ Supabase Database & Auth Setup

NEXORA includes three forward-only SQL migrations in `supabase/migrations/`:
1. `20260903000001_foundation_tenancy.sql` (Workspaces, members, teams)
2. `20260903000002_work_item_engine.sql` (Projects, work items, sequences)
3. `20260903000003_rls_work_item_engine.sql` (Strict RLS with `WITH CHECK` clauses)

> **Offline Demo Mode:** If you do not have Supabase credentials yet, click **"Explore Demo Workspace"** on the login screen to run in zero-config offline mode.

👉 **Complete Guide:** [docs/SUPABASE_SETUP_GUIDE.md](./docs/SUPABASE_SETUP_GUIDE.md)

---

## 📚 Documentation Reference

- 📖 **Master Setup Handbook:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- ☁️ **Cloud Android Build Guide (No Studio):** [docs/CLOUD_ANDROID_BUILD_GUIDE.md](./docs/CLOUD_ANDROID_BUILD_GUIDE.md)
- 🪟 **Windows Desktop Guide:** [docs/WINDOWS_EXE_GUIDE.md](./docs/WINDOWS_EXE_GUIDE.md)
- 📱 **Android Super-App (Studio) Guide:** [docs/ANDROID_SETUP_GUIDE.md](./docs/ANDROID_SETUP_GUIDE.md)
- 🗄️ **Supabase & Security Guide:** [docs/SUPABASE_SETUP_GUIDE.md](./docs/SUPABASE_SETUP_GUIDE.md)
