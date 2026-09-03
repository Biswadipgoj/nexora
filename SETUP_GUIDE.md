# NEXORA — Complete Setup & Deployment Guide

> **Work. Plan. Build. Live.**  
> A unified work-and-life management platform.  
> **One Codebase for Responsive Web & Native Android.**

---

## 1. Overview & Architecture

NEXORA is engineered to run the **exact same codebase** across both **Web** (desktop, tablet, mobile browsers) and **Native Android** (APK / Google Play ready).

```
┌─────────────────────────────────────────────────────────────┐
│                       NEXORA CORE                           │
│        Next.js App Router · TypeScript · Design Tokens       │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
      ┌─────────────────┐            ┌──────────────────┐
      │   WEB BROWSER   │            │  NATIVE ANDROID  │
      │ Chrome, Safari, │            │ Capacitor Engine │
      │ Firefox, Edge   │            │   (APK / AAB)    │
      └─────────────────┘            └──────────────────┘
                               │
                               ▼
            ┌────────────────────────────────────┐
            │         SUPABASE BACKEND           │
            │ PostgreSQL · Strict RLS · Auth API │
            └────────────────────────────────────┘
```

- **Frontend & App Logic:** Next.js (App Router), TypeScript, responsive CSS design tokens (`globals.css`), fully accessible touch targets (≥44x44pt).
- **Backend & Database:** PostgreSQL via Supabase with row-level multi-tenancy (`workspace_id`) and Row Level Security (RLS) enforced on 100% of tables.
- **Mobile Engine:** Capacitor 8.x embedding the Next.js responsive app into native Android Studio project (`/android`), with zero code bifurcation.

---

## 2. Prerequisites

Ensure you have the following installed on your development machine:

