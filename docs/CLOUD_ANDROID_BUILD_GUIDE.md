# NEXORA — Zero-Install Cloud Android Build & Testing Guide

> **Build and Test Android APKs 100% in the Cloud — Without Installing Android Studio!**  
> Save 15–25 GB of disk space and CPU memory by compiling and running your Android app using free cloud infrastructure.

---

## 1. Why Build in the Cloud?

Traditional Android development requires downloading **Android Studio**, the **Android SDK**, **Gradle**, and a **Virtual Device Emulator**, which:
- Consumes **15 GB to 25+ GB** of disk storage.
- Requires high RAM (8 GB+ just for the emulator).
- Involves complex path setup (`ANDROID_HOME`, `JAVA_HOME`, SDK licenses).

With **NEXORA's Cloud Setup**, you can:
1. **Compile the APK online for free** via **GitHub Actions** (hosted on GitHub's cloud servers).
2. **Download the `.apk` directly to your phone** or computer.
3. **Run and test the APK in your web browser** using **Appetize.io** (a 100% free cloud Android emulator).

```
┌─────────────────────────────────────────────────────────────┐
│                    ZERO-INSTALL CLOUD PIPELINE              │
│                                                             │
│   ┌──────────────────┐               ┌──────────────────┐   │
│   │ Your GitHub Repo │──────────────►│  GitHub Actions  │   │
│   │   (Push Code)    │  Triggers     │  Cloud Runner    │   │
│   └──────────────────┘               │  (Ubuntu + JDK)  │   │
│                                      └────────┬─────────┘   │
│                                               │ Builds APK  │
│                                               ▼             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │             Downloadable "app-debug.apk"            │   │
│   └───────────────┬─────────────────────────────┬───────┘   │
│                   │                             │           │
│                   ▼                             ▼           │
│   ┌───────────────────────────────┐ ┌───────────────────┐   │
│   │     Install Directly on       │ │ Run in Browser on │   │
│   │     Any Android Phone         │ │    Appetize.io    │   │
│   │      (USB / WhatsApp)         │ │ (Cloud Emulator)  │   │
│   └───────────────────────────────┘ └───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Option A: GitHub Actions (100% Free & Already Set Up)

Your repository comes pre-configured with `.github/workflows/build-android.yml`.

### How to Trigger an APK Build on GitHub:

1. Open your repository on GitHub:  
   👉 [`https://github.com/Biswadipgoj/nexora`](https://github.com/Biswadipgoj/nexora)
2. Click on the **Actions** tab at the top.
3. In the left sidebar under *Workflows*, click **"Build Android APK (Cloud)"**.
4. On the right side, click the **Run workflow** dropdown button:
   - Select branch: `master`
   - Build Type: `debug` (or `release`)
   - Click the green **Run workflow** button.
5. GitHub will spin up an Ubuntu cloud server with Android SDK and JDK pre-installed, build your Next.js assets, sync Capacitor, and compile the APK in **~3 to 4 minutes**.

---

### How to Download Your Compiled APK:

1. When the workflow finishes (green checkmark `✓`), click on the workflow run name (e.g. *Cloud Android APK Build*).
2. Scroll down to the **Artifacts** section at the bottom of the page.
3. Click on **`NEXORA-Android-APK`** to download the zip file.
4. Extract the zip file on your PC or phone to find:
   ```
   app-debug.apk
   ```
5. You can now transfer this APK to any Android phone (via USB, Google Drive, WhatsApp, or Telegram) and install it immediately!

---

## 3. Option B: Test Your APK in Browser (Appetize.io — Free Cloud Emulator)

If you don't even have an Android phone handy and want to test the app interactively inside Google Chrome or Microsoft Edge:

1. Visit [**appetize.io/upload**](https://appetize.io/upload).
2. Click **Select file** and upload your downloaded `app-debug.apk`.
3. Appetize will process the file in a few seconds and generate an interactive virtual Android phone directly in your browser.
4. Click **Play**:
   - You can click, swipe, test the **Super-App Bottom Bar**, open modals, drag tasks on the Kanban board, and test responsiveness.
   - 100% free with no account or credit card required for standard testing sessions.

---

## 4. Option C: Codemagic (Alternative Free Mobile CI/CD)

If you prefer an alternative mobile-dedicated cloud CI/CD platform:

1. Go to [**codemagic.io**](https://codemagic.io/) and sign in with GitHub (Free tier gives 500 build minutes per month).
2. Select your `nexora` repository.
3. Choose **Capacitor / Android** template.
4. Click **Start build**. Codemagic will build your APK in the cloud and email you a download link or QR code to install directly on your phone.

---

## 5. Summary: Local vs. Cloud Comparison

| Feature | Local Android Studio | GitHub Actions Cloud Build |
|---|---|---|
| **Disk Space Needed** | 15–25 GB on your PC | **0 GB (Runs on cloud)** |
| **RAM Usage** | 8–16 GB during build | **0 MB on your PC** |
| **Installation Time** | 1–2 hours downloading SDKs | **0 minutes (Ready now)** |
| **Cost** | Free | **100% Free** |
| **Output File** | `app-debug.apk` | `app-debug.apk` |
| **Direct Phone Install** | Yes | **Yes** |
| **Browser Cloud Testing** | Requires local emulator | **Via Appetize.io** |
