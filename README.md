# NEXORA

> **Work. Plan. Build. Live.**  
> A unified work-and-life management platform.  
> Jira's power without Jira's unnecessary complexity.

---

## Unified Cross-Platform Architecture

NEXORA runs the **exact same codebase** across both **Web** (Desktop & Mobile browsers) and **Native Android** (APK / Google Play via Capacitor):

- **Web:** Next.js (App Router, Turbopack, SSR, TypeScript, CSS Design Tokens).
- **Android:** Native Capacitor wrapper located in `/android` pointing directly to the unified UI.
- **Database:** PostgreSQL via Supabase with row-level multi-tenancy (`workspace_id`) and 100% RLS coverage.
- **Security:** 103 automated tests verifying tenancy isolation, IDOR resistance, and role hierarchy.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the template and add your Supabase credentials:
```bash
cp .env.local.example .env.local
```

### 3. Run Security Tests
Verify all 103 security and RLS tests:
```bash
npm run test:security
```

### 4. Run Web Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## Native Android Development

Sync web assets and open directly in Android Studio:
```bash
npm run build
npm run android:sync
npm run android:open
```

To build a debug `.apk` on Windows:
```powershell
cd android
.\gradlew.bat assembleDebug
```
The APK will be generated at `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## Documentation

- **Full Setup Guide:** See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed database migration, environment setup, and Android device debugging steps.
- **Product & Architecture Spec:** See [NEXORA Master Document](c:/Users/biswa/Downloads/NEXORA_MASTER_DOCUMENT.md).
