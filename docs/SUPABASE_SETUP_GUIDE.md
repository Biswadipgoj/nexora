# NEXORA — Supabase Database, Auth & RLS Security Setup Guide

> **Enterprise Multi-Tenancy · Strict Row Level Security · PostgreSQL**  
> Complete configuration manual for Database Schema, Auth, Storage, and Automated Verification.

---

## 1. Overview & Tenancy Architecture

NEXORA relies on PostgreSQL provided by Supabase as its primary source of truth. Security and data segregation are enforced at the database layer through **Row Level Security (RLS)** rather than relying solely on application middleware.

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXORA MULTI-TENANT MODEL                │
│                                                             │
│       ┌──────────────────────────────────────────────┐      │
│       │             Workspace (Tenant Root)          │      │
│       │         id, name, slug, domain, settings     │      │
│       └──────────────────────┬───────────────────────┘      │
│                              │                              │
│         ┌────────────────────┴────────────────────┐         │
│         ▼                                         ▼         │
│  ┌──────────────┐                          ┌──────────────┐ │
│  │   Members    │                          │   Projects   │ │
│  │ owner, admin,│                          │ key, workflow│ │
│  │ member, viewer                          └──────┬───────┘ │
│  └──────────────┘                                 │         │
│                                                   ▼         │
│                                            ┌──────────────┐ │
│                                            │  Work Items  │ │
│                                            │ (Tasks/Bugs) │ │
│                                            └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Core Security Tenets:
1. **Workspace Boundary:** Every table with user-generated content (`projects`, `work_items`, `teams`, `comments`, etc.) includes a `workspace_id UUID NOT NULL` column with a foreign key constraint to `workspaces.id`.
2. **100% RLS Enforcement:** Row Level Security is explicitly activated and forced on every table using `ALTER TABLE ... FORCE ROW LEVEL SECURITY;`.
3. **Mandatory `WITH CHECK` Clauses:** All `INSERT` and `UPDATE` policies include an explicit `WITH CHECK` constraint to prevent tenant crossing and IDOR attacks.
4. **Role-Based Access Control (RBAC):** Built-in workspace roles (`owner`, `admin`, `member`, `viewer`) evaluated using fast `SECURITY DEFINER` database helper functions.

---

## 2. Creating a Supabase Project

If you do not already have a Supabase project:

