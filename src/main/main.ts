import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification } from 'electron';
import path from 'path';
import http from 'http';
import { startAria2, stopAria2, getAria2Config } from './aria2';

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;

// Extension Integration Server
function startExtensionServer() {
  const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/add-download') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.url) {
            // Show window if hidden
            mainWindow?.show();
            // Send to renderer to open dialog
            mainWindow?.webContents.send('show-add-download-dialog', data.url);

            new Notification({
              title: 'AriaLUI',
              body: 'New download received from browser'
            }).show();
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(6801, () => {
    console.log('Extension server listening on port 6801');
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../../public/vite.svg');

  try {
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show App', click: () => mainWindow?.show() },
      {
        label: 'Quit', click: () => {
          app.quit();
        }
      },
    ]);
    tray.setToolTip('AriaLUI');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      mainWindow?.show();
    });
  } catch (e) {
    console.error('Failed to create tray', e);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1e1e1e',
    icon: path.join(__dirname, '../../public/vite.svg')
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('close', (event) => {
    if (!(app as any).isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
      new Notification({
        title: 'AriaLUI',
        body: 'Application minimized to tray'
      }).show();
    }
    return false;
  });
}

app.whenReady().then(() => {
  startAria2();
  startExtensionServer();

  ipcMain.handle('get-aria2-config', () => {
    return getAria2Config();
  });

  createWindow();
  createTray();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  (app as any).isQuitting = true;
});

app.on('will-quit', () => {
  stopAria2();
});

app.on('window-all-closed', function () {
  // Do not quit on window close, as we have tray
  // if (process.platform !== 'darwin') app.quit();
});
