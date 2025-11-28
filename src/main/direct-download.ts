import { BrowserWindow, DownloadItem, Event } from 'electron';
import { getConfigManager } from './config';
import { Backend, BackendHealth, BackendType, DownloadOptions } from './backend-manager';
import { getDownloadTracker, TrackedDownload } from './download-tracker';

export class DirectBackend implements Backend {
  public readonly id: BackendType = 'direct';
  public readonly name: string = 'Direct Download';
  
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow | null) {
    this.mainWindow = mainWindow;
  }

  public setMainWindow(mainWindow: BrowserWindow | null): void {
    this.mainWindow = mainWindow;
  }

  public isEnabled(): boolean {
    const config = getConfigManager().getConfig();
    return config.backends.direct.enabled;
  }

  public async start(): Promise<void> {
    console.log('[DirectBackend] Backend ready (using Electron download manager)');
  }

  public async stop(): Promise<void> {
    console.log('[DirectBackend] Backend stopped');
  }

  public async checkHealth(): Promise<BackendHealth> {
    const config = getConfigManager().getConfig();
    
    if (!config.backends.direct.enabled) {
      return 'disabled';
    }

    // Direct download is always healthy if enabled
    // since it uses Electron's built-in download manager
    return 'healthy';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async addDownload(url: string, options?: DownloadOptions): Promise<string> {
    if (!this.mainWindow) {
      throw new Error('Main window not available for direct download');
    }

    const config = getConfigManager().getConfig();
    const directConfig = config.backends.direct;

    return new Promise((resolve, reject) => {
      // Use Electron's download manager
      this.mainWindow!.webContents.downloadURL(url);

      // Listen for the download to start
      const downloadHandler = (event: Event, item: DownloadItem) => {
        const downloadId = `direct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Set download path
        const fileName = item.getFilename();
        const savePath = `${directConfig.downloadDir}/${fileName}`;
        item.setSavePath(savePath);

        console.log(`[DirectBackend] Download started: ${fileName} -> ${savePath}`);

        // Add to tracker
        const tracker = getDownloadTracker();
        const trackedDownload: TrackedDownload = {
          id: downloadId,
          url,
          filename: fileName,
          backend: 'direct',
          status: 'active',
          progress: 0,
          totalBytes: item.getTotalBytes(),
          downloadedBytes: 0,
          speed: 0,
          startTime: Date.now(),
          savePath,
        };
        tracker.addDownload(trackedDownload);

        // Speed calculation variables
        let lastBytes = 0;
        let lastTime = Date.now();

        item.on('updated', (event: Event, state: string) => {
          if (state === 'interrupted') {
            console.log('[DirectBackend] Download interrupted');
            tracker.updateDownload(downloadId, { status: 'error', error: 'Download interrupted', speed: 0 });
          } else if (state === 'progressing') {
            if (item.isPaused()) {
              console.log('[DirectBackend] Download paused');
              tracker.updateDownload(downloadId, { status: 'paused', speed: 0 });
            } else {
              const received = item.getReceivedBytes();
              const total = item.getTotalBytes();
              const percent = (received / total) * 100;
              
              // Calculate speed
              const now = Date.now();
              const timeDiff = now - lastTime;
              
              let speed = 0;
              // Calculate instantaneous speed if time difference is significant enough
              if (timeDiff > 0) {
                 const bytesDiff = received - lastBytes;
                 // bytes per millisecond * 1000 = bytes per second
                 speed = Math.floor((bytesDiff / timeDiff) * 1000);
              }
              
              // Only update reference points every 500ms to smooth out speed but keep it responsive
              if (timeDiff >= 500) {
                lastBytes = received;
                lastTime = now;
              }
              
              tracker.updateDownload(downloadId, {
                status: 'active',
                progress: percent,
                downloadedBytes: received,
                totalBytes: total,
                speed: speed
              });
            }
          }
        });

        item.once('done', (event: Event, state: string) => {
          if (state === 'completed') {
            console.log('[DirectBackend] Download completed successfully');
            tracker.updateDownload(downloadId, {
              status: 'complete',
              progress: 100,
              speed: 0,
              endTime: Date.now(),
            });
            resolve(downloadId);
          } else {
            console.log(`[DirectBackend] Download failed: ${state}`);
            tracker.updateDownload(downloadId, {
              status: 'error',
              error: `Download failed: ${state}`,
              speed: 0,
              endTime: Date.now(),
            });
            reject(new Error(`Download failed: ${state}`));
          }
        });

        // Remove listener after handling this download
        this.mainWindow!.webContents.session.removeListener('will-download', downloadHandler);
      };

      this.mainWindow!.webContents.session.once('will-download', downloadHandler);
    });
  }
}
