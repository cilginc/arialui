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

export interface AppConfig {
  version: number;
  theme: {
    mode: 'light' | 'dark' | 'system' | 'custom' | string;
    customThemeName?: string;
  };
  aria2: Aria2Config;
  general: {
    downloadDirectory: string;
    startMinimized: boolean;
    closeToTray: boolean;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  version: 1,
  theme: {
    mode: 'dark',
  },
  aria2: {
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
  general: {
    downloadDirectory: path.join(app.getPath('downloads')),
    startMinimized: false,
    closeToTray: true,
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
        const parsed = TOML.parse(fileContent) as unknown as AppConfig;
        
        // Merge with defaults to handle any missing fields
        this.config = this.mergeWithDefaults(parsed);
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
      const tomlString = TOML.stringify(this.config as any);
      fs.writeFileSync(this.configPath, tomlString, 'utf-8');
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

  private mergeWithDefaults(config: Partial<AppConfig>): AppConfig {
    return this.deepMerge(DEFAULT_CONFIG, config) as AppConfig;
  }

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
