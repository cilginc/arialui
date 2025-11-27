import { getConfigManager } from './config';

export type BackendHealth = 'healthy' | 'unhealthy' | 'disabled' | 'checking';

export type BackendType = 'aria2' | 'wget2' | 'wget' | 'direct';

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

export interface Backend {
  readonly id: BackendType;
  readonly name: string;
  
  start(): Promise<void>;
  stop(): Promise<void>;
  checkHealth(): Promise<BackendHealth>;
  addDownload(url: string, options?: DownloadOptions): Promise<string>;
  isEnabled(): boolean;
}

export class BackendManager {
  private backends: Map<BackendType, Backend> = new Map();
  private healthStatus: Map<BackendType, BackendHealth> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Backends will be registered after initialization
  }

  public registerBackend(backend: Backend): void {
    this.backends.set(backend.id, backend);
    this.healthStatus.set(backend.id, backend.isEnabled() ? 'checking' : 'disabled');
  }

  public async start(): Promise<void> {
    console.log('[BackendManager] Starting backends...');
    
    // Start all enabled backends
    for (const backend of this.backends.values()) {
      if (backend.isEnabled()) {
        try {
          await backend.start();
          console.log(`[BackendManager] Started ${backend.name}`);
        } catch (error) {
          console.error(`[BackendManager] Failed to start ${backend.name}:`, error);
        }
      }
    }

    // Start health monitoring
    this.startHealthMonitoring();
    
    // Initial health check
    await this.checkAllHealth();
  }

  public async stop(): Promise<void> {
    console.log('[BackendManager] Stopping backends...');
    
    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Stop all backends
    for (const backend of this.backends.values()) {
      try {
        await backend.stop();
        console.log(`[BackendManager] Stopped ${backend.name}`);
      } catch (error) {
        console.error(`[BackendManager] Failed to stop ${backend.name}:`, error);
      }
    }
  }

  private startHealthMonitoring(): void {
    // Check health every 10 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.checkAllHealth();
    }, 10000);
  }

  private async checkAllHealth(): Promise<void> {
    for (const backend of this.backends.values()) {
      if (!backend.isEnabled()) {
        this.healthStatus.set(backend.id, 'disabled');
        continue;
      }

      try {
        const health = await backend.checkHealth();
        this.healthStatus.set(backend.id, health);
      } catch (error) {
        console.error(`[BackendManager] Health check failed for ${backend.name}:`, error);
        this.healthStatus.set(backend.id, 'unhealthy');
      }
    }
  }

  public getBackendStatus(): BackendStatus[] {
    const config = getConfigManager().getConfig();
    const statuses: BackendStatus[] = [];

    for (const [id, backend] of this.backends.entries()) {
      const health = this.healthStatus.get(id) || 'checking';
      const enabled = backend.isEnabled();
      
      let message = '';
      if (!enabled) {
        message = 'Backend is disabled';
      } else if (health === 'unhealthy') {
        message = 'Backend is not responding';
      } else if (health === 'healthy') {
        message = 'Backend is ready';
      }

      statuses.push({
        id,
        name: backend.name,
        health,
        enabled,
        message,
      });
    }

    return statuses;
  }

  public getAvailableBackends(): BackendStatus[] {
    return this.getBackendStatus().filter(
      (status) => status.enabled && status.health === 'healthy'
    );
  }

  public getDefaultBackend(): BackendType | null {
    const config = getConfigManager().getConfig();
    const defaultBackend = config.defaultBackend;

    // Check if default backend is available
    const defaultStatus = this.healthStatus.get(defaultBackend);
    const defaultBackendInstance = this.backends.get(defaultBackend);
    
    if (
      defaultBackendInstance?.isEnabled() &&
      defaultStatus === 'healthy'
    ) {
      return defaultBackend;
    }

    // Fallback to first available backend
    const priority: BackendType[] = ['aria2', 'wget2', 'wget', 'direct'];
    
    for (const backendId of priority) {
      const backend = this.backends.get(backendId);
      const health = this.healthStatus.get(backendId);
      
      if (backend?.isEnabled() && health === 'healthy') {
        return backendId;
      }
    }

    // Always return direct as ultimate fallback
    return 'direct';
  }

  public async addDownload(
    backendId: BackendType,
    url: string,
    options?: DownloadOptions
  ): Promise<string> {
    const backend = this.backends.get(backendId);
    
    if (!backend) {
      throw new Error(`Backend ${backendId} not found`);
    }

    if (!backend.isEnabled()) {
      throw new Error(`Backend ${backendId} is disabled`);
    }

    const health = this.healthStatus.get(backendId);
    if (health !== 'healthy') {
      throw new Error(`Backend ${backendId} is not healthy (status: ${health})`);
    }

    return await backend.addDownload(url, options);
  }

  public getBackend(backendId: BackendType): Backend | undefined {
    return this.backends.get(backendId);
  }
}

// Singleton instance
let backendManager: BackendManager | null = null;

export function getBackendManager(): BackendManager {
  if (!backendManager) {
    backendManager = new BackendManager();
  }
  return backendManager;
}
