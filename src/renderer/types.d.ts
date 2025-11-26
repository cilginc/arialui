import type { AppConfig, CustomTheme } from '../main/config';

export interface IElectronAPI {
  getAria2Config: () => Promise<{ port: number; secret: string }>;
  onShowAddDownloadDialog: (callback: (url: string) => void) => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  // Configuration methods
  getConfig: () => Promise<AppConfig>;
  updateConfig: (updates: Partial<AppConfig>) => Promise<AppConfig>;
  getCustomThemes: () => Promise<string[]>;
  loadCustomTheme: (themeName: string) => Promise<CustomTheme | null>;
  getThemesDirectory: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
