import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAria2Config: () => ipcRenderer.invoke('get-aria2-config'),
  onShowAddDownloadDialog: (callback: (data: { url: string; filename?: string; referrer?: string; cookies?: string; userAgent?: string; backend?: string }) => void) => {
    // Remove any existing listeners first to prevent duplicates
    ipcRenderer.removeAllListeners('show-add-download-dialog');
    // Use 'on' but with proper cleanup
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
  // Backend methods
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
  getAvailableBackends: () => ipcRenderer.invoke('get-available-backends'),
  getDefaultBackend: () => ipcRenderer.invoke('get-default-backend'),
  addDownloadWithBackend: (backendId: string, url: string, options?: any) => 
    ipcRenderer.invoke('add-download-with-backend', backendId, url, options),
  onBackendStatusChanged: (callback: (status: any[]) => void) => {
    ipcRenderer.removeAllListeners('backend-status-changed');
    ipcRenderer.on('backend-status-changed', (_event, status) => callback(status));
  },
  // Download tracker methods
  getTrackedDownloads: () => ipcRenderer.invoke('get-tracked-downloads'),
  removeTrackedDownload: (id: string) => ipcRenderer.invoke('remove-tracked-download', id),
  clearCompletedDownloads: () => ipcRenderer.invoke('clear-completed-downloads'),
});
