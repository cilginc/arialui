import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="p-6 space-y-6 overflow-y-auto flex-1">
      <h2 className="text-2xl font-bold">Settings</h2>

      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Configure general application settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="download-dir">Default Download Directory</Label>
            <div className="flex gap-2">
              <Input id="download-dir" defaultValue="C:\Users\User\Downloads" className="bg-secondary/50" />
              <Button variant="outline">Browse</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              <Button 
                variant={theme === 'light' ? 'default' : 'outline'} 
                onClick={() => setTheme('light')}
              >
                Light
              </Button>
              <Button 
                variant={theme === 'dark' ? 'default' : 'outline'} 
                onClick={() => setTheme('dark')}
              >
                Dark
              </Button>
              <Button 
                variant={theme === 'system' ? 'default' : 'outline'} 
                onClick={() => setTheme('system')}
              >
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle>Connection</CardTitle>
          <CardDescription>Aria2 RPC connection settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="rpc-port">RPC Port</Label>
            <Input id="rpc-port" defaultValue="6800" className="bg-secondary/50" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rpc-secret">RPC Secret</Label>
            <Input id="rpc-secret" type="password" defaultValue="arialui_secret_token" className="bg-secondary/50" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
