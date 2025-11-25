export interface IElectronAPI {
  getAria2Config: () => Promise<{ port: number; secret: string }>;
  onShowAddDownloadDialog: (callback: (url: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
