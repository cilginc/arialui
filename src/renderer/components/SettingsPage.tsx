import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';
import type { AppConfig } from '../../main/config';
import { Check } from 'lucide-react';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [aria2Port, setAria2Port] = useState('6800');
  const [aria2Secret, setAria2Secret] = useState('');
  const [aria2DownloadDir, setAria2DownloadDir] = useState('');
  const [aria2MaxConnections, setAria2MaxConnections] = useState('5');
  const [aria2MaxConcurrent, setAria2MaxConcurrent] = useState('5');
  const [downloadDirectory, setDownloadDirectory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [customThemes, setCustomThemes] = useState<string[]>([]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const cfg = await window.electronAPI.getConfig();
        setConfig(cfg);
        setAria2Port(cfg.aria2.port.toString());
        setAria2Secret(cfg.aria2.secret);
        setAria2DownloadDir(cfg.aria2.downloadDir);
        setAria2MaxConnections(cfg.aria2.maxConnectionPerServer.toString());
        setAria2MaxConcurrent(cfg.aria2.maxConcurrentDownloads.toString());
        setDownloadDirectory(cfg.general.downloadDirectory);

        // Load custom themes
        const themes = await window.electronAPI.getCustomThemes();
        setCustomThemes(themes);
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    };
    loadConfig();
  }, []);

  const handleSaveSettings = async () => {
    if (!config) return;

    setIsSaving(true);
    setSaveMessage('');

    try {
      const updates: Partial<AppConfig> = {
        aria2: {
          ...config.aria2,
          port: parseInt(aria2Port, 10),
          secret: aria2Secret,
          downloadDir: aria2DownloadDir,
          maxConnectionPerServer: parseInt(aria2MaxConnections, 10),
          maxConcurrentDownloads: parseInt(aria2MaxConcurrent, 10),
        },
        general: {
          ...config.general,
          downloadDirectory,
        },
      };

      const newConfig = await window.electronAPI.updateConfig(updates);
      setConfig(newConfig);
      setSaveMessage('Settings saved successfully! Restart required to apply aria2 changes.');
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
        </CardContent>
      </Card>

      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle>Aria2 Configuration</CardTitle>
          <CardDescription>Configure aria2 download engine settings. Restart required after changes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rpc-port">RPC Port</Label>
              <Input
                id="rpc-port"
                type="number"
                value={aria2Port}
                onChange={(e) => setAria2Port(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max-concurrent">Max Concurrent Downloads</Label>
              <Input
                id="max-concurrent"
                type="number"
                value={aria2MaxConcurrent}
                onChange={(e) => setAria2MaxConcurrent(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rpc-secret">RPC Secret</Label>
            <Input
              id="rpc-secret"
              type="password"
              value={aria2Secret}
              onChange={(e) => setAria2Secret(e.target.value)}
              className="bg-secondary/50"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="aria2-download-dir">Aria2 Download Directory</Label>
            <Input
              id="aria2-download-dir"
              value={aria2DownloadDir}
              onChange={(e) => setAria2DownloadDir(e.target.value)}
              className="bg-secondary/50"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="max-connections">Max Connections Per Server</Label>
            <Input
              id="max-connections"
              type="number"
              value={aria2MaxConnections}
              onChange={(e) => setAria2MaxConnections(e.target.value)}
              className="bg-secondary/50"
            />
          </div>

          <div className="pt-4 flex items-center gap-4">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
            {saveMessage && (
              <p className={`text-sm ${saveMessage.includes('success') ? 'text-primary' : 'text-destructive'}`}>
                {saveMessage}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
