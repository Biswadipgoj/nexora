# NEXORA — Master Setup & Deployment Handbook

> **Work. Plan. Build. Live.**  
> A unified work-and-life agile orchestration platform.  
> **One Codebase powering Responsive Web, Native Android Super-App, and Windows Desktop Executable.**

---

## 1. System Architecture & Platforms

NEXORA is engineered to run the **exact same codebase** across three distinct targets with zero business logic bifurcation:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                               NEXORA CORE                               │
│              Next.js 16 App Router · TypeScript · Design Tokens         │
│                 Material Maximalism UI · Strict RBAC Logic              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   WEB BROWSER    │       │  NATIVE ANDROID  │       │ WINDOWS DESKTOP  │
│ Chrome, Firefox, │       │  Super-App (APK) │       │ Standalone .exe  │
│  Safari, Edge    │       │ Capacitor 8 + GPU│       │ Electron 44 + GPU│
└──────────────────┘       └──────────────────┘       └──────────────────┘
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │        SUPABASE BACKEND         │
                    │ PostgreSQL · 100% RLS · Storage │
                    └─────────────────────────────────┘
```

### Platform Capability Matrix:

| Platform | Runtime / Wrapper | Target File / Output | Performance & UX Features |
|---|---|---|---|
| **Responsive Web** | Next.js 16 App Router | `http://localhost:3000` | SSR, dynamic routing, touch targets ≥44pt, keyboard shortcuts (<kbd>C</kbd> quick create) |
| **Windows Desktop** | Electron 44 + Chromium | `dist-electron/NEXORA-win32-x64/NEXORA.exe` | 120fps GPU rasterization, single-instance lock, auto-reconnecting splash, portable archive |
| **Android Super-App** | Capacitor 8.x + Android Studio | `android/app/build/.../app-debug.apk` | 120Hz refresh rate, floating `SuperAppBottomBar`, spring-physics `SuperActionSheet` |
| **Cloud Database** | PostgreSQL via Supabase | Hosted or Local Docker | Multi-tenant workspace isolation (`workspace_id`), 100% RLS coverage, 103 security tests |

---

## 2. Quick Command Reference

| Task | Command | Description |
|---|---|---|
| **Install Dependencies** | `npm install` | Installs Next.js, Electron, Capacitor, and test libraries |
| **Run Security Tests** | `npm run test:security` | Runs Vitest suite verifying 103 RLS and tenant isolation tests |
| **Web Dev Server** | `npm run dev` | Starts Next.js development server on `http://localhost:3000` |
| **Web Production Build** | `npm run build` | Builds optimized production bundle |
| **Sync Android Assets** | `npm run android:sync` | Syncs web assets and Capacitor plugins into `android/` |
| **Open Android Studio** | `npm run android:open` | Launches the native Android Studio project |
| **Build Android Debug APK** | `cd android && .\gradlew.bat assembleDebug` | Compiles standalone `app-debug.apk` |
| **Cloud Android APK Build** | GitHub Actions (1-click) | 100% free cloud compilation without Android Studio |
| **Windows App (Live Dev)** | `npm run desktop` | Launches Electron window pointing to dev server |
| **Package Windows EXE** | `npm run desktop:package` | Builds standalone `NEXORA.exe` in `dist-electron/` |

---

## 3. Dedicated Guides & Deep-Dives

For in-depth step-by-step instructions, troubleshooting, and configuration details for each subsystem:

- ☁️ **Zero-Install Cloud Android Build (No Android Studio):** Read [docs/CLOUD_ANDROID_BUILD_GUIDE.md](./docs/CLOUD_ANDROID_BUILD_GUIDE.md)
- 🪟 **Windows Desktop App (.exe):** Read [docs/WINDOWS_EXE_GUIDE.md](./docs/WINDOWS_EXE_GUIDE.md)
- 📱 **Native Android Super-App (Studio & Native):** Read [docs/ANDROID_SETUP_GUIDE.md](./docs/ANDROID_SETUP_GUIDE.md)
- 🗄️ **Supabase Database, Auth & RLS:** Read [docs/SUPABASE_SETUP_GUIDE.md](./docs/SUPABASE_SETUP_GUIDE.md)

---

## 4. Environment Variables Configuration

Copy the sample environment file:

```powershell
cp .env.local.example .env.local
```

