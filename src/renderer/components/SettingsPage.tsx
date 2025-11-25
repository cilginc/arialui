import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SettingsPage() {
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
