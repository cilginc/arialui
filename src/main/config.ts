import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import * as TOML from '@iarna/toml';

export interface ThemeColors {
  background: string;
  foreground: string;
  secondary_background?: string;
  border: string;
  accent: string;
}

export interface ThemeAccents {
  blue: string;
  green: string;
  magenta: string;
  orange: string;
  purple: string;
  red: string;
  yellow: string;
  cyan: string;
}

export interface ThemeMeta {
  version: number;
  name: string;
  description: string;
  variant: 'dark' | 'light';
  icon?: string;
}

export interface CustomTheme {
  meta: ThemeMeta;
  colors: {
    core: ThemeColors;
    accents: ThemeAccents;
  };
}

export interface Aria2Config {
  enabled: boolean;
  port: number;
  secret: string;
  rpcListenAll: boolean;
  rpcAllowOriginAll: boolean;
  maxConcurrentDownloads: number;
  maxConnectionPerServer: number;
  minSplitSize: string;
  split: number;
  downloadDir: string;
}

export interface WgetConfig {
  enabled: boolean;
  maxConcurrentDownloads: number;
  maxConnectionPerServer: number;
  timeout: number;
  retries: number;
  downloadDir: string;
}

export interface Wget2Config {
  enabled: boolean;
  maxConcurrentDownloads: number;
  maxConnectionPerServer: number;
  timeout: number;
  retries: number;
  downloadDir: string;
}

export interface DirectConfig {
  enabled: boolean;
  downloadDir: string;
}

export interface BackendsConfig {
  aria2: Aria2Config;
  wget2: Wget2Config;
  wget: WgetConfig;
  direct: DirectConfig;
}

export interface AppConfig {
  version: number;
  theme: {
    mode: 'light' | 'dark' | 'system' | 'custom' | string;
    customThemeName?: string;
  };
  defaultBackend: 'aria2' | 'wget2' | 'wget' | 'direct';
  backends: BackendsConfig;
  // Legacy field for backward compatibility
  aria2?: Aria2Config;
  general: {
    downloadDirectory: string;
    startMinimized: boolean;
    closeBehavior: 'minimize-to-tray' | 'close';
    notificationsEnabled: boolean;
    autostart: boolean;
    autoUpdate: boolean;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  version: 2,
  theme: {
    mode: 'dark',
  },
  defaultBackend: 'aria2',
  backends: {
    aria2: {
      enabled: true,
      port: 6800,
      secret: 'arialui_secret_token',
      rpcListenAll: false,
      rpcAllowOriginAll: true,
      maxConcurrentDownloads: 5,
      maxConnectionPerServer: 5,
      minSplitSize: '10M',
      split: 5,
      downloadDir: path.join(app.getPath('downloads')),
    },
    wget2: {
      enabled: false,
      maxConcurrentDownloads: 3,
      maxConnectionPerServer: 5,
      timeout: 30,
      retries: 3,
      downloadDir: path.join(app.getPath('downloads')),
    },
    wget: {
      enabled: false,
      maxConcurrentDownloads: 3,
      maxConnectionPerServer: 4,
      timeout: 30,
      retries: 3,
      downloadDir: path.join(app.getPath('downloads')),
    },
    direct: {
      enabled: true,
      downloadDir: path.join(app.getPath('downloads')),
    },
  },
  general: {
    downloadDirectory: path.join(app.getPath('downloads')),
    startMinimized: false,
    closeBehavior: 'minimize-to-tray',
    notificationsEnabled: true,
    autostart: false,
    autoUpdate: true,
  },
};

class ConfigManager {
  private config: AppConfig;
  private configPath: string;
  private themesDir: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.configPath = path.join(userDataPath, 'config.toml');
    this.themesDir = path.join(userDataPath, 'themes');
    this.config = DEFAULT_CONFIG;
    
    // Ensure directories exist
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    if (!fs.existsSync(this.themesDir)) {
      fs.mkdirSync(this.themesDir, { recursive: true });
    }
  }