1. Log in or create a free account at [supabase.com](https://supabase.com).
2. Click **New Project**.
3. Fill in the project details:
   - **Name:** `NEXORA` (or your chosen name)
   - **Database Password:** Choose a strong password and save it securely.
   - **Region:** Select a data center closest to your primary users (e.g. `US East`, `EU Central`, `AP Southeast`).
   - **Pricing Plan:** Free tier is fully supported.
4. Click **Create new project** and allow ~2 minutes for provisioning.

---

## 3. Environment Variables Configuration

Once your project is provisioned, create your `.env.local` file in the root of the project:

```powershell
cp .env.local.example .env.local
```

Populate the following variables:

```env
# ========================================================
# Supabase Configuration
# ========================================================

# Public project URL (Safe for client & mobile bundle)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Public anonymous key (Safe for browser & client queries with RLS)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Private service role key (CRITICAL: NEVER prefix with NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Base application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Where to Find Your API Keys:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api).
2. Navigate to **Project Settings** (gear icon) → **API**.
3. Copy **Project URL** into `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy **anon / public** key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Copy **service_role / secret** key into `SUPABASE_SERVICE_ROLE_KEY`.

> [!CAUTION]
> The `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row Level Security. It is strictly used in protected backend routes (such as administrative migrations or server-side provisioning) and must **never** be exposed in client code or native APKs.

---

## 4. Applying Database Migrations

NEXORA includes three sequentially organized SQL migrations in `supabase/migrations/`:

### Migration Files:
1. `20260903000001_foundation_tenancy.sql`:
   - Creates `workspaces`, `workspace_members`, `teams`, `team_members` tables.
   - Creates helper functions: `is_workspace_member(workspace_id, user_id)` and `has_workspace_role(workspace_id, user_id, role)`.
2. `20260903000002_work_item_engine.sql`:
   - Creates `projects`, `work_items`, `work_item_statuses`, `work_item_types`, `work_item_labels`, `work_item_label_assignments`, `work_item_comments`, `work_item_attachments`, `activity_events`.
   - Creates atomic sequence generator function and trigger `generate_work_item_key()` (produces identifiers like `NEX-1`, `NEX-2`).
3. `20260903000003_rls_work_item_engine.sql`:
   - Enables and forces RLS on all engine tables.
   - Attaches strict SELECT, INSERT, UPDATE, and DELETE policies with `WITH CHECK` protections.

---

### Option A: Applying via Supabase Web Dashboard (Recommended)

1. Open your Supabase project dashboard and click on **SQL Editor** in the left sidebar.
2. Click **+ New Query**.
3. Open `supabase/migrations/20260903000001_foundation_tenancy.sql`, copy all text, paste into the editor, and click **Run**.
4. Create another **New Query**, copy the contents of `supabase/migrations/20260903000002_work_item_engine.sql`, and click **Run**.
5. Create a third **New Query**, copy the contents of `supabase/migrations/20260903000003_rls_work_item_engine.sql`, and click **Run**.
6. Verify that all 3 executions complete with `Success. No rows returned`.

---

### Option B: Applying via Supabase CLI

If you have the Supabase CLI installed:

```powershell
# 1. Login to your Supabase account
npx supabase login

# 2. Link your local directory to your remote project
npx supabase link --project-ref your-project-ref-id

# 3. Push all migrations
npx supabase db push
```

---

## 5. Configuring Authentication & Redirect URLs

### 1. Enable Email / Password Provider
1. In the Supabase Dashboard, navigate to **Authentication** → **Providers** → **Email**.
2. Ensure **Enable Email provider** is turned **ON**.
3. For local development, you may toggle **Confirm email** to **OFF** so you can immediately log in after sign up without clicking an email verification link.

### 2. Set Site URL & Redirect URLs
In **Authentication** → **URL Configuration**:
- **Site URL:** `http://localhost:3000` (or your production URL `https://your-domain.com`)
- **Redirect URLs (Add all of the following):**
  - `http://localhost:3000/**`
  - `http://10.0.2.2:3000/**` (for Android emulator)
  - `com.nexora.app://**` (for native Android deep linking)
  - `https://your-domain.com/**` (for production)

---

## 6. Zero-Setup Demo Mode Fallback

NEXORA includes an instant **Demo Mode** fallback built into `lib/demo/demo-store.ts` and `app/api/auth/demo/route.ts`.

If you or a colleague want to test the app, verify Kanban drag-and-drop, or run the desktop/Android app **without configuring a Supabase project**:
1. On the login screen (`/auth/login`), click **"Explore Demo Workspace"** (or toggle Demo Mode).
2. The app initializes a fully populated in-memory workspace with:
   - Pre-configured project ("NEXORA Core Launch")
   - Sample team members (Alex Morgan, Sarah Chen, Marcus Vance, Elena Rostova)
   - Realistic sprint tasks across Backlog, To Do, In Progress, and Done
   - Live task filtering by assignee and real-time state changes

---

## 7. Storage Bucket Setup (For Attachments)

To enable uploading file attachments to work items:

1. In Supabase Dashboard, go to **Storage** → click **New bucket**.
2. Name the bucket: `attachments`.
3. Set **Public bucket** to **OFF** (private).
4. In **Policies**, add an RLS policy:
   - **Allowed operations:** SELECT, INSERT, UPDATE, DELETE
   - **Target roles:** `authenticated`
   - **Policy definition:**
     ```sql
     (bucket_id = 'attachments' AND (auth.role() = 'authenticated'))
     ```

---

## 8. Realtime Subscriptions Setup

To enable real-time collaboration across multiple users on the Kanban board:

1. In the Supabase Dashboard, go to **Database** → **Replication**.
2. Locate the `supabase_realtime` publication.
3. Toggle replication **ON** for the following tables:
   - `work_items`
   - `work_item_comments`
   - `activity_events`

---

## 9. Automated Security & RLS Verification

NEXORA comes equipped with an automated security test suite that programmatically validates all RLS policies, RBAC roles, and tenancy boundaries.

To verify your security configuration:

```powershell
npm run test:security
```

### Expected Output:
```
 RUN  v4.1.11 D:/nexora

 ✓ tests/security/rls-coverage.test.ts (90 tests)
 ✓ tests/security/auth-rbac.test.ts (13 tests)

 Test Files  2 passed (2)
      Tests  103 passed (103)
   Duration  550ms
```

### What These 103 Tests Verify:
- **Cross-Tenant Isolation:** Users in Workspace A cannot read, query, insert, or update records belonging to Workspace B.
- **Role Hierarchy:** Viewers cannot create or update work items; Members cannot alter project settings; Admins cannot demote the Workspace Owner.
- **Sequence Integrity:** Work item sequences are strictly per-project and cannot be spoofed.
- **Input Sanitization:** All text inputs are validated against XSS and HTML injection vulnerabilities.

---

## 10. Troubleshooting & FAQ

| Issue | Cause | Solution |
|---|---|---|
| `infinite recursion detected in policy for relation "workspace_members"` | Recursive RLS subquery | Use the `SECURITY DEFINER` function `is_workspace_member()` included in Migration 1 instead of querying `workspace_members` directly in RLS policies. |
| `permission denied for table ...` | Missing RLS policy or unauthorized user | Ensure the user is an active row in `workspace_members` for the given `workspace_id`. |
| `new row violates row-level security policy for table "work_items"` | Missing or invalid `workspace_id` | Ensure all INSERT queries explicitly provide `workspace_id` matching the user's active workspace. |
| Auth redirect fails on Android | Missing redirect URI | Add `com.nexora.app://**` to **Authentication** → **Redirect URLs** in Supabase. |
