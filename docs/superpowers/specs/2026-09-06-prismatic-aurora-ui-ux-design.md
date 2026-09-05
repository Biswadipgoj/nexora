# NEXORA — Prismatic Aurora Animated UI/UX Design Specification

**Date:** 2026-09-06  
**Status:** Approved  
**Target Platforms:** Responsive Web, Windows Desktop (Electron 44), Native Android Super-App (Capacitor 8.x)

---

## 1. Executive Summary & Aesthetic Vision

NEXORA's interface is engineered as a high-velocity, luxury-craft agile work orchestration platform. The visual and interaction design replaces flat, monochrome, or stark light/dark aesthetics with **Prismatic Aurora Glass**:
- **Non-Dark, Non-White Canvas:** A luminous, frosted slate-indigo mid-tone (`#181d2e` to `#22283e`) that prevents eye fatigue while radiating warmth and depth.
- **Vibrant Multi-Hue Lighting:** Multi-stop chromatic auroras (Electric Iris, Neon Aqua, Solar Amber, Cosmic Rose, Spring Jade) integrated into ambient backdrops, borders, and interactive state indicators.
- **Anti-Flat Tactile Depth:** Layered frosted glass surfaces (`backdrop-filter: blur(20px)`), multi-layered ambient colored drop-shadows, and specular top-edge rim highlights (`inset 0 1px 0 0 rgba(255, 255, 255, 0.22)`).
- **Physics-Driven Motion:** Calibrated spring physics via `motion` v13 (`stiffness: 450, damping: 30` for micro-interactions; `stiffness: 320, damping: 24` for card drag and drop), subtle 3D perspective hover tilts, and fluid layout morphing.

---

## 2. Color Tokens & Dimensional Design System

### 2.1 Color Tokens
```css
:root {
  /* Canvas & Base Surfaces (Anti-Black, Anti-White) */
  --canvas-bg: #181d2e;
  --canvas-gradient: radial-gradient(circle at 15% 15%, rgba(139, 92, 246, 0.18) 0%, transparent 40%),
                     radial-gradient(circle at 85% 85%, rgba(6, 182, 212, 0.14) 0%, transparent 45%),
                     radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.08) 0%, transparent 50%),
                     #181d2e;

  /* Surfaces & Glass Paneling */
  --surface-primary: rgba(30, 37, 60, 0.72);
  --surface-elevated: rgba(42, 51, 82, 0.82);
  --surface-hover: rgba(54, 65, 102, 0.88);
  --surface-modal: rgba(28, 34, 56, 0.94);

  /* Specular Rim & Inner Bevel Highlights */
  --border-rim: 1px solid rgba(255, 255, 255, 0.14);
  --border-rim-highlight: inset 0 1px 0 0 rgba(255, 255, 255, 0.24);
  --border-glow-iris: 0 0 0 1px rgba(139, 92, 246, 0.4), 0 0 16px rgba(139, 92, 246, 0.25);

  /* Multi-Hue Aurora Accents */
  --aurora-iris: #8b5cf6;
  --aurora-aqua: #06b6d4;
  --aurora-amber: #f59e0b;
  --aurora-rose: #f43f5e;
  --aurora-jade: #10b981;

  /* Text & Contrast */
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-subtle: #64748b;

  /* Elevation Shadows with Ambient Penumbras */
  --shadow-sm: 0 2px 8px -1px rgba(10, 13, 24, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.15);
  --shadow-md: 0 10px 24px -4px rgba(10, 13, 24, 0.55), 0 0 16px -2px rgba(139, 92, 246, 0.16), inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
  --shadow-lg: 0 20px 40px -8px rgba(8, 10, 20, 0.7), 0 0 32px -4px rgba(6, 182, 212, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.25);
  --shadow-lifted: 0 24px 48px -6px rgba(10, 14, 26, 0.8), 0 0 28px rgba(139, 92, 246, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
}
```

### 2.2 Tactile Dimensionality Principles
1. **Never 100% Flat:** All interactive items have a top specular rim (`inset 0 1px 0`), a tactile border (`rgba(255,255,255,0.12)`), and an ambient blur shadow.
2. **Glassmorphism with High Legibility:** Background blur is set to `20px` with `saturate(180%)` to enrich the color spectrum passing through translucent surfaces while keeping text razor-sharp (`#f8fafc`).
3. **Multi-Stop Color Halos:** Hovering or focusing elements activates localized color glows based on context (e.g. In-Progress tasks glow with Solar Amber, Done tasks with Spring Jade).

---

## 3. Motion & Interaction Primitives

