# Prismatic Aurora Animated UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a luxury-grade, highly fluid, colorful, non-dark, non-white, dimensional (anti-flat) UI/UX system across NEXORA's public landing showcase, agile Kanban workspace, and cross-platform mobile/desktop shells.

**Architecture:** Layered design tokens (`styles/prismatic-aurora.css`) integrated into Next.js 16, combined with calibrated Motion v13 spring physics (`components/ui/motion/`), interactive 3D-tilt specular glare cards, a live interactive sandbox hero preview, and an optimistic zero-lag Kanban board.

**Tech Stack:** Next.js 16.3.4 (App Router, Turbopack, SSR), React 19, `motion` 13.2.0, MUI Icons, CSS Design Tokens with Hardware-Accelerated Transforms, Supabase SSR & RLS.

**Spec:** `docs/superpowers/specs/2026-09-06-prismatic-aurora-ui-ux-design.md`

## Global Constraints

- **Color Foundation:** Non-dark, non-white luminous slate-indigo base (`#181d2e` to `#22283e`), never `#000` or `#fff`.
- **Anti-Flat Dimensionality:** Every card and button must include a top specular rim (`inset 0 1px 0 0 rgba(255, 255, 255, 0.2)`), layered frosted glass (`backdrop-filter: blur(20px)`), and colored ambient drop-shadow penumbras.
- **Motion Physics:** All animations must use calibrated physical springs (`type: "spring"`) from `motion/react` / `motion` — no linear or generic ease curves.
- **Cross-Platform Support:** Must render flawlessly across Responsive Web, Windows Desktop (`dist-electron`), and Android Mobile (`capacitor`).
- **Security Invariant:** All 103 security and RLS tests (`npm run test:security`) must remain 100% green.
- **Build Invariant:** `npm run build` must succeed with zero TypeScript or Lint errors.

---

### Task 1: Prismatic Aurora CSS Design Tokens & Base Theme

**Files:**
- Create: `styles/prismatic-aurora.css`
- Modify: `app/globals.css:1-50`
- Test: `tests/theme/prismatic-tokens.test.ts`

**Interfaces:**
- Produces: CSS custom properties (`--canvas-bg`, `--surface-primary`, `--surface-elevated`, `--aurora-iris`, `--aurora-aqua`, `--aurora-amber`, `--aurora-rose`, `--aurora-jade`, `--border-rim-highlight`, `--shadow-md`, `--shadow-lifted`).

- [ ] **Step 1: Write token verification test**

```typescript
// tests/theme/prismatic-tokens.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Prismatic Aurora Design Tokens', () => {
  it('defines all required non-dark, non-white, and dimensional variables in CSS', () => {
    const cssPath = path.resolve(process.cwd(), 'styles/prismatic-aurora.css');
    expect(fs.existsSync(cssPath)).toBe(true);
    const content = fs.readFileSync(cssPath, 'utf-8');

    expect(content).toContain('--canvas-bg: #181d2e');
    expect(content).toContain('--aurora-iris: #8b5cf6');
    expect(content).toContain('--aurora-aqua: #06b6d4');
    expect(content).toContain('--aurora-amber: #f59e0b');
    expect(content).toContain('--aurora-rose: #f43f5e');
    expect(content).toContain('--aurora-jade: #10b981');
    expect(content).toContain('--border-rim-highlight');
    expect(content).toContain('--shadow-lifted');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/theme/prismatic-tokens.test.ts`  
Expected: FAIL (file not found).

- [ ] **Step 3: Implement `styles/prismatic-aurora.css` and import in `app/globals.css`**

