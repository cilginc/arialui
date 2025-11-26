import React, { useEffect, useState } from 'react';
import { Aria2Client } from './api/aria2';
import { Sidebar } from './components/Sidebar';
import { DownloadList } from './components/DownloadList';
import { SettingsPage } from './components/SettingsPage';
import { AddDownloadDialog } from './components/AddDownloadDialog';
import { Button } from './components/ui/button';
import { Plus } from 'lucide-react';

import { TitleBar } from './components/TitleBar';

function App() {
  const [activeTab, setActiveTab] = useState('all');
  const [version, setVersion] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [client, setClient] = useState<Aria2Client | null>(null);

  useEffect(() => {
    const initAria2 = async () => {
      try {
        const config = await window.electronAPI.getAria2Config();
        const c = new Aria2Client(config);
        setClient(c);
        const v = await c.getVersion();
        setVersion(v.version);
      } catch (err) {
        console.error(err);
      }
    };
    initAria2();

    window.electronAPI.onShowAddDownloadDialog((url) => {
      setIsAddDialogOpen(true);
      // We might want to pre-fill the URL in the dialog.
      // Currently AddDownloadDialog has local state. 
      // Ideally we pass initialUrl prop or expose a method.
      // For now, let's just open it. To pre-fill, we need to lift state or use a ref/context.
      // I'll update AddDownloadDialog to accept an initialUrl or controlled value.
      console.log('Received URL from extension:', url);
    });
  }, []);

  const handleAddDownload = async (url: string) => {
    if (client) {
      try {
        await client.addUri([url]);
        console.log('Added download:', url);
        // Refresh list logic here
      } catch (err) {
        console.error('Failed to add download:', err);
      }
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <TitleBar />

      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 flex flex-col min-w-0 pt-8">
        {activeTab !== 'settings' && (
          <header className="px-6 py-4 flex items-center justify-between border-b border-border/50">
            <div>
              <h2 className="text-2xl font-bold capitalize">{activeTab} Downloads</h2>
              <p className="text-sm text-muted-foreground">Manage your downloads efficiently</p>
            </div>
            <Button
              className="gap-2 shadow-lg shadow-primary/20"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus size={18} />
              Add Download
            </Button>
          </header>
        )}

        {activeTab === 'settings' ? (
          <SettingsPage />
        ) : (
          <DownloadList />
        )}
      </main>

      <AddDownloadDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddDownload}
      />
    </div>
  );
}

export default App;
