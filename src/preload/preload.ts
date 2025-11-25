import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAria2Config: () => ipcRenderer.invoke('get-aria2-config'),
  onShowAddDownloadDialog: (callback: (url: string) => void) => {
    ipcRenderer.on('show-add-download-dialog', (_event, url) => callback(url));
  }
});