```css
/* styles/prismatic-aurora.css */
:root {
  --canvas-bg: #181d2e;
  --canvas-gradient: radial-gradient(circle at 15% 15%, rgba(139, 92, 246, 0.18) 0%, transparent 45%),
                     radial-gradient(circle at 85% 85%, rgba(6, 182, 212, 0.16) 0%, transparent 50%),
                     radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.10) 0%, transparent 50%),
                     #181d2e;

  --surface-primary: rgba(30, 37, 60, 0.72);
  --surface-elevated: rgba(42, 51, 82, 0.82);
  --surface-hover: rgba(54, 65, 104, 0.90);
  --surface-modal: rgba(28, 34, 56, 0.96);

  --border-rim: 1px solid rgba(255, 255, 255, 0.14);
  --border-rim-highlight: inset 0 1px 0 0 rgba(255, 255, 255, 0.24);

  --aurora-iris: #8b5cf6;
  --aurora-aqua: #06b6d4;
  --aurora-amber: #f59e0b;
  --aurora-rose: #f43f5e;
  --aurora-jade: #10b981;

  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-subtle: #64748b;

  --shadow-sm: 0 2px 8px -1px rgba(10, 13, 24, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.15);
  --shadow-md: 0 10px 24px -4px rgba(10, 13, 24, 0.55), 0 0 16px -2px rgba(139, 92, 246, 0.16), inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
  --shadow-lg: 0 20px 40px -8px rgba(8, 10, 20, 0.7), 0 0 32px -4px rgba(6, 182, 212, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.25);
  --shadow-lifted: 0 24px 48px -6px rgba(10, 14, 26, 0.8), 0 0 28px rgba(139, 92, 246, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
}

body {
  background: var(--canvas-gradient) !important;
  background-color: var(--canvas-bg) !important;
  color: var(--text-main) !important;
  min-height: 100vh;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/theme/prismatic-tokens.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add styles/prismatic-aurora.css app/globals.css tests/theme/prismatic-tokens.test.ts
git commit -m "feat(design): implement prismatic aurora color and dimensional tokens"
```

---

### Task 2: Motion Spring Presets, 3D Perspective Tilt Card & Living Aurora Canvas

**Files:**
- Create: `components/ui/motion/spring-presets.ts`
- Create: `components/ui/motion/TiltCard.tsx`
- Create: `components/ui/motion/LivingAuroraCanvas.tsx`
- Test: `tests/ui/motion-presets.test.ts`

**Interfaces:**
- Produces: `SPRING_SNAPPY`, `SPRING_DRAG`, `SPRING_DRAWER`, `SPRING_BOUNCE` presets; `<TiltCard />` component; `<LivingAuroraCanvas />` background.

- [ ] **Step 1: Write test for motion spring presets**

```typescript
// tests/ui/motion-presets.test.ts
import { describe, it, expect } from 'vitest';
import { SPRING_SNAPPY, SPRING_DRAG, SPRING_DRAWER } from '@/components/ui/motion/spring-presets';

describe('Motion Spring Presets', () => {
  it('exports tuned physics parameters conforming to spec', () => {
    expect(SPRING_SNAPPY.stiffness).toBe(450);
    expect(SPRING_SNAPPY.damping).toBe(30);
    expect(SPRING_DRAG.stiffness).toBe(320);
    expect(SPRING_DRAG.damping).toBe(24);
    expect(SPRING_DRAWER.stiffness).toBe(380);
    expect(SPRING_DRAWER.damping).toBe(32);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/motion-presets.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement spring presets, TiltCard with specular glare, and LivingAuroraCanvas**

Create `components/ui/motion/spring-presets.ts`:
```typescript
export const SPRING_SNAPPY = { type: 'spring', stiffness: 450, damping: 30 } as const;
export const SPRING_DRAG = { type: 'spring', stiffness: 320, damping: 24 } as const;
export const SPRING_DRAWER = { type: 'spring', stiffness: 380, damping: 32 } as const;
export const SPRING_BOUNCE = { type: 'spring', stiffness: 500, damping: 20 } as const;
```

Create `components/ui/motion/TiltCard.tsx`:
```tsx
'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  maxTilt?: number;
}

export function TiltCard({
  children,
  className = '',
  glowColor = 'rgba(139, 92, 246, 0.25)',
  maxTilt = 7,
  ...props
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [maxTilt, -maxTilt]), { stiffness: 400, damping: 30 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-maxTilt, maxTilt]), { stiffness: 400, damping: 30 });
  const glareX = useTransform(x, [0, 1], ['0%', '100%']);
  const glareY = useTransform(y, [0, 1], ['0%', '100%']);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      whileTap={{ scale: 0.97 }}
      className={`relative overflow-hidden rounded-2xl border border-white/15 bg-[var(--surface-elevated)] p-6 backdrop-blur-xl transition-shadow ${className}`}
      {...(props as any)}
    >
      {/* Dynamic Specular Glare */}
      <motion.div
        className="pointer-events-none absolute -inset-full opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 280px at ${glareX} ${glareY}, ${glowColor}, transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
