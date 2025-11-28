import { spawn } from 'child_process';
import { getConfigManager } from './config';
import { Backend, BackendHealth, BackendType, DownloadOptions } from './backend-manager';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class WgetBackend implements Backend {
  public readonly id: BackendType = 'wget';
  public readonly name: string = 'Wget';

  public isEnabled(): boolean {
    const config = getConfigManager().getConfig();
    return config.backends.wget.enabled;
  }

  public async start(): Promise<void> {
    // wget doesn't need to be "started" like aria2
    // It's executed per-download
    console.log('[WgetBackend] Backend ready (no daemon required)');
  }

  public async stop(): Promise<void> {
    // Nothing to stop
    console.log('[WgetBackend] Backend stopped (no daemon to stop)');
  }

  public async checkHealth(): Promise<BackendHealth> {
    const config = getConfigManager().getConfig();
    
    if (!config.backends.wget.enabled) {
      return 'disabled';
    }

    try {
      // Check if wget is available in PATH
      await execAsync('wget --version');
      return 'healthy';
    } catch (error) {
      console.error('[WgetBackend] wget not found in PATH:', error);
      return 'unhealthy';
    }
  }

  public async addDownload(url: string, options?: DownloadOptions): Promise<string> {
    const config = getConfigManager().getConfig();
    const wgetConfig = config.backends.wget;

    const args = [
      url,
      `-P`, wgetConfig.downloadDir,
      `--timeout=${wgetConfig.timeout}`,
      `--tries=${wgetConfig.retries}`,
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

    console.log(`[WgetBackend] Starting download: wget ${args.join(' ')}`);

    // Spawn wget process
    const process = spawn('wget', args);

    process.stdout?.on('data', (data) => {
      console.log(`[WgetBackend] ${data}`);
    });

    process.stderr?.on('data', (data) => {
      // wget outputs progress to stderr
      console.log(`[WgetBackend] ${data}`);
    });

    process.on('close', (code) => {
      console.log(`[WgetBackend] Download completed with code ${code}`);
    });

    process.on('error', (err) => {
      console.error('[WgetBackend] Download error:', err);
    });

    // Return a unique download ID (using timestamp + random)
    const downloadId = `wget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return downloadId;
  }
}