### 3.1 Spring Dynamics (Motion v13)
All animations utilize real physical spring configurations:
- **Snappy Controls (Buttons, Pills, Tabs):** `{ type: "spring", stiffness: 450, damping: 30 }`
- **Draggable Cards (Kanban Drag & Drop):** `{ type: "spring", stiffness: 320, damping: 24 }`
- **Modals & Drawers:** `{ type: "spring", stiffness: 380, damping: 32 }`

### 3.2 3D Perspective Card Tilt & Cursor Glare
Interactive cards on the landing page and dashboard feature a 3D perspective hover reaction:
- Perspective container: `perspective: 1000px`
- Tilt transforms: `rotateX` and `rotateY` mapped between `-6deg` and `+6deg` relative to mouse position.
- Specular gloss layer: A radial gradient highlight shifts synchronously with the cursor, giving the illusion of polished glass.

### 3.3 Seamless Layout Transitions (`layout` and `layoutId`)
- Task cards smoothly slide into new positions when neighboring cards are reordered, dragged, or removed.
- Tab selection indicators glide across the active pill without jump cuts.

### 3.4 Tactile Tap States
- Buttons and cards depress smoothly on click/tap (`whileTap={{ scale: 0.97 }}`), delivering physical feedback across touch and mouse inputs.

---

## 4. Public Landing Page & Interactive Showcase

### 4.1 Visual Components
1. **Suspended Aurora Header:** Frosted floating glass pill featuring the glowing NEXORA emblem, navigation links, and primary CTA.
2. **Hero Stage:**
   - Shimmering chromatic gradient typography: "The high-velocity workspace for modern product teams".
   - Ambient floating aurora orbs gently drifting with hardware acceleration.
   - Dual tactile CTA buttons: "Start Building Free" (luminous iris border with spring hover) and "View Live Demo" (frosted glass pill).
3. **Interactive Hero Sandbox:**
   - A live, interactive mini-Kanban board right in the hero section.
   - Visitors can drag cards, toggle priorities, or click task statuses to immediately feel the spring physics, 3D card tilt, and tactile depth before signing up.
4. **Dimensional Feature Matrix:**
   - 3 interactive cards featuring micro-widgets: Sprint Velocity, Cross-Platform sync, and Enterprise Tenancy Isolation.

---

## 5. Core Workspace & Agile Kanban Board

### 5.1 Workspace Layout
- **Luminous Topbar:** Dynamic breadcrumbs, workspace switcher pill, active sprint status bar, search trigger (`⌘K`), and `+ New Task` button.
- **Kanban Board Columns:**
  - Distinct colored headers:
    - **To Do:** Electric Iris (`#8b5cf6`)
    - **In Progress:** Solar Amber (`#f59e0b`)
    - **Code Review:** Neon Aqua (`#06b6d4`)
    - **Done:** Spring Jade (`#10b981`)
  - Each column header displays a live task count badge and column options.
- **Tactile Task Cards:**
  - Specular rim highlight, priority badge (Urgent = Cosmic Rose, High = Solar Amber, Medium = Neon Aqua, Low = Slate), assignees avatar, and sequence ID (e.g. `NEX-104`).
  - Spring-animated drag-and-drop: lifting a card adds elevation shadow, scale lift, and subtle tilt. Target columns highlight with an ambient glow dropzone.
- **Task Detail Inspector Drawer:**
  - Spring slides in from the right.
  - Includes status switcher, description editor, checklist items with spring checkboxes, and activity log.

---

## 6. Cross-Platform Adaptations

- **Responsive Web:** Full multi-column view, horizontal scroll damping, and responsive breakpoints down to mobile.
- **Windows Desktop (Electron 44):** Native frameless titlebar integration, 120fps hardware acceleration, and full keyboard shortcut mapping (`N`, `1-4`, `⌘K`, `Esc`).
- **Android Super-App (Capacitor 8.x):** Touch-optimized carousel columns, swipe-down-to-dismiss task sheets, and floating `SuperAppBottomBar` with tactile spring bounce.

---

## 7. Data Flow, Security & Verification

1. **Optimistic Updates:** Immediate UI state change via React 19 state and Motion springs, followed by asynchronous sync to Supabase `work_items`.
2. **Zero-Lag Demo Mode:** Full offline functionality via `demo-store.ts` for demo sessions without Supabase configuration.
3. **Security Preservation:** Strict RLS enforcement and zero IDOR vulnerability; all 103 Vitest security tests (`npm run test:security`) remain 100% passing.
4. **Build Integrity:** Clean production build with zero TypeScript or Next.js errors (`npm run build`).
