import { spawn, ChildProcess } from 'child_process';
import { getConfigManager } from './config';
import { Backend, BackendHealth, BackendType, DownloadOptions } from './backend-manager';
import { exec } from 'child_process';
import { promisify } from 'util';

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

    const args = [
      url,
      `-P`, wget2Config.downloadDir,
      `--timeout=${wget2Config.timeout}`,
      `--tries=${wget2Config.retries}`,
      `--max-threads=${wget2Config.maxConnectionPerServer}`,
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

    // Spawn wget2 process
    const process = spawn('wget2', args);

    process.stdout?.on('data', (data) => {
      console.log(`[Wget2Backend] ${data}`);
    });

    process.stderr?.on('data', (data) => {
      console.error(`[Wget2Backend] ${data}`);
    });

    process.on('close', (code) => {
      console.log(`[Wget2Backend] Download completed with code ${code}`);
    });

    process.on('error', (err) => {
      console.error('[Wget2Backend] Download error:', err);
    });

    // Return a unique download ID (using timestamp + random)
    const downloadId = `wget2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return downloadId;
  }
}
