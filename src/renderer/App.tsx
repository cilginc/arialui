import React, { useEffect, useState } from 'react';
import { Aria2Client } from './api/aria2';
import { Sidebar } from './components/Sidebar';
import { DownloadList } from './components/DownloadList';
import { SettingsPage } from './components/SettingsPage';
import { AddDownloadDialog } from './components/AddDownloadDialog';
import { Button } from './components/ui/button';
import { Plus } from 'lucide-react';
import { useDownloads } from './hooks/useDownloads';

import { TitleBar } from './components/TitleBar';

function App() {
  const [activeTab, setActiveTab] = useState('all');
  const [version, setVersion] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [initialUrl, setInitialUrl] = useState<string>('');
  const [client, setClient] = useState<Aria2Client | null>(null);

  const { downloads, refresh, pauseDownload, resumeDownload, removeDownload } = useDownloads(client);

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

    window.electronAPI.onShowAddDownloadDialog((data) => {
      setInitialUrl(data.url);
      setIsAddDialogOpen(true);
      console.log('Received download from extension:', data);
    });
  }, []);

  const handleAddDownload = async (url: string) => {
    if (client) {
      try {
        await client.addUri([url]);
        console.log('Added download:', url);
        refresh();
      } catch (err) {
        console.error('Failed to add download:', err);
      }
    }
  };

  const filteredDownloads = downloads.filter(d => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return d.status === 'active';
    if (activeTab === 'waiting') return d.status === 'waiting' || d.status === 'paused';
    if (activeTab === 'stopped') return d.status === 'complete';
    if (activeTab === 'failed') return d.status === 'error';
    return true;
  });

  return (
    <div className="flex h-screen text-foreground overflow-hidden">
      <TitleBar />

      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 flex flex-col min-w-0 pt-8">
        {activeTab !== 'settings' && (
          <header className="px-6 py-4 flex items-center justify-between border-b border-border/50">
            <div>
              <h2 className="text-2xl font-bold capitalize">{activeTab === 'stopped' ? 'Completed' : activeTab} Downloads</h2>
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
          <DownloadList 
            downloads={filteredDownloads} 
            onPause={pauseDownload}
            onResume={resumeDownload}
            onRemove={removeDownload}
          />
        )}
      </main>

      <AddDownloadDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setInitialUrl(''); // Clear initial URL when dialog closes
        }}
        onAdd={handleAddDownload}
        initialUrl={initialUrl}
        autoSubmit={!!initialUrl} // Auto-submit when URL comes from extension
      />
    </div>
  );
}

export default App;
