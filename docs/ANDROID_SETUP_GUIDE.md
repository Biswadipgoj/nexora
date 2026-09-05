# NEXORA — Native Android Super-App Setup & Build Guide

> **Fluid 120fps Native Experience with Zero Code Duplication**  
> Powered by Capacitor 8.x, Android Studio, Hardware Acceleration, and Material Maximalism UI.

---

## 1. Overview & Architecture

NEXORA's Android implementation allows the **identical Next.js codebase** to run as a high-performance native Android application. It incorporates mobile-specific components like the `SuperAppBottomBar` and `SuperActionSheet` while keeping 100% of business logic unified.

```
┌──────────────────────────────────────────────────────────────┐
│                    NEXORA Android Application                │
│                                                              │
│  ┌──────────────────────┐        ┌────────────────────────┐  │
│  │   Android Studio     │◄──────►│  Hardware Accelerated  │  │
│  │    Gradle Build      │        │    120Hz/90Hz Display  │  │
│  └──────────┬───────────┘        └────────────────────────┘  │
│             │                                                │
│             ▼                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                 Capacitor 8.x Bridge                   │  │
│  │     • AndroidManifest: hardwareAccelerated="true"      │  │
│  │     • windowSoftInputMode="adjustResize"               │  │
│  │     • Safe Area Insets & Status Bar Styling            │  │
│  └──────────────────────────┬─────────────────────────────┘  │
│                             │                                │
│                             ▼                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                Super-App UI & Navigation               │  │
│  │     • Floating SuperAppBottomBar (Overview/Tasks/...)  │  │
│  │     • Spring-Physics SuperActionSheet Modal            │  │
│  │     • 44x44pt Touch Targets & Haptic Visual Ripples    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Super-App Mobile Features
- **Fluid 120fps Refresh Rate:** Explicitly enabled in `android/app/src/main/AndroidManifest.xml` via `android:hardwareAccelerated="true"` and CSS GPU transforms (`translate3d`, `backdrop-filter`).
- **Floating Super-App Bottom Bar:** Fixed thumb-friendly navigation bar (`components/navigation/SuperAppBottomBar.tsx`) providing seamless access to Overview, Tasks, Board, Inbox, and Quick Create.
- **Micro-Animated Action Sheet:** The `SuperActionSheet.tsx` component handles quick creation of tasks, projects, and invites with smooth spring animations.
- **Adaptive Keyboard Input:** Configured with `android:windowSoftInputMode="adjustResize"` to ensure the on-screen keyboard never obscures active input fields or buttons.

---

## 2. Prerequisites

Ensure your development workstation has the following tools installed:

1. **Node.js:** Node.js v18.x, v20.x, or v22.x LTS ([Download](https://nodejs.org/)).
2. **Android Studio:** Latest release (Ladybug, Jellyfish, or newer) ([Download](https://developer.android.com/studio)).
3. **Android SDK:** API Level 33, 34, or 35 (installed via Android Studio SDK Manager).
4. **Java Development Kit (JDK):** JDK 17 or JDK 21 (bundled automatically with modern Android Studio).

### Environment Variables Setup
Add the Android SDK and Java paths to your system environment variables (Windows PowerShell example):

```powershell
# Set Java Home to Android Studio's bundled JDK (adjust path if needed)
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Android\Android Studio\jbr", "User")

# Set Android Home to your local SDK directory
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")

# Add Platform Tools (adb) to PATH
$currentPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
[System.Environment]::SetEnvironmentVariable("PATH", "$currentPath;$env:LOCALAPPDATA\Android\Sdk\platform-tools", "User")
```

---

## 3. Synchronizing Web Assets to Android

Whenever you update pages, styles, or logic in the web application, sync them to the native Android project:

```powershell
# 1. Build the production Next.js bundle
npm run build

# 2. Sync web assets and capacitor plugins into android/
npm run android:sync
```

*(Under the hood, this runs `npx cap sync android`, which copies public assets, updates Android plugins, and validates configuration)*.

---

## 4. Live Development with Hot Reload on Android

You do not need to recompile the native APK every time you edit a TypeScript or CSS file. You can run NEXORA in live reload mode.

### Step 1: Configure `capacitor.config.ts`
Open `capacitor.config.ts` and set the `server.url` option:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nexora.app',
  appName: 'NEXORA',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    cleartext: true,
    
    // OPTION A: Android Virtual Device / Emulator (10.0.2.2 points to computer localhost)
    url: 'http://10.0.2.2:3000',

    // OPTION B: Physical Phone on Local Wi-Fi (replace with your computer's LAN IP)
    // url: 'http://192.168.1.150:3000',

    // OPTION C: Production Cloud Deployment
    // url: 'https://nexora.your-domain.com',
  },
  android: {
    backgroundColor: '#F8FAFC',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true, // Allows Chrome Remote Debugging
  },
};

export default config;
```