```

Create `components/ui/motion/LivingAuroraCanvas.tsx`:
```tsx
'use client';

import React from 'react';
import { motion } from 'motion/react';

export function LivingAuroraCanvas() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-70">
      {/* Electric Iris Orb */}
      <motion.div
        animate={{
          x: ['-5%', '10%', '-5%'],
          y: ['-10%', '15%', '-10%'],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 h-[550px] w-[550px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.35)_0%,transparent_70%)] blur-3xl will-change-transform"
      />
      {/* Neon Aqua Orb */}
      <motion.div
        animate={{
          x: ['10%', '-15%', '10%'],
          y: ['15%', '-10%', '15%'],
          scale: [1.1, 0.95, 1.1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-40 -right-40 h-[650px] w-[650px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.28)_0%,transparent_70%)] blur-3xl will-change-transform"
      />
      {/* Cosmic Rose Orb */}
      <motion.div
        animate={{
          x: ['-10%', '15%', '-10%'],
          y: ['20%', '-15%', '20%'],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 left-1/2 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.18)_0%,transparent_70%)] blur-3xl will-change-transform"
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/motion-presets.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add components/ui/motion tests/ui/motion-presets.test.ts
git commit -m "feat(ui): add motion spring presets, 3d tilt card, and living aurora canvas"
```

---

### Task 3: Public Landing Page & Interactive Live Sandbox Hero

**Files:**
- Create: `components/landing/LandingHeader.tsx`
- Create: `components/landing/HeroLiveSandbox.tsx`
- Create: `components/landing/DimensionalFeatureGrid.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces: High-impact landing page featuring suspended frosted header, shimmering gradient typography, and an interactive draggable hero mini-Kanban sandbox.

- [ ] **Step 1: Build `components/landing/LandingHeader.tsx`**

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Logo } from '@/components/ui/Logo';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { SPRING_SNAPPY } from '@/components/ui/motion/spring-presets';

export function LandingHeader({ user }: { user: any }) {
  return (
    <header className="sticky top-4 z-50 mx-auto max-w-6xl px-4">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={SPRING_SNAPPY}
        className="flex items-center justify-between rounded-full border border-white/15 bg-[var(--surface-primary)] px-6 py-3 shadow-[var(--shadow-md)] backdrop-blur-2xl"
      >
        <Link href="/" className="flex items-center gap-3">
          <Logo size="md" withText animated />
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--aurora-iris)] to-[var(--aurora-aqua)] px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-transform hover:scale-105"
            >
              <span>Workspace</span>
              <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--aurora-iris)] to-[var(--aurora-aqua)] px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-transform hover:scale-105"
              >
                <span>Get Started Free</span>
                <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </header>
  );
}
```

- [ ] **Step 2: Build `components/landing/HeroLiveSandbox.tsx` (The Interactive Mini-Kanban Hero)**

Interactive client component allowing direct dragging/clicking of mini task cards with spring physics right in the hero:
- Interactive columns ("Backlog", "In Progress", "Shipped").
- Cards lift with spring bounce (`SPRING_DRAG`).
- Live state updates (move cards by dragging or clicking status pills).
- Real-time indicator showing "Interactive Live Sandbox • Try Dragging Cards".

- [ ] **Step 3: Build `components/landing/DimensionalFeatureGrid.tsx`**

- Feature 1: Sprint Velocity (animated micro-bars on hover).
- Feature 2: Cross-Platform Tri-Target (interactive tab switcher showing Web, Windows, Android pill previews).
- Feature 3: Enterprise Tenancy (glowing shield badge showing Supabase RLS isolation).

- [ ] **Step 4: Update `app/page.tsx` to assemble landing experience**

Integrate `LandingHeader`, `HeroLiveSandbox`, `DimensionalFeatureGrid`, and `LivingAuroraCanvas`.

- [ ] **Step 5: Verify build & commit**

Run: `npm run build`  
Expected: PASS.  
Commit: `git commit -m "feat(landing): assemble fluid animated landing page with interactive sandbox"`

---

### Task 4: Tactile Prismatic Kanban Board & Agile Workspace

**Files:**
- Create: `components/board/PrismaticKanbanBoard.tsx`
- Create: `components/board/PrismaticCard.tsx`
- Create: `components/board/TaskDrawer.tsx`
- Modify: `components/dashboard/DashboardClientView.tsx`

**Interfaces:**
- Consumes: `initialWorkItems`, `projects`, `primaryWorkspace` from dashboard page.
- Produces: Tactile drag-and-drop Kanban board with colored aurora column headers, 3D tilt hover, spring lift, and detail drawer.

- [ ] **Step 1: Build `components/board/PrismaticCard.tsx`**

```tsx
'use client';

