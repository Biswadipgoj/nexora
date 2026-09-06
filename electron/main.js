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
    width: 2000,
    height: 1080,
    minWidth: 1400,
    minHeight: 720,
    title: 'Nexora',
    backgroundColor: '#F8FAFC',
    icon: path.join(__dirname, 'icon.ico'),
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
          <title>Nexora</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #080B12;
              color: #F4F7FB;
            }
            .spinner {
              width: 40px;
              height: 40px;
              border: 3px solid rgba(174, 205, 255, 0.14);
              border-top-color: #6EA8FF;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin-bottom: 20px;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            @media (prefers-reduced-motion: reduce) {
              .spinner { animation: none; border-top-color: #6EA8FF; }
            }
            h2 { font-size: 1.0625rem; font-weight: 650; margin: 0 0 6px; }
            p { font-size: 0.875rem; color: #7E8DA3; margin: 0; }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h2>Starting Nexora</h2>
          <p>Connecting to your workspace…</p>
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
