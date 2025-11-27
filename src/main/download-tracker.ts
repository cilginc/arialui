import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

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

class DownloadTracker {
  private downloads: Map<string, TrackedDownload> = new Map();
  private downloadsPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.downloadsPath = path.join(userDataPath, 'downloads.json');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.downloadsPath)) {
        const data = fs.readFileSync(this.downloadsPath, 'utf-8');
        const downloads = JSON.parse(data);
        this.downloads = new Map(Object.entries(downloads));
        console.log(`[DownloadTracker] Loaded ${this.downloads.size} downloads`);
      }
    } catch (error) {
      console.error('[DownloadTracker] Failed to load downloads:', error);
    }
  }

  private save(): void {
    try {
      const obj = Object.fromEntries(this.downloads);
      fs.writeFileSync(this.downloadsPath, JSON.stringify(obj, null, 2));
    } catch (error) {
      console.error('[DownloadTracker] Failed to save downloads:', error);
    }
  }

  public addDownload(download: TrackedDownload): void {
    this.downloads.set(download.id, download);
    this.save();
    console.log(`[DownloadTracker] Added download: ${download.id} (${download.backend})`);
  }

  public updateDownload(id: string, updates: Partial<TrackedDownload>): void {
    const download = this.downloads.get(id);
    if (download) {
      Object.assign(download, updates);
      this.save();
    }
  }

  public getDownload(id: string): TrackedDownload | undefined {
    return this.downloads.get(id);
  }

  public getAllDownloads(): TrackedDownload[] {
    return Array.from(this.downloads.values());
  }

  public getDownloadsByBackend(backend: string): TrackedDownload[] {
    return Array.from(this.downloads.values()).filter(d => d.backend === backend);
  }

  public removeDownload(id: string): void {
    this.downloads.delete(id);
    this.save();
    console.log(`[DownloadTracker] Removed download: ${id}`);
  }

  public clearCompleted(): void {
    const completed = Array.from(this.downloads.values())
      .filter(d => d.status === 'complete' || d.status === 'error');
    
    completed.forEach(d => this.downloads.delete(d.id));
    this.save();
    console.log(`[DownloadTracker] Cleared ${completed.length} completed downloads`);
  }
}

let tracker: DownloadTracker | null = null;

export function getDownloadTracker(): DownloadTracker {
  if (!tracker) {
    tracker = new DownloadTracker();
  }
  return tracker;
}
