# NEXORA — Windows Desktop App (.exe) Packaging & Distribution Guide

> **Ultra-Fast Agile Orchestration on Windows Desktop**  
> Standalone executable powered by Electron, Chromium GPU acceleration, and zero-configuration launcher.

---

## 1. Overview & Architecture

NEXORA for Windows provides a native desktop experience that wraps the unified Next.js web application into a high-performance Windows executable (`NEXORA.exe`).

```
┌──────────────────────────────────────────────────────────────┐
│                    NEXORA.exe (Windows Desktop)              │
│                                                              │
│  ┌──────────────────────┐        ┌────────────────────────┐  │
│  │   Electron 44 Core   │◄──────►│    DirectX / Vulkan    │  │
│  │  Main & Preload IPC  │        │ 120fps GPU Rasterizer  │  │
│  └──────────┬───────────┘        └────────────────────────┘  │
│             │                                                │
│             ▼                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           Chromium WebPreferences & UI Layer           │  │
│  │       • contextIsolation: true                         │  │
│  │       • nodeIntegration: false                         │  │
│  │       • singleInstanceLock: true                       │  │
│  │       • 1400x900 Frameless Modern Window               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬───────────────────────────────┘
                               │ Loads
                               ▼
┌──────────────────────────────────────────────────────────────┐
│       NEXORA Application Engine (Local or Cloud Server)      │
│     Kanban Board · Super Actions · Realtime Multi-Tenant     │
└──────────────────────────────────────────────────────────────┘
```

### Key Performance & Desktop Features:
- **120fps Native GPU Acceleration:** Configured with `--enable-gpu-rasterization`, `--enable-zero-copy`, `--ignore-gpu-blocklist`, and `--enable-smooth-scrolling`.
- **Single-Instance Enforcement:** Prevents multiple instances from consuming system resources. Launching a second instance automatically focuses and restores the active window.
- **Secure Sandboxing:** `nodeIntegration` is disabled and `contextIsolation` is enabled, protecting your environment against remote code execution vulnerabilities.
- **Auto-Reconnecting Splash Screen:** If the app server is still initializing, a clean connecting indicator is displayed and automatically redirects as soon as the service is ready.
- **External Link Routing:** All external links (`http://` or `https://`) are automatically routed to the user's default Windows web browser rather than opening within the desktop app frame.

---

## 2. Prerequisites

To build and package the Windows desktop app, ensure your system meets the following requirements:

