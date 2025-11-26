export interface IElectronAPI {
  getAria2Config: () => Promise<{ port: number; secret: string }>;
  onShowAddDownloadDialog: (callback: (url: string) => void) => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
