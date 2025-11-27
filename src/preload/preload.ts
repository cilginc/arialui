import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAria2Config: () => ipcRenderer.invoke('get-aria2-config'),
  onShowAddDownloadDialog: (callback: (data: { url: string; filename?: string; referrer?: string; cookies?: string; userAgent?: string }) => void) => {
    ipcRenderer.on('show-add-download-dialog', (_event, data) => callback(data));
  },
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  // Configuration methods
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (updates: any) => ipcRenderer.invoke('update-config', updates),
  getCustomThemes: () => ipcRenderer.invoke('get-custom-themes'),
  loadCustomTheme: (themeName: string) => ipcRenderer.invoke('load-custom-theme', themeName),
  getThemesDirectory: () => ipcRenderer.invoke('get-themes-directory'),
});