1. **Node.js**: Version 18.x, 20.x, or 22.x LTS ([Download Node.js](https://nodejs.org/)).
2. **npm**: Version 9.x or higher (comes bundled with Node.js).
3. **Git**: Installed and configured on your system.
4. **Database (Supabase)**:
   - **Option A (Recommended for Quick Start):** Free hosted project on [supabase.com](https://supabase.com).
   - **Option B (Local Dev):** Docker Desktop + Supabase CLI (`npx supabase start`).
5. **For Android Development (Only needed when building/testing Android)**:
   - [Android Studio](https://developer.android.com/studio) (Ladybug / Jellyfish or latest version).
   - Android SDK (API 33 or higher) & Command Line Tools.
   - Java Development Kit (JDK 17 or 21, bundled with Android Studio).

---

## 3. Environment Variables Configuration

In the root of the project (`d:\nexora`), create your `.env.local` file:

```bash
# Copy the example file:
cp .env.local.example .env.local
```

Edit `.env.local` and provide your Supabase credentials:

```env
# ========================================================
# Supabase Configuration
# ========================================================

# Public keys (Safe for browser & client bundles)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key

# Private Server-Only Key (§12.2: NEVER reaches client bundle or APK)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your-service-role-key

# Application Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Where to find your Supabase credentials:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Click on **Project Settings** (gear icon) → **API**.
4. Copy `Project URL` → paste into `NEXT_PUBLIC_SUPABASE_URL`.
5. Copy `anon / public` key → paste into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. Copy `service_role / secret` key → paste into `SUPABASE_SERVICE_ROLE_KEY`.

---

## 4. Database Setup & Migrations

NEXORA comes with three forward-only, tested migrations in `/supabase/migrations/`:

- `20260903000001_foundation_tenancy.sql`: Workspaces, workspace members, teams, team members, RLS helper functions.
- `20260903000002_work_item_engine.sql`: Projects, work items, statuses, types, labels, comments, attachments, activity events, sequence generator.
- `20260903000003_rls_work_item_engine.sql`: Complete RLS policies for every table with mandatory `with check` clauses.

### Applying to Hosted Supabase (Dashboard):
1. Open your Supabase Project Dashboard → **SQL Editor**.
2. Create a **New Query**.
3. Copy and run the contents of `supabase/migrations/20260903000001_foundation_tenancy.sql`.
4. Copy and run the contents of `supabase/migrations/20260903000002_work_item_engine.sql`.
5. Copy and run the contents of `supabase/migrations/20260903000003_rls_work_item_engine.sql`.

### Applying via Supabase CLI (Alternative):
If you have linked your Supabase CLI (`npx supabase link --project-ref your-ref`):
```bash
npx supabase db push
```

---

## 5. Running the Web Application

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Security & RLS Test Suite (§15)
Before starting the app, verify that all 103 security tests pass:
```bash
npm run test:security
```
Expected output:
```
✓ tests/security/rls-coverage.test.ts (90 tests)
✓ tests/security/auth-rbac.test.ts (13 tests)
Test Files  2 passed (2)
Tests       103 passed (103)
```

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- Visit `/auth/signup` to create your initial user account.
- Visit `/onboarding` to create your first workspace.
- Visit `/onboarding/project` to create your first project and land directly on the interactive Kanban board!
- Press <kbd>C</kbd> anywhere to trigger the **Quick Create** modal.

### Step 4: Build for Production
```bash
npm run build
npm start
```

---

## 6. Running on Android (Same Codebase)

NEXORA uses Capacitor to package the identical responsive application into a native Android application.

### Step 1: Sync the Web Assets
Whenever you make updates to the web app:
```bash
npm run build
npm run android:sync
```
This syncs web assets and configurations into the native `android/` directory.

### Step 2: Configure Live Development for Android
To test on an Android Emulator or physical phone connected to your Wi-Fi:

Open `capacitor.config.ts`:
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nexora.app',
  appName: 'NEXORA',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // FOR ANDROID EMULATOR:
    // url: 'http://10.0.2.2:3000',
    
    // FOR PHYSICAL ANDROID PHONE (Replace with your computer's local Wi-Fi IP):
    // url: 'http://192.168.1.100:3000',
    
    // FOR PRODUCTION:
    // url: 'https://your-nexora-app.vercel.app',
  },
  android: {
    backgroundColor: '#FAFBFC',
    allowMixedContent: true,
  },
};

export default config;
```

> **Note for Android Emulator:** `10.0.2.2` is Android's special alias to your computer's `localhost`. When running `npm run dev`, your emulator loads the live dev server directly with hot reload!

### Step 3: Open in Android Studio
Run:
```bash
npm run android:open
```
Android Studio will open the `/android` project directory.

### Step 4: Run on Device / Emulator
1. Wait for Android Studio to complete Gradle sync.
2. Select your device (or create an Android Virtual Device in Device Manager, e.g. Pixel 7 / Android 14+).
3. Click the green **Run (▶)** button in Android Studio.
4. NEXORA launches with native Android status bar, splash screen, touch interactions, and back-button support!

### Step 5: Build a Standalone Android APK
To generate a release or debug `.apk` to install directly on phones without Android Studio:

**On Windows (PowerShell):**
```powershell
cd android
.\gradlew.bat assembleDebug
```

The APK will be generated at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```
You can transfer this APK directly to any Android device and install it.

---

## 7. Project Structure Reference (§47)

```
d:/nexora/
├── android/                   # Native Android Studio project (Capacitor)
├── app/                       # Next.js App Router (UI & API Routes)
│   ├── api/                   # Server endpoints (projects, work-items, health)
│   ├── auth/                  # Authentication flows (login, signup, reset)
│   ├── dashboard/             # Main dashboard & greeting
│   ├── onboarding/            # Zero-config workspace & project creation
│   ├── projects/[id]/         # Interactive Kanban board page
│   ├── globals.css            # Token-based design system (light & dark)
│   └── layout.tsx             # Root layout with accessibility & SEO
├── components/
│   └── board/                 # KanbanBoard, WorkItemCard, QuickCreateModal, DetailDrawer
├── lib/
│   ├── auth/                  # RBAC engine & effective permission resolution
│   ├── db/                    # Typed database queries (work-items, workspaces, types)
│   ├── supabase/              # SSR and browser Supabase clients
│   ├── validation/            # Server-side Zod validation schemas
│   └── logger.ts              # Structured JSON logging with credential redaction
├── supabase/
│   └── migrations/            # Forward-only SQL migrations with complete RLS
├── tests/
│   └── security/              # Automated S1–S5 security & RLS test suite
├── capacitor.config.ts        # Android & cross-platform configuration
└── package.json               # Scripts & dependencies
```

---

## 8. Verification & Troubleshooting

| Scenario | Check / Solution |
|---|---|
| **Security tests fail** | Run `npm run test:security`. If modifying SQL, ensure every new table has `alter table <x> force row level security;` and all UPDATE policies have `with check (...)`. |
| **Android cannot connect to localhost** | Ensure `capacitor.config.ts` uses `http://10.0.2.2:3000` (for emulator) or your computer's LAN IP `http://192.168.x.x:3000` (for physical device) rather than `localhost`. |
| **Missing Supabase Keys** | Check `.env.local`. Remember that variables used in client code must start with `NEXT_PUBLIC_`. |
| **Android build error** | Run `npm run android:sync` before building in Android Studio. Ensure JDK 17+ is selected in `Android Studio > Settings > Build > Build Tools > Gradle > Gradle JDK`. |

---

**NEXORA is now fully set up and ready to run on Web and Android!**