import React from 'react';
import { motion } from 'motion/react';
import { SPRING_DRAG } from '@/components/ui/motion/spring-presets';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';

export function PrismaticCard({
  item,
  onClick,
  onDragStart,
}: {
  item: any;
  onClick: () => void;
  onDragStart?: () => void;
}) {
  const priorityColor =
    item.priority === 'urgent'
      ? 'var(--aurora-rose)'
      : item.priority === 'high'
      ? 'var(--aurora-amber)'
      : item.priority === 'medium'
      ? 'var(--aurora-aqua)'
      : 'var(--text-muted)';

  return (
    <motion.div
      layout
      layoutId={item.id}
      transition={SPRING_DRAG}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative cursor-grab active:cursor-grabbing rounded-xl border border-white/12 bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] backdrop-blur-xl transition-all"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-mono font-semibold text-[var(--aurora-iris)]">
          {item.key || `NEX-${item.sequence || 101}`}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: `color-mix(in srgb, ${priorityColor} 18%, transparent)`,
            color: priorityColor,
            border: `1px solid color-mix(in srgb, ${priorityColor} 40%, transparent)`,
          }}
        >
          {item.priority || 'medium'}
        </span>
      </div>
      <h4 className="text-sm font-medium text-[var(--text-main)] group-hover:text-white line-clamp-2">
        {item.title}
      </h4>
    </motion.div>
  );
}
```

- [ ] **Step 2: Build `components/board/PrismaticKanbanBoard.tsx`**

Implement 4 columns:
- "To Do" (`var(--aurora-iris)`)
- "In Progress" (`var(--aurora-amber)`)
- "In Review" (`var(--aurora-aqua)`)
- "Done" (`var(--aurora-jade)`)
Each with glowing pill header, live count badge, drop target indicator, and `AnimatePresence` layout animations.

- [ ] **Step 3: Build `components/board/TaskDrawer.tsx`**

Spring-animated slide-in drawer (`SPRING_DRAWER`) from right for editing task details, toggling checklist, status, and priority.

- [ ] **Step 4: Integrate into `components/dashboard/DashboardClientView.tsx`**

Replace the flat board view with `<PrismaticKanbanBoard />`.

- [ ] **Step 5: Verify build & commit**

Run: `npm run build`  
Expected: PASS.  
Commit: `git commit -m "feat(board): build tactile prismatic kanban board with spring physics"`

---

### Task 5: Cross-Platform Polish (Android SuperApp & Windows Electron)

**Files:**
- Modify: `components/navigation/SuperAppBottomBar.tsx`
- Modify: `components/navigation/super-app-bar.css`
- Modify: `electron/main.js` (frameless titlebar styling)

**Interfaces:**
- Ensures bottom bar on mobile Android uses frosted prismatic glass with spring physics button feedback.

- [ ] **Step 1: Update `super-app-bar.css` with Prismatic Aurora tokens**
- [ ] **Step 2: Add spring micro-interactions to `SuperAppBottomBar.tsx`**
- [ ] **Step 3: Commit changes**

```bash
git add components/navigation/SuperAppBottomBar.tsx components/navigation/super-app-bar.css
git commit -m "feat(mobile): style android superapp bottom bar with prismatic aurora tokens"
```

---

### Task 6: Comprehensive Security & Build Verification Gate

**Files:**
- Run: `npm run test:security`
- Run: `npm run build`

- [ ] **Step 1: Execute all 103 security and RLS tests**

Run: `npm run test:security`  
Expected: 103 passing tests, 0 failures.

- [ ] **Step 2: Execute production build**

Run: `npm run build`  
Expected: Successful Next.js build with all static/dynamic routes.

- [ ] **Step 3: Final commit & tag**

```bash
git commit --allow-empty -m "chore(release): verified prismatic aurora animated system across web win android"
```
