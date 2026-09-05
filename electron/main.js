const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const http = require('http');

// §120fps Hardware Acceleration & Native Windows GPU Flags
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-smooth-scrolling');
app.commandLine.appendSwitch('high-dpi-support', '1');

let mainWindow = null;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function checkUrlReady(url, maxRetries = 30, interval = 500) {
  return new Promise((resolve) => {
    let retries = 0;
    const tryConnect = () => {
      http.get(url, (res) => {
        if (res.statusCode < 500) {
          resolve(true);
        } else {
          retry();
        }
      }).on('error', () => {
        retry();
      });
    };

    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        resolve(false);
      } else {
        setTimeout(tryConnect, interval);
      }
    };

    tryConnect();
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 980,
    minHeight: 640,
    title: 'NEXORA',
    backgroundColor: '#181d2e',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open external links in default web browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  const appUrl = process.env.NEXORA_APP_URL || 'http://localhost:3000';
  const isReady = await checkUrlReady(appUrl);

  if (isReady) {
    mainWindow.loadURL(appUrl);
  } else {
    // Fallback landing page if server is starting
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>NEXORA — Connecting</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #F8FAFC;
              color: #0F172A;
            }
            .spinner {
              width: 48px;
              height: 48px;
              border: 4px solid #E2E8F0;
              border-top-color: #4F46E5;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin-bottom: 20px;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            h2 { font-size: 1.25rem; font-weight: 700; margin: 0 0 8px; }
            p { font-size: 0.875rem; color: #64748B; margin: 0; }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h2>Starting NEXORA Desktop Engine...</h2>
          <p>Connecting to ultra-fast agile workspace (120fps)</p>
          <script>
            setTimeout(() => { window.location.href = '${appUrl}'; }, 2000);
          </script>
        </body>
      </html>
    `)}`);
    // Retry loading target URL
    setTimeout(() => {
      mainWindow.loadURL(appUrl);
    }, 2500);
  }
}

// Window control IPC
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