Configure the following variables in `.env.local`:

```env
# ========================================================
# Supabase Configuration
# ========================================================

# Public keys (Safe for browser, Electron, and Android APK bundles)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key

# Private Server-Only Key (CRITICAL: NEVER prefix with NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your-service-role-key

# Application Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Instant Demo Mode:** If you do not have a Supabase account or are developing offline, you can click **"Explore Demo Workspace"** on the login screen to run entirely in-memory with pre-populated projects, tasks, and team members.

---

## 5. Supabase Database Migrations

Apply the three forward-only, tested SQL migrations located in `supabase/migrations/`:

1. `20260903000001_foundation_tenancy.sql`: Workspaces, members, teams, helper functions.
2. `20260903000002_work_item_engine.sql`: Projects, work items, statuses, types, sequence generator.
3. `20260903000003_rls_work_item_engine.sql`: 100% RLS policies with mandatory `WITH CHECK` clauses.

### How to Run:
- **Via Supabase Dashboard:** Open **SQL Editor** → create a **New Query** → paste and execute each file sequentially.
- **Via Supabase CLI:** `npx supabase db push`.

---

## 6. Windows Desktop App (.exe) Setup

### Step 1: Package Standalone Windows Executable
```powershell
npm run desktop:package
```

### Output Files:
- **Executable:** `dist-electron/NEXORA-win32-x64/NEXORA.exe`
- **Launcher:** `dist-electron/Launch-NEXORA.cmd`
- **Distribution Zip:** `dist-electron/NEXORA-Windows-x64.zip`

### Step 2: Running the Desktop App
Double click `dist-electron/Launch-NEXORA.cmd` or `dist-electron/NEXORA-win32-x64/NEXORA.exe`.  
The app starts with 120fps GPU hardware acceleration and connects to your local dev server or cloud URL.

*(For code-signing, distribution, and custom URL instructions, refer to [docs/WINDOWS_EXE_GUIDE.md](./docs/WINDOWS_EXE_GUIDE.md))*

---

## 7. Android Super-App Setup

### Step 1: Build & Sync
```powershell
npm run build
npm run android:sync
```

### Step 2: Open in Android Studio & Run
```powershell
npm run android:open
```
In Android Studio, click **Run (▶)** to launch on your connected phone or emulator.

### Step 3: Compile Standalone Debug APK
```powershell
cd android
.\gradlew.bat assembleDebug
```
Output APK: `android/app/build/outputs/apk/debug/app-debug.apk`

*(For 120fps display settings, release keystore signing, and live reload setup, refer to [docs/ANDROID_SETUP_GUIDE.md](./docs/ANDROID_SETUP_GUIDE.md))*

---

## 8. Automated Security & Quality Verification

Before committing changes or deploying to production, run the automated verification suite:

### 1. TypeScript Validation
```powershell
npx tsc --noEmit
```

### 2. Security & RLS Tests
```powershell
npm run test:security
```
Expected output:
```
 ✓ tests/security/rls-coverage.test.ts (90 tests)
 ✓ tests/security/auth-rbac.test.ts (13 tests)

 Test Files  2 passed (2)
      Tests  103 passed (103)
```

---

## 9. Comprehensive Troubleshooting

| Platform | Problem | Root Cause | Fix |
|---|---|---|---|
| **Windows EXE** | SmartScreen warning | Executable is unsigned | Click "More info" → "Run anyway". |
| **Windows EXE** | White screen on launch | Server not running | Ensure `npm run dev` is running on port 3000 or set `$env:NEXORA_APP_URL`. |
| **Android** | Cannot reach `localhost:3000` | Emulator loopback | In `capacitor.config.ts`, set `server.url` to `http://10.0.2.2:3000`. |
| **Android** | `ERR_CLEARTEXT_NOT_PERMITTED` | HTTP blocked by Android | Ensure `android:usesCleartextTraffic="true"` is in `AndroidManifest.xml`. |
| **Supabase** | `infinite recursion` error | Direct table query in policy | Use `SECURITY DEFINER` function `is_workspace_member()`. |
| **Supabase** | Row level security violation | Missing `workspace_id` | Ensure all inserts specify the user's active `workspace_id`. |
| **Git** | Push rejected (> 100 MB) | Binary committed | `dist-electron/` and `*.exe` / `*.zip` are ignored in `.gitignore`. |