1. **Operating System:** Windows 10 or Windows 11 (64-bit x64).
2. **Node.js:** Node.js v18.x, v20.x, or v22.x LTS ([Download](https://nodejs.org/)).
3. **Project Dependencies:** Electron and dependencies installed (`npm install`).

---

## 3. Development Workflow

You can run the Windows desktop application in live development mode with hot reload.

### Step 1: Start the NEXORA Dev Server
In your first terminal:
```powershell
npm run dev
```
Wait until the server starts on `http://localhost:3000`.

### Step 2: Launch the Electron Desktop Window
In a second terminal:
```powershell
npm run desktop
```
*(This executes `electron .` referencing the entry point in `electron/main.js`)*

### Custom Application URL
By default, the Electron shell connects to `http://localhost:3000`. If you wish to connect the desktop application to a staging or production cloud deployment, set the `NEXORA_APP_URL` environment variable:

```powershell
$env:NEXORA_APP_URL="https://nexora.your-domain.com"
npm run desktop
```

---

## 4. Packaging the Standalone Windows Executable (.exe)

NEXORA includes an automated zero-dependency packaging script (`scripts/package-windows.js`) that produces a standalone Windows distribution.

### Step 1: Run the Packaging Script
```powershell
npm run desktop:package
```
*(Or alternatively: `npm run desktop:build`)*

### What the packaging process executes:
1. Validates the local Electron x64 binary distribution in `node_modules/electron/dist`.
2. Creates the clean output folder `dist-electron/NEXORA-win32-x64/`.
3. Copies all necessary Chromium, V8, and DirectX runtime files (`d3dcompiler_47.dll`, `vulkan-1.dll`, locales, ICU datastore).
4. Renames `electron.exe` to `NEXORA.exe` as the primary branded Windows executable.
5. Assembles the isolated app bundle inside `resources/app/` (`main.js`, `preload.js`, and `package.json`).
6. Generates `Launch-NEXORA.cmd` in `dist-electron/` for one-click launching.

### Build Output Summary
Upon completion, the build script displays:
```
🚀 Packaging NEXORA Windows Desktop App (.exe)...
📦 Copying Electron runtime binaries...
✨ Created: NEXORA.exe (Primary Windows Executable)
🎉 NEXORA Windows App built successfully!
📍 Executable: d:\nexora\dist-electron\NEXORA-win32-x64\NEXORA.exe
📊 Binary Size: ~246.2 MB
⚡ Features: 120fps GPU rasterization, Frameless modern window, Safe IPC bridge
```

---

## 5. Output Artifacts Structure

The compiled desktop files are organized inside `dist-electron/`:

```
dist-electron/
├── Launch-NEXORA.cmd             # Quick launcher shortcut script
├── NEXORA-Windows-x64.zip        # Portable compressed distribution archive (158 MB)
└── NEXORA-win32-x64/             # Complete portable application directory (246 MB)
    ├── NEXORA.exe                # << PRIMARY WINDOWS EXECUTABLE >>
    ├── d3dcompiler_47.dll        # DirectX compiler runtime
    ├── dxcompiler.dll            # DirectX Shader compiler
    ├── ffmpeg.dll                # Media playback engine
    ├── icudtl.dat                # Internationalization data
    ├── vulkan-1.dll              # Vulkan graphics runtime
    ├── locales/                  # Multi-language string tables
    └── resources/
        └── app/                  # Application code bundle
            ├── main.js           # Desktop window & IPC manager
            ├── preload.js        # Context bridge
            └── package.json      # Desktop package manifest
```

> **Note on Git:** `dist-electron/` and all `*.exe` / `*.zip` files are configured in `.gitignore` to prevent exceeding GitHub's 100 MB upload limit.

---

## 6. How to Launch & Distribute

### Option A: Running Locally
- Double-click `dist-electron/Launch-NEXORA.cmd`, OR
- Double-click `dist-electron/NEXORA-win32-x64/NEXORA.exe`.

### Option B: Distributing to Team Members / Users
1. Compress the `NEXORA-win32-x64` folder into a zip archive (or use `dist-electron/NEXORA-Windows-x64.zip`).
2. Share via Google Drive, OneDrive, AWS S3, or GitHub Releases.
3. The recipient extracts the zip archive and double-clicks `NEXORA.exe`.
4. No installation, registry changes, or administrator privileges are required.

---

## 7. Troubleshooting & FAQ

### 1. Windows SmartScreen Warning ("Windows protected your PC")
Because the executable is compiled locally and not signed with an expensive Extended Validation (EV) code-signing certificate, Windows Defender SmartScreen may display an alert on first launch.
- **Solution:** Click **More info** → click **Run anyway**.

### 2. White Screen on Startup
If `NEXORA.exe` opens with a white or blank screen:
- Ensure the dev server is running on `http://localhost:3000` or specify your production URL:
  ```powershell
  $env:NEXORA_APP_URL="https://your-domain.com"
  .\dist-electron\NEXORA-win32-x64\NEXORA.exe
  ```
- Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>I</kbd> inside the app window to open the Chromium DevTools and inspect any network or console errors.

### 3. GPU Hardware Acceleration Issues
On virtual machines or older GPUs where Vulkan/DirectX acceleration is unsupported:
- You can disable hardware acceleration by launching from terminal:
  ```powershell
  .\dist-electron\NEXORA-win32-x64\NEXORA.exe --disable-gpu
  ```