### Step 2: Sync and Start Dev Server
```powershell
# Sync the updated config to Android
npm run android:sync

# Start the Next.js dev server
npm run dev
```

---

## 5. Opening and Running in Android Studio

To launch the project in Android Studio:

```powershell
npm run android:open
```

### In Android Studio:
1. Allow Gradle to finish indexing and syncing dependencies.
2. Select your target device from the top toolbar:
   - **Android Emulator:** e.g. Pixel 7 / Android 14 (API 34).
   - **Physical Device:** Connect phone via USB with **Developer Options** and **USB Debugging** turned on.
3. Click the green **Run (▶)** button (or press <kbd>Shift</kbd> + <kbd>F10</kbd>).
4. NEXORA launches with native splash screen, edge-to-edge layout, and high refresh-rate rendering!

---

## 6. Building Standalone Android APK & AAB

You can build standalone installable APK files directly from the command line without keeping Android Studio open.

### Building a Debug APK
```powershell
cd android
.\gradlew.bat assembleDebug
```
Output location:
```
android/app/build/outputs/apk/debug/app-debug.apk
```
*You can transfer `app-debug.apk` directly to any Android smartphone via USB or messaging app and install it.*

### Building a Production Signed Release APK
1. Generate a keystore if you don't already have one:
   ```powershell
   keytool -genkey -v -keystore nexora-release-key.jks -alias nexora -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Place `nexora-release-key.jks` in `android/app/`.
3. Configure signing in `android/app/build.gradle`:
   ```groovy
   android {
       ...
       signingConfigs {
           release {
               storeFile file('nexora-release-key.jks')
               storePassword System.getenv('NEXORA_KEYSTORE_PASSWORD')
               keyAlias 'nexora'
               keyPassword System.getenv('NEXORA_KEY_PASSWORD')
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled false
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```
4. Run the release build command:
   ```powershell
   cd android
   .\gradlew.bat assembleRelease
   ```
   Output: `android/app/build/outputs/apk/release/app-release.apk`

### Building an Android App Bundle (AAB for Google Play)
To submit NEXORA to the Google Play Console:
```powershell
cd android
.\gradlew.bat bundleRelease
```
Output:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## 7. Android Manifest Configuration Reference

The project's manifest is tuned for fluid 120fps touch performance at `android/app/src/main/AndroidManifest.xml`:

```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:hardwareAccelerated="true"
    android:usesCleartextTraffic="true"
    android:theme="@style/AppTheme">

    <activity
        android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation|density"
        android:name=".MainActivity"
        android:label="@string/title_activity_main"
        android:theme="@style/AppTheme.NoActionBarLaunch"
        android:launchMode="singleTask"
        android:windowSoftInputMode="adjustResize"
        android:hardwareAccelerated="true"
        android:exported="true">
...
```

---

## 8. Chrome Remote Debugging on Android

To inspect elements, view console logs, or debug network calls from your phone on your computer:
1. Connect your Android phone via USB cable.
2. In your computer's Google Chrome browser, navigate to:
   ```
   chrome://inspect/#devices
   ```
3. Locate **com.nexora.app** under the connected device list.
4. Click **Inspect** to open full Chrome DevTools for your running Android app!

---

## 9. Troubleshooting & FAQ

| Issue | Cause | Solution |
|---|---|---|
| `ERR_CLEARTEXT_NOT_PERMITTED` | Android blocking HTTP traffic to local dev server | Verify `android:usesCleartextTraffic="true"` in `AndroidManifest.xml` and `cleartext: true` in `capacitor.config.ts`. |
| Cannot connect to `http://localhost:3000` | Android emulator considers `localhost` its own loopback | Change `url` in `capacitor.config.ts` to `http://10.0.2.2:3000`. |
| Gradle build failure: `JAVA_HOME is invalid` | Wrong Java path configured | Point `JAVA_HOME` to Android Studio's bundled JDK (`.../Android Studio/jbr`). |
| Soft keyboard covers inputs | Layout mode not resizing | Confirm `android:windowSoftInputMode="adjustResize"` in `AndroidManifest.xml`. |
| White screen on launch | Web assets not built or server not reachable | Run `npm run build && npm run android:sync`. Ensure the server URL is reachable. |
