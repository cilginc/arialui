import type { AppConfig, CustomTheme } from '../main/config';

export type BackendType = 'aria2' | 'wget2' | 'wget' | 'direct';
export type BackendHealth = 'healthy' | 'unhealthy' | 'disabled' | 'checking';

export interface BackendStatus {
  id: BackendType;
  name: string;
  health: BackendHealth;
  enabled: boolean;
  message?: string;
}

export interface DownloadOptions {
  cookies?: string;
  userAgent?: string;
  referrer?: string;
}

export interface TrackedDownload {
  id: string;
  url: string;
  filename: string;
  backend: 'aria2' | 'wget2' | 'wget' | 'direct';
  status: 'active' | 'paused' | 'complete' | 'error' | 'waiting';
  progress: number;
  totalBytes: number;
  downloadedBytes: number;
  speed: number;
  startTime: number;
  endTime?: number;
  error?: string;
  savePath?: string;
}

export interface IElectronAPI {
  getAria2Config: () => Promise<{ port: number; secret: string }>;
  onShowAddDownloadDialog: (callback: (data: { 
    url: string; 
    filename?: string; 
    referrer?: string; 
    cookies?: string; 
    userAgent?: string;
    backend?: string;
  }) => void) => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  
  // Configuration methods
  getConfig: () => Promise<AppConfig>;
  updateConfig: (updates: Partial<AppConfig>) => Promise<AppConfig>;
  getCustomThemes: () => Promise<string[]>;
  loadCustomTheme: (themeName: string) => Promise<CustomTheme | null>;
  getThemesDirectory: () => Promise<string>;
  
  // Backend methods
  getBackendStatus: () => Promise<BackendStatus[]>;
  getAvailableBackends: () => Promise<BackendStatus[]>;
  getDefaultBackend: () => Promise<BackendType | null>;
  addDownloadWithBackend: (
    backendId: BackendType, 
    url: string, 
    options?: DownloadOptions
  ) => Promise<{ success: boolean; downloadId?: string; error?: string }>;
  onBackendStatusChanged: (callback: (status: BackendStatus[]) => void) => void;
  
  // Download tracker methods
  getTrackedDownloads: () => Promise<TrackedDownload[]>;
  removeTrackedDownload: (id: string, deleteFile?: boolean) => Promise<void>;
  clearCompletedDownloads: () => Promise<void>;
  
  // File system methods
  checkFileExists: (path: string) => Promise<boolean>;
  deleteFile: (path: string) => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