  public async load(): Promise<void> {
    try {
      if (fs.existsSync(this.configPath)) {
        const fileContent = fs.readFileSync(this.configPath, 'utf-8');
        let parsed = TOML.parse(fileContent) as unknown as AppConfig;
        
        // Migrate old config structure (version 1) to new structure (version 2)
        if (!parsed.version || parsed.version === 1) {
          console.log('Migrating configuration from v1 to v2...');
          parsed = this.migrateConfigToV2(parsed);
        }
        
        // Merge with defaults to handle any missing fields
        this.config = this.mergeWithDefaults(parsed);
        
        // Save migrated config
        if (!fs.existsSync(this.configPath) || parsed.version !== this.config.version) {
          await this.save();
          console.log('Configuration migrated and saved');
        }
        
        console.log('Configuration loaded from:', this.configPath);
      } else {
        // Create default config file
        await this.save();
        console.log('Created default configuration at:', this.configPath);
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      this.config = DEFAULT_CONFIG;
    }
  }

  public async save(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tomlString = TOML.stringify(this.config as any);
      const schemaHeader = '#:schema https://raw.githubusercontent.com/cilginc/arialui/main/config.schema.json\n';
      fs.writeFileSync(this.configPath, schemaHeader + tomlString, 'utf-8');
      console.log('Configuration saved to:', this.configPath);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw error;
    }
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<AppConfig>): void {
    this.config = this.deepMerge(this.config, updates);
  }

  public getThemesDirectory(): string {
    return this.themesDir;
  }

  public getConfigPath(): string {
    return this.configPath;
  }

  public loadCustomTheme(themeName: string): CustomTheme | null {
    try {
      // Check user data themes first
      let themePath = path.join(this.themesDir, `${themeName}.toml`);
      
      // If not found, check project themes (dev/bundled)
      if (!fs.existsSync(themePath)) {
        // In dev: src/main/../../themes -> themes
        // In prod: resources/themes (need to handle this if we bundle them)
        const projectThemes = path.join(__dirname, '../../themes');
        themePath = path.join(projectThemes, `${themeName}.toml`);
      }

      if (fs.existsSync(themePath)) {
        const fileContent = fs.readFileSync(themePath, 'utf-8');
        return TOML.parse(fileContent) as unknown as CustomTheme;
      }
      return null;
    } catch (error) {
      console.error(`Failed to load theme ${themeName}:`, error);
      return null;
    }
  }

  public listCustomThemes(): string[] {
    try {
      const themes = new Set<string>();

      // User data themes
      if (fs.existsSync(this.themesDir)) {
        const files = fs.readdirSync(this.themesDir);
        files
          .filter(file => file.endsWith('.toml'))
          .forEach(file => themes.add(path.basename(file, '.toml')));
      }

      // Project themes
      const projectThemes = path.join(__dirname, '../../themes');
      if (fs.existsSync(projectThemes)) {
        const files = fs.readdirSync(projectThemes);
        files
          .filter(file => file.endsWith('.toml'))
          .forEach(file => themes.add(path.basename(file, '.toml')));
      }

      return Array.from(themes);
    } catch (error) {
      console.error('Failed to list custom themes:', error);
      return [];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private migrateConfigToV2(oldConfig: any): AppConfig {
    // If old config has aria2 at root level, migrate to backends structure
    if (oldConfig.aria2 && !oldConfig.backends) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const migratedConfig: any = {
        ...oldConfig,
        version: 2,
        defaultBackend: 'aria2',
        backends: {
          aria2: {
            enabled: true,
            ...oldConfig.aria2,
          },
          wget2: DEFAULT_CONFIG.backends.wget2,
          wget: DEFAULT_CONFIG.backends.wget,
          direct: DEFAULT_CONFIG.backends.direct,
        },
      };
      // Remove old aria2 field
      delete migratedConfig.aria2;
      return migratedConfig as AppConfig;
    }
    return oldConfig as AppConfig;
  }

  private mergeWithDefaults(config: Partial<AppConfig>): AppConfig {
    return this.deepMerge(DEFAULT_CONFIG, config) as AppConfig;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        result[key] = this.deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}

// Singleton instance
let configManager: ConfigManager | null = null;

export function getConfigManager(): ConfigManager {
  if (!configManager) {
    configManager = new ConfigManager();
  }
  return configManager;
}

export function initializeConfig(): Promise<void> {
  const manager = getConfigManager();
  return manager.load();
}
