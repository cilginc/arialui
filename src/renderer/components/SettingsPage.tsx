import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';
import type { AppConfig } from '../../main/config';
import type { BackendStatus } from '../types.d';
import { Check, AlertCircle } from 'lucide-react';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus[]>([]);
  
  // Aria2 settings
  const [aria2Enabled, setAria2Enabled] = useState(true);
  const [aria2Port, setAria2Port] = useState('6800');
  const [aria2Secret, setAria2Secret] = useState('');
  const [aria2DownloadDir, setAria2DownloadDir] = useState('');
  const [aria2MaxConnections, setAria2MaxConnections] = useState('5');
  const [aria2MaxConcurrent, setAria2MaxConcurrent] = useState('5');
  const [aria2MinSplitSize, setAria2MinSplitSize] = useState('10M');
  const [aria2Split, setAria2Split] = useState('5');
  
  // Wget2 settings
  const [wget2Enabled, setWget2Enabled] = useState(false);
  const [wget2MaxConcurrent, setWget2MaxConcurrent] = useState('3');
  const [wget2MaxConnections, setWget2MaxConnections] = useState('5');
  const [wget2Timeout, setWget2Timeout] = useState('30');
  const [wget2Retries, setWget2Retries] = useState('3');
  const [wget2DownloadDir, setWget2DownloadDir] = useState('');
  
  // Wget settings
  const [wgetEnabled, setWgetEnabled] = useState(false);
  const [wgetMaxConcurrent, setWgetMaxConcurrent] = useState('3');
  const [wgetMaxConnections, setWgetMaxConnections] = useState('4');
  const [wgetTimeout, setWgetTimeout] = useState('30');
  const [wgetRetries, setWgetRetries] = useState('3');
  const [wgetDownloadDir, setWgetDownloadDir] = useState('');
  
  // Direct download settings
  const [directEnabled, setDirectEnabled] = useState(true);
  const [directDownloadDir, setDirectDownloadDir] = useState('');
  
  // General settings
  const [defaultBackend, setDefaultBackend] = useState<'aria2' | 'wget2' | 'wget' | 'direct'>('aria2');
  const [downloadDirectory, setDownloadDirectory] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [customThemes, setCustomThemes] = useState<string[]>([]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [cfg, status] = await Promise.all([
          window.electronAPI.getConfig(),
          window.electronAPI.getBackendStatus()
        ]);
        
        setConfig(cfg);
        setBackendStatus(status);
        
        // Load backend settings
        setAria2Enabled(cfg.backends.aria2.enabled);
        setAria2Port(cfg.backends.aria2.port.toString());
        setAria2Secret(cfg.backends.aria2.secret);
        setAria2DownloadDir(cfg.backends.aria2.downloadDir);
        setAria2MaxConnections(cfg.backends.aria2.maxConnectionPerServer.toString());
        setAria2MaxConcurrent(cfg.backends.aria2.maxConcurrentDownloads.toString());
        setAria2MinSplitSize(cfg.backends.aria2.minSplitSize);
        setAria2Split(cfg.backends.aria2.split.toString());
        
        setWget2Enabled(cfg.backends.wget2.enabled);
        setWget2MaxConcurrent(cfg.backends.wget2.maxConcurrentDownloads.toString());
        setWget2MaxConnections(cfg.backends.wget2.maxConnectionPerServer.toString());
        setWget2Timeout(cfg.backends.wget2.timeout.toString());
        setWget2Retries(cfg.backends.wget2.retries.toString());
        setWget2DownloadDir(cfg.backends.wget2.downloadDir);
        
        setWgetEnabled(cfg.backends.wget.enabled);
        setWgetMaxConcurrent(cfg.backends.wget.maxConcurrentDownloads.toString());
        setWgetMaxConnections(cfg.backends.wget.maxConnectionPerServer.toString());
        setWgetTimeout(cfg.backends.wget.timeout.toString());
        setWgetRetries(cfg.backends.wget.retries.toString());
        setWgetDownloadDir(cfg.backends.wget.downloadDir);
        
        setDirectEnabled(cfg.backends.direct.enabled);
        setDirectDownloadDir(cfg.backends.direct.downloadDir);
        
        setDefaultBackend(cfg.defaultBackend);
        setDownloadDirectory(cfg.general.downloadDirectory);
        setNotificationsEnabled(cfg.general.notificationsEnabled ?? true);

        // Load custom themes
        const themes = await window.electronAPI.getCustomThemes();
        setCustomThemes(themes);
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    };
    loadConfig();

    // Subscribe to backend status updates
    window.electronAPI.onBackendStatusChanged((status) => {
      setBackendStatus(status);
    });
  }, []);

  const handleSaveSettings = async () => {
    if (!config) return;

    setIsSaving(true);
    setSaveMessage('');

    try {
      const updates: Partial<AppConfig> = {
        defaultBackend,
        backends: {
          aria2: {
            ...config.backends.aria2,
            enabled: aria2Enabled,
            port: parseInt(aria2Port, 10),
            secret: aria2Secret,
            downloadDir: aria2DownloadDir,
            maxConnectionPerServer: parseInt(aria2MaxConnections, 10),
            maxConcurrentDownloads: parseInt(aria2MaxConcurrent, 10),
            minSplitSize: aria2MinSplitSize,
            split: parseInt(aria2Split, 10),
          },
          wget2: {
            ...config.backends.wget2,
            enabled: wget2Enabled,
            maxConcurrentDownloads: parseInt(wget2MaxConcurrent, 10),
            maxConnectionPerServer: parseInt(wget2MaxConnections, 10),
            timeout: parseInt(wget2Timeout, 10),
            retries: parseInt(wget2Retries, 10),
            downloadDir: wget2DownloadDir,
          },
          wget: {
            ...config.backends.wget,
            enabled: wgetEnabled,
            maxConcurrentDownloads: parseInt(wgetMaxConcurrent, 10),
            maxConnectionPerServer: parseInt(wgetMaxConnections, 10),
            timeout: parseInt(wgetTimeout, 10),
            retries: parseInt(wgetRetries, 10),
            downloadDir: wgetDownloadDir,
          },
          direct: {
            enabled: directEnabled,
            downloadDir: directDownloadDir,
          },
        },
        general: {
          ...config.general,
          downloadDirectory,
          notificationsEnabled,
        },
      };

      const newConfig = await window.electronAPI.updateConfig(updates);
      setConfig(newConfig);
      setSaveMessage('Settings saved successfully! Backend changes applied.');
      
      // Reload backend status immediately after saving
      const status = await window.electronAPI.getBackendStatus();
      setBackendStatus(status);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
    ...customThemes.map(name => ({
      value: name,
      label: name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }))
  ];

  const getBackendHealthStatus = (backendId: string) => {
    const backend = backendStatus.find(b => b.id === backendId);
    return backend?.health || 'checking';
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-500';
      case 'unhealthy': return 'text-red-500';
      case 'checking': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  // Get enabled backends for default backend selector
  const enabledBackends = [
    { id: 'aria2', name: 'Aria2', enabled: aria2Enabled },
    { id: 'wget2', name: 'Wget2', enabled: wget2Enabled },
    { id: 'wget', name: 'Wget', enabled: wgetEnabled },
    { id: 'direct', name: 'Direct Download', enabled: directEnabled },
  ].filter(b => b.enabled);

  return (
    <div className="p-6 space-y-6 overflow-y-auto flex-1">
      <h2 className="text-2xl font-bold">Settings</h2>

      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Theme</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {themeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={theme === option.value ? 'default' : 'outline'}
                  onClick={() => setTheme(option.value as any)}
                  className="relative"
                >
                  {theme === option.value && (
                    <Check size={16} className="absolute left-2" />
                  )}
                  <span className={theme === option.value ? 'ml-4' : ''}>
                    {option.label}
                  </span>
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              You can add custom themes by placing .toml files in the themes directory
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle>Default Backend</CardTitle>
          <CardDescription>Select which backend to use by default for new downloads.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="default-backend">Default Download Backend</Label>
            <select
              id="default-backend"
              value={defaultBackend}
              onChange={(e) => setDefaultBackend(e.target.value as any)}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {enabledBackends.map((backend) => (
                <option key={backend.id} value={backend.id}>
                  {backend.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              {enabledBackends.length === 0 ? (
                <span className="text-yellow-500">⚠️ No backends enabled! Please enable at least one backend.</span>
              ) : (
                'If the default backend is unavailable, the system will automatically fall back to the next available backend.'
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Configure general application settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="download-dir">Default Download Directory</Label>
            <div className="flex gap-2">
              <Input
                id="download-dir"
                value={downloadDirectory}
                onChange={(e) => setDownloadDirectory(e.target.value)}
                className="bg-secondary/50"
              />
              <Button variant="outline" disabled>Browse</Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notifications-enabled"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="notifications-enabled">Enable System Notifications</Label>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Aria2 Backend</CardTitle>
              <CardDescription>Configure aria2 download engine settings.</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium ${getHealthColor(getBackendHealthStatus('aria2'))}`}>
                Status: {getBackendHealthStatus('aria2')}
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aria2Enabled}
                  onChange={(e) => setAria2Enabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Enabled</span>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="aria2-port">RPC Port</Label>
              <Input
                id="aria2-port"
                type="number"
                value={aria2Port}
                onChange={(e) => setAria2Port(e.target.value)}
                className="bg-secondary/50"
                disabled={!aria2Enabled}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="aria2-concurrent">Max Concurrent Downloads</Label>
              <Input
                id="aria2-concurrent"
                type="number"
                value={aria2MaxConcurrent}
                onChange={(e) => setAria2MaxConcurrent(e.target.value)}
                className="bg-secondary/50"
                disabled={!aria2Enabled}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="aria2-secret">RPC Secret</Label>
            <Input
              id="aria2-secret"
              type="password"
              value={aria2Secret}
              onChange={(e) => setAria2Secret(e.target.value)}
              className="bg-secondary/50"
              disabled={!aria2Enabled}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="aria2-download-dir">Download Directory</Label>
            <Input
              id="aria2-download-dir"
              value={aria2DownloadDir}
              onChange={(e) => setAria2DownloadDir(e.target.value)}
              className="bg-secondary/50"
              disabled={!aria2Enabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="aria2-connections">Max Connections Per Server</Label>
              <Input
                id="aria2-connections"
                type="number"
                value={aria2MaxConnections}
                onChange={(e) => setAria2MaxConnections(e.target.value)}
                className="bg-secondary/50"
                disabled={!aria2Enabled}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="aria2-split">Split</Label>
              <Input
                id="aria2-split"
                type="number"
                value={aria2Split}
                onChange={(e) => setAria2Split(e.target.value)}
                className="bg-secondary/50"
                disabled={!aria2Enabled}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="aria2-min-split">Min Split Size</Label>
            <Input
              id="aria2-min-split"
              value={aria2MinSplitSize}
              onChange={(e) => setAria2MinSplitSize(e.target.value)}
              className="bg-secondary/50"
              placeholder="e.g., 10M, 20M, 1G"
              disabled={!aria2Enabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Wget2 Backend</CardTitle>
              <CardDescription>Configure wget2 download settings. Wget2 must be installed and in PATH.</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium ${getHealthColor(getBackendHealthStatus('wget2'))}`}>
                Status: {getBackendHealthStatus('wget2')}
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wget2Enabled}
                  onChange={(e) => setWget2Enabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Enabled</span>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="wget2-concurrent">Max Concurrent Downloads</Label>
              <Input
                id="wget2-concurrent"
                type="number"
                value={wget2MaxConcurrent}
                onChange={(e) => setWget2MaxConcurrent(e.target.value)}
                className="bg-secondary/50"
                disabled={!wget2Enabled}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wget2-connections">Max Connections Per Server</Label>
              <Input
                id="wget2-connections"
                type="number"
                value={wget2MaxConnections}
                onChange={(e) => setWget2MaxConnections(e.target.value)}
                className="bg-secondary/50"
                disabled={!wget2Enabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="wget2-timeout">Timeout (seconds)</Label>
              <Input
                id="wget2-timeout"
                type="number"
                value={wget2Timeout}
                onChange={(e) => setWget2Timeout(e.target.value)}
                className="bg-secondary/50"
                disabled={!wget2Enabled}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wget2-retries">Retries</Label>
              <Input
                id="wget2-retries"
                type="number"
                value={wget2Retries}
                onChange={(e) => setWget2Retries(e.target.value)}
                className="bg-secondary/50"
                disabled={!wget2Enabled}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="wget2-download-dir">Download Directory</Label>
            <Input
              id="wget2-download-dir"
              value={wget2DownloadDir}
              onChange={(e) => setWget2DownloadDir(e.target.value)}
              className="bg-secondary/50"
              disabled={!wget2Enabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Wget Backend</CardTitle>
              <CardDescription>Configure wget download settings. Wget must be installed and in PATH.</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium ${getHealthColor(getBackendHealthStatus('wget'))}`}>
                Status: {getBackendHealthStatus('wget')}
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wgetEnabled}
                  onChange={(e) => setWgetEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Enabled</span>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="wget-concurrent">Max Concurrent Downloads</Label>
              <Input
                id="wget-concurrent"
                type="number"
                value={wgetMaxConcurrent}
                onChange={(e) => setWgetMaxConcurrent(e.target.value)}
                className="bg-secondary/50"
                disabled={!wgetEnabled}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wget-connections">Max Connections Per Server</Label>
              <Input
                id="wget-connections"
                type="number"
                value={wgetMaxConnections}
                onChange={(e) => setWgetMaxConnections(e.target.value)}
                className="bg-secondary/50"
                disabled={!wgetEnabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="wget-timeout">Timeout (seconds)</Label>
              <Input
                id="wget-timeout"
                type="number"
                value={wgetTimeout}
                onChange={(e) => setWgetTimeout(e.target.value)}
                className="bg-secondary/50"
                disabled={!wgetEnabled}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wget-retries">Retries</Label>
              <Input
                id="wget-retries"
                type="number"
                value={wgetRetries}
                onChange={(e) => setWgetRetries(e.target.value)}
                className="bg-secondary/50"
                disabled={!wgetEnabled}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="wget-download-dir">Download Directory</Label>
            <Input
              id="wget-download-dir"
              value={wgetDownloadDir}
              onChange={(e) => setWgetDownloadDir(e.target.value)}
              className="bg-secondary/50"
              disabled={!wgetEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Direct Download Backend</CardTitle>
              <CardDescription>
                Fallback download using Electron's built-in download manager. Limited features.
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium ${getHealthColor(getBackendHealthStatus('direct'))}`}>
                Status: {getBackendHealthStatus('direct')}
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={directEnabled}
                  onChange={(e) => setDirectEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Enabled</span>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
            <p className="text-xs text-yellow-500">
              <strong>Not Recommended:</strong> Direct download doesn't support advanced features like resume or segmented downloads. 
              Only enable this as a fallback option when other backends are unavailable.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="direct-download-dir">Download Directory</Label>
            <Input
              id="direct-download-dir"
              value={directDownloadDir}
              onChange={(e) => setDirectDownloadDir(e.target.value)}
              className="bg-secondary/50"
              disabled={!directEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <div className="pt-4 flex items-center gap-4">
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </Button>
        {saveMessage && (
          <p className={`text-sm ${saveMessage.includes('success') ? 'text-primary' : 'text-destructive'}`}>
            {saveMessage}
          </p>
        )}
      </div>
    </div>
  );
}
