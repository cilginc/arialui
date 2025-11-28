import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import { getConfigManager } from './config';
import { Backend, BackendHealth, BackendType, DownloadOptions } from './backend-manager';

export class Aria2Backend implements Backend {
  public readonly id: BackendType = 'aria2';
  public readonly name: string = 'Aria2';
  
  private process: ChildProcess | null = null;

  public isEnabled(): boolean {
    const config = getConfigManager().getConfig();
    return config.backends.aria2.enabled;
  }

  public async start(): Promise<void> {
    if (this.process) {
      console.log('[Aria2Backend] Already running');
      return;
    }

    const config = getConfigManager().getConfig();
    const aria2Config = config.backends.aria2;

    if (!aria2Config.enabled) {
      console.log('[Aria2Backend] Disabled, skipping start');
      return;
    }

    const aria2Path = 'aria2c'; // Assuming in PATH

    const args = [
      '--enable-rpc',
      `--rpc-listen-port=${aria2Config.port}`,
      `--rpc-listen-all=${aria2Config.rpcListenAll}`,
      aria2Config.rpcAllowOriginAll ? '--rpc-allow-origin-all' : '',
      `--rpc-secret=${aria2Config.secret}`,
      `--dir=${aria2Config.downloadDir}`,
      `--max-concurrent-downloads=${aria2Config.maxConcurrentDownloads}`,
      `--max-connection-per-server=${aria2Config.maxConnectionPerServer}`,
      `--min-split-size=${aria2Config.minSplitSize}`,
      `--split=${aria2Config.split}`,
      '--quiet=true',
    ].filter(arg => arg !== '');

    console.log(`[Aria2Backend] Spawning: ${aria2Path} ${args.join(' ')}`);

    this.process = spawn(aria2Path, args);

    this.process.stdout?.on('data', (data) => {
      console.log(`[Aria2Backend] stdout: ${data}`);
    });

    this.process.stderr?.on('data', (data) => {
      console.error(`[Aria2Backend] stderr: ${data}`);
    });

    this.process.on('close', (code) => {
      console.log(`[Aria2Backend] Process exited with code ${code}`);
      this.process = null;
    });

    this.process.on('error', (err) => {
      console.error('[Aria2Backend] Failed to start:', err);
      this.process = null;
    });

    // Wait a bit for aria2 to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  public async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  public async checkHealth(): Promise<BackendHealth> {
    const config = getConfigManager().getConfig();
    const aria2Config = config.backends.aria2;

    if (!aria2Config.enabled) {
      return 'disabled';
    }

    // Try to connect to aria2 RPC
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        jsonrpc: '2.0',
        id: 'health-check',
        method: 'aria2.getVersion',
        params: [`token:${aria2Config.secret}`],
      });

      const options = {
        hostname: 'localhost',
        port: aria2Config.port,
        path: '/jsonrpc',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 2000,
      };

      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          resolve('healthy');
        } else {
          resolve('unhealthy');
        }
      });

      req.on('error', () => {
        resolve('unhealthy');
      });

      req.on('timeout', () => {
        req.destroy();
        resolve('unhealthy');
      });

      req.write(postData);
      req.end();
    });
  }

  public async addDownload(url: string, options?: DownloadOptions): Promise<string> {
    const config = getConfigManager().getConfig();
    const aria2Config = config.backends.aria2;

    const aria2Options: Record<string, string | string[]> = {};
    
    if (options?.cookies) {
      aria2Options.header = [`Cookie: ${options.cookies}`];
    }
    
    if (options?.userAgent) {
      aria2Options['user-agent'] = options.userAgent;
    }

    if (options?.referrer) {
      if (!aria2Options.header) {
        aria2Options.header = [];
      }
      (aria2Options.header as string[]).push(`Referer: ${options.referrer}`);
    }

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        jsonrpc: '2.0',
        id: 'addUri',
        method: 'aria2.addUri',
        params: [`token:${aria2Config.secret}`, [url], aria2Options],
      });

      const reqOptions = {
        hostname: 'localhost',
        port: aria2Config.port,
        path: '/jsonrpc',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = http.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.result) {
              resolve(response.result);
            } else {
              reject(new Error(response.error?.message || 'Failed to add download'));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(postData);
      req.end();
    });
  }
}

// Legacy exports for compatibility
let legacyBackend: Aria2Backend | null = null;

export function startAria2() {
  if (!legacyBackend) {
    legacyBackend = new Aria2Backend();
  }
  return legacyBackend.start();
}

export function stopAria2() {
  if (legacyBackend) {
    return legacyBackend.stop();
  }
}

export function getAria2Config() {
  const config = getConfigManager().getConfig();
  return {
    port: config.backends.aria2.port,
    secret: config.backends.aria2.secret,
  };
}
