import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification } from 'electron';
// eslint-disable-next-line @typescript-eslint/no-require-imports
if (require('electron-squirrel-startup')) app.quit();
import { updateElectronApp, UpdateSourceType } from 'update-electron-app';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { BackendType } from './backend-manager';
import { getAria2Config } from './aria2';
import { initializeConfig, getConfigManager } from './config';
import { getBackendManager } from './backend-manager';
import { Aria2Backend } from './aria2';
import { Wget2Backend } from './wget2';
import { WgetBackend } from './wget';
import { DirectBackend } from './direct-download';
import { getDownloadTracker } from './download-tracker';
import { setupAutostart } from './autostart';

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let directBackend: DirectBackend | null = null;

// Extension Integration Server
function startExtensionServer() {
  const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Health check endpoint for extension
    if (req.method === 'GET' && req.url === '/ping') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', app: 'AriaLUI' }));
      return;
    }

    // Get available backends endpoint
    if (req.method === 'GET' && req.url === '/get-backends') {
      const backendManager = getBackendManager();
      const backends = backendManager.getBackendStatus();
      const defaultBackend = backendManager.getDefaultBackend();
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        backends,
        defaultBackend
      }));
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
          console.log('[MAIN] Received download request from extension:', data.url);
          if (data.url) {
            // Show window if hidden
            mainWindow?.show();
            // Send to renderer to open dialog with URL
            console.log('[MAIN] Sending show-add-download-dialog event to renderer');
            mainWindow?.webContents.send('show-add-download-dialog', {
              url: data.url,
              filename: data.filename,
              referrer: data.referrer,
              cookies: data.cookies,
              userAgent: data.userAgent,
              backend: data.backend  // Include backend selection from extension
            });

            new Notification({
              title: 'AriaLUI',
              body: 'New download received from browser'
            }).show();
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          console.error('Error processing download request:', e);
          res.writeHead(400, { 'Content-Type': 'application/json' });
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
  const iconPath = path.join(__dirname, '../../resources/icon.png');

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
    icon: path.join(__dirname, '../../resources/icon.png')
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Load from the Vite build output
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(app as any).isQuitting) {
      const config = getConfigManager().getConfig();
      
      if (config.general.closeBehavior === 'minimize-to-tray') {
        event.preventDefault();
        mainWindow?.hide();
        new Notification({
          title: 'AriaLUI',
          body: 'Application minimized to tray'
        }).show();
      }
      // If 'close', do nothing and let it close (which will quit app if not on macOS, or handled by window-all-closed)
    }
    return false;
  });
}

// Single instance lock - prevent multiple instances of the app
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running, quit this one
  app.quit();
} else {
  // This is the first instance, listen for second-instance events
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Only initialize the app if we got the lock
  app.whenReady().then(async () => {
    // Initialize configuration first
    await initializeConfig();
    
    // Get config to check auto-update setting
    const config = getConfigManager().getConfig();
    
    // Initialize auto-updater only if enabled
    // Check for updates at startup and every 10 minutes
    if (config.general.autoUpdate) {
      updateElectronApp({
        updateSource: {
          repo: 'cilginc/arialui',
          type: UpdateSourceType.ElectronPublicUpdateService
        },
        updateInterval: '10 minutes',
        logger: console
      });
    }
    
    // Apply autostart setting
    setupAutostart(config.general.autostart);
    
    // Initialize backend manager
    const backendManager = getBackendManager();
    
    // Register backends
    backendManager.registerBackend(new Aria2Backend());
    backendManager.registerBackend(new Wget2Backend());
    backendManager.registerBackend(new WgetBackend());
    // Direct backend will be registered after window is created
    
    startExtensionServer();

  // Configuration IPC handlers
  ipcMain.handle('get-config', () => {
    return getConfigManager().getConfig();
  });

  ipcMain.handle('update-config', async (_event, updates) => {
    const configManager = getConfigManager();
    const oldConfig = configManager.getConfig();
    configManager.updateConfig(updates);
    await configManager.save();
    
    const newConfig = configManager.getConfig();
    if (oldConfig.general.autostart !== newConfig.general.autostart) {
      setupAutostart(newConfig.general.autostart);
    }
    
    return newConfig;
  });

  ipcMain.handle('get-custom-themes', () => {
    return getConfigManager().listCustomThemes();
  });

  ipcMain.handle('load-custom-theme', (_event, themeName: string) => {
    return getConfigManager().loadCustomTheme(themeName);
  });

  ipcMain.handle('get-themes-directory', () => {
    return getConfigManager().getThemesDirectory();
  });

  ipcMain.handle('get-aria2-config', () => {
    return getAria2Config();
  });

  // Backend-related IPC handlers
  ipcMain.handle('get-backend-status', () => {
    return getBackendManager().getBackendStatus();
  });

  ipcMain.handle('get-available-backends', () => {
    return getBackendManager().getAvailableBackends();
  });

  ipcMain.handle('get-default-backend', () => {
    return getBackendManager().getDefaultBackend();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ipcMain.handle('add-download-with-backend', async (_event, backendId: string, url: string, options: any) => {
    try {
      const downloadId = await getBackendManager().addDownload(backendId as BackendType, url, options);
      return { success: true, downloadId };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[MAIN] Failed to add download:', error);
      return { success: false, error: error.message };
    }
  });

  // Download tracker IPC handlers
  ipcMain.handle('get-tracked-downloads', () => {
    return getDownloadTracker().getAllDownloads();
  });

  ipcMain.handle('remove-tracked-download', (_event, id: string, deleteFile: boolean) => {
    getDownloadTracker().removeDownload(id, deleteFile);
  });

  ipcMain.handle('check-file-exists', (_event, filePath: string) => {
    return fs.existsSync(filePath);
  });

  ipcMain.handle('delete-file', (_event, filePath: string) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (e) {
      console.error('[MAIN] Failed to delete file:', e);
      return false;
    }
  });

  ipcMain.handle('clear-completed-downloads', () => {
    getDownloadTracker().clearCompleted();
  });

  ipcMain.handle('show-notification', (_event, { title, body }) => {
    const config = getConfigManager().getConfig();
    if (config.general.notificationsEnabled !== false) {
      new Notification({ title, body }).show();
    }
  });

  ipcMain.on('window-minimize', () => {
    mainWindow?.hide();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('check-for-updates', async () => {
    try {
      // Manually trigger update check
      updateElectronApp({
        updateSource: {
          repo: 'cilginc/arialui',
          type: UpdateSourceType.ElectronPublicUpdateService
        },
        updateInterval: '10 minutes',
        notifyUser: true,
        logger: console
      });
      return { success: true, message: 'Update check initiated' };
    } catch (error) {
      console.error('[MAIN] Failed to check for updates:', error);
      return { success: false, message: 'Failed to check for updates' };
    }
  });

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  createWindow();
  createTray();

  // Register direct backend after window is created
  directBackend = new DirectBackend(mainWindow);
  backendManager.registerBackend(directBackend);

  // Start all backends
  await backendManager.start();

  // Send backend status updates every 10 seconds
  setInterval(() => {
    const status = backendManager.getBackendStatus();
    mainWindow?.webContents.send('backend-status-changed', status);
  }, 10000);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on('before-quit', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (app as any).isQuitting = true;
  });

  app.on('will-quit', async () => {
    await getBackendManager().stop();
  });

  app.on('window-all-closed', function () {
    // Do not quit on window close, as we have tray
    if (process.platform !== 'darwin') app.quit();
  });
  }); // End of app.whenReady().then()
} // End of else block (got the lock)


