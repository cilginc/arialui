import { spawn, ChildProcess } from 'child_process';
import { getConfigManager } from './config';
import { Backend, BackendHealth, BackendType, DownloadOptions } from './backend-manager';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getDownloadTracker, TrackedDownload } from './download-tracker';
import * as path from 'path';

const execAsync = promisify(exec);

export class Wget2Backend implements Backend {
  public readonly id: BackendType = 'wget2';
  public readonly name: string = 'Wget2';

  public isEnabled(): boolean {
    const config = getConfigManager().getConfig();
    return config.backends.wget2.enabled;
  }

  public async start(): Promise<void> {
    // wget2 doesn't need to be "started" like aria2
    // It's executed per-download
    console.log('[Wget2Backend] Backend ready (no daemon required)');
  }

  public async stop(): Promise<void> {
    // Nothing to stop
    console.log('[Wget2Backend] Backend stopped (no daemon to stop)');
  }

  public async checkHealth(): Promise<BackendHealth> {
    const config = getConfigManager().getConfig();
    
    if (!config.backends.wget2.enabled) {
      return 'disabled';
    }

    try {
      // Check if wget2 is available in PATH
      await execAsync('wget2 --version');
      return 'healthy';
    } catch (error) {
      console.error('[Wget2Backend] wget2 not found in PATH:', error);
      return 'unhealthy';
    }
  }

  public async addDownload(url: string, options?: DownloadOptions): Promise<string> {
    const config = getConfigManager().getConfig();
    const wget2Config = config.backends.wget2;

    // Generate a unique download ID
    const downloadId = `wget2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Try to extract filename from URL
    let filename = 'unknown';
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const extracted = pathname.split('/').pop();
      if (extracted) {
        filename = extracted;
      }
    } catch (e) {
      // Invalid URL, keep default
    }

    // Ensure download directory is decoded (in case it comes from a file:// URI)
    const downloadDir = decodeURIComponent(wget2Config.downloadDir);
    const savePath = path.join(downloadDir, filename);

    const args = [
      url,
      `--output-document=${savePath}`,
      `--timeout=${wget2Config.timeout}`,
      `--tries=${wget2Config.retries}`,
      `--max-threads=${wget2Config.maxConnectionPerServer}`,
      `--progress=bar`, // Ensure we get progress output
      `--force-progress`,
    ];

    // Add cookies if provided
    if (options?.cookies) {
      args.push(`--header=Cookie: ${options.cookies}`);
    }

    // Add user agent if provided
    if (options?.userAgent) {
      args.push(`--user-agent=${options.userAgent}`);
    }

    // Add referrer if provided
    if (options?.referrer) {
      args.push(`--referer=${options.referrer}`);
    }

    console.log(`[Wget2Backend] Starting download: wget2 ${args.join(' ')}`);

    // Initialize tracking
    const tracker = getDownloadTracker();
    const trackedDownload: TrackedDownload = {
      id: downloadId,
      url,
      filename,
      backend: 'wget2',
      status: 'active',
      progress: 0,
      totalBytes: 0,
      downloadedBytes: 0,
      speed: 0,
      startTime: Date.now(),
      savePath,
    };
    tracker.addDownload(trackedDownload);

    // Spawn wget2 process
    const process = spawn('wget2', args);

    // Wget2 writes progress to stdout (based on user logs)
    // Output format: 100MB.bin             98% [===================> ]   98.81M    3.32MB/s
    process.stdout?.on('data', (data) => {
      const output = data.toString();
      
      // Split by carriage return or newline to handle progress bar updates
      const lines = output.split(/[\r\n]+/);
      
      for (let i = lines.length - 1; i >= 0; i--) {
        let line = lines[i];
        if (!line) continue;

        // Strip ANSI escape codes
        // eslint-disable-next-line no-control-regex
        line = line.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
        line = line.replace(/\u001b[78]/g, ''); // Strip save/restore cursor codes
        line = line.trim();

        if (!line) continue;

        // Parse progress from cleaned line
        const percentMatch = line.match(/(\d+)%/);
        
        if (percentMatch) {
          const percent = parseInt(percentMatch[1]);
          
          // Try to parse speed
          // Matches: 3.32MB/s
          let speed = 0;
          const speedMatch = line.match(/([0-9.]+)([KMG])B\/s/i);
          if (speedMatch) {
            const val = parseFloat(speedMatch[1]);
            const unit = speedMatch[2].toUpperCase();
            if (unit === 'K') speed = val * 1024;
            else if (unit === 'M') speed = val * 1024 * 1024;
            else if (unit === 'G') speed = val * 1024 * 1024 * 1024;
          }

          // Try to parse downloaded amount
          // We only look AFTER the percent match to avoid matching filename (e.g. 100MB.bin)
          // The format is usually: Filename ... 98% ... 98.81M ...
          let downloadedBytes = 0;
          
          // Get the part of the line after the percent
          const afterPercent = line.substring(percentMatch.index! + percentMatch[0].length);
          
          // Look for number + unit that is NOT followed by B/s
          // Use \b to ensure we don't match MB inside MB/s if the lookahead fails for some reason,
          // but mainly to match "98.81M" where M is followed by space.
          const sizeMatches = afterPercent.matchAll(/([0-9.]+)([KMG])(?!\s*B\/s)/gi);
          
          for (const match of sizeMatches) {
             const val = parseFloat(match[1]);
             const unit = match[2].toUpperCase();
             let bytes = 0;
             if (unit === 'K') bytes = val * 1024;
             else if (unit === 'M') bytes = val * 1024 * 1024;
             else if (unit === 'G') bytes = val * 1024 * 1024 * 1024;
             
             downloadedBytes = bytes;
             // The first one we find after percent is the downloaded amount
             break; 
          }

          // Calculate total bytes if we have percent and it's > 0
          let totalBytes = 0;
          if (percent > 0 && downloadedBytes > 0) {
            totalBytes = Math.floor(downloadedBytes / (percent / 100));
          }

          tracker.updateDownload(downloadId, {
            progress: percent,
            speed: speed,
            downloadedBytes: downloadedBytes,
            totalBytes: totalBytes,
            status: 'active'
          });
          
          break;
        }
      }
    });

    process.stderr?.on('data', (data) => {
      // Log stderr for errors, but don't parse progress from it anymore
      // console.error(`[Wget2Backend] stderr: ${data}`);
    });

    process.on('close', (code) => {
      console.log(`[Wget2Backend] Download completed with code ${code}`);
      if (code === 0) {
        tracker.updateDownload(downloadId, {
          status: 'complete',
          progress: 100,
          speed: 0,
          endTime: Date.now()
        });
      } else {
        tracker.updateDownload(downloadId, {
          status: 'error',
          error: `Process exited with code ${code}`,
          speed: 0,
          endTime: Date.now()
        });
      }
    });

    process.on('error', (err) => {
      console.error('[Wget2Backend] Download error:', err);
      tracker.updateDownload(downloadId, {
        status: 'error',
        error: err.message,
        speed: 0,
        endTime: Date.now()
      });
    });

    return downloadId;
  }
}
