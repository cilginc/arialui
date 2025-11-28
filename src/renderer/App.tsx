import React, { useEffect, useState, useCallback } from 'react';
import { Aria2Client } from './api/aria2';
import { Sidebar } from './components/Sidebar';
import { DownloadList } from './components/DownloadList';
import { SettingsPage } from './components/SettingsPage';
import { AddDownloadDialog } from './components/AddDownloadDialog';
import { Button } from './components/ui/button';
import { Plus } from 'lucide-react';
import { useDownloads } from './hooks/useDownloads';
import type { BackendStatus, BackendType } from './types.d';

import { TitleBar } from './components/TitleBar';

function App() {
  const [activeTab,setActiveTab] = useState('all');
  // const [version, setVersion] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [initialUrl, setInitialUrl] = useState<string>('');
  const [initialBackend, setInitialBackend] = useState<string>();
  const [client, setClient] = useState<Aria2Client | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus[]>([]);

  const [downloadOptions, setDownloadOptions] = useState<{ cookies?: string; userAgent?: string }>({});

  const { downloads, refresh, pauseDownload, resumeDownload, removeDownload } = useDownloads(client);



  useEffect(() => {
    const initAria2 = async () => {
      try {
        const config = await window.electronAPI.getAria2Config();
        const c = new Aria2Client(config);
        setClient(c);
        // const v = await c.getVersion();
        // setVersion(v.version);
      } catch (err) {
        console.error(err);
      }
    };
    initAria2();

    const loadBackendStatus = async () => {
      try {
        const status = await window.electronAPI.getBackendStatus();
        setBackendStatus(status);
      } catch (error) {
        console.error('[APP] Failed to load backend status:', error);
      }
    };

    // Load initial backend status
    loadBackendStatus();

    window.electronAPI.onShowAddDownloadDialog((data) => {
      console.log('[RENDERER] Received show-add-download-dialog event:', data);
      setInitialUrl(data.url);
      setInitialBackend(data.backend);
      setDownloadOptions({ cookies: data.cookies, userAgent: data.userAgent });
      setIsAddDialogOpen(true);
      console.log('[RENDERER] Dialog opened with autoSubmit enabled');
    });

    // Subscribe to backend status updates
    window.electronAPI.onBackendStatusChanged((status) => {
      console.log('[RENDERER] Backend status updated:', status);
      setBackendStatus(status);
    });
  }, []);



  const handleAddDownload = useCallback(async (
    url: string, 
    backend?: BackendType, 
    options?: { cookies?: string; userAgent?: string }
  ) => {
    console.log('[APP] handleAddDownload called with URL:', url, 'Backend:', backend);
    
    // Default to aria2 if no backend specified
    const selectedBackend = backend || 'aria2';
    
    try {
      // For aria2, use the direct client for better UI integration
      if (selectedBackend === 'aria2' && client) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const aria2Options: any = {};
        if (options?.cookies) aria2Options.header = [`Cookie: ${options.cookies}`];
        if (options?.userAgent) aria2Options['user-agent'] = options.userAgent;
        
        await client.addUri([url], aria2Options);
        console.log('[APP] Download added to aria2:', url);
        refresh();
      } else {
        // For other backends, use the backend manager
        const result = await window.electronAPI.addDownloadWithBackend(
          selectedBackend,
          url,
          options
        );
        
        if (result.success) {
          console.log('[APP] Download added successfully:', result.downloadId);
          // Refresh list to show new download
          refresh();
        } else {
          console.error('[APP] Failed to add download:', result.error);
          alert(`Failed to add download: ${result.error}`);
        }
      }
    } catch (err) {
      console.error('[APP] Error adding download:', err);
      alert('Failed to add download');
    }
  }, [client, refresh]);

  const filteredDownloads = downloads.filter(d => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return d.status === 'active';
    if (activeTab === 'waiting') return d.status === 'waiting' || d.status === 'paused';
    if (activeTab === 'stopped') return d.status === 'complete';
    if (activeTab === 'failed') return d.status === 'error';
    return true;
  });

  const handleRemove = async (gid: string, status: string) => {
    const download = downloads.find(d => d.gid === gid);
    let deleteFile = false;

    if (download && download.fullPath) {
      try {
        const exists = await window.electronAPI.checkFileExists(download.fullPath);
        if (exists) {
          // Use a custom dialog or standard confirm
          // Since the requirement says "ask for users", confirm is the simplest way.
          // "Do you want to delete the file too?"
          if (confirm(`Do you want to delete the file "${download.name}" from disk as well?`)) {
            deleteFile = true;
          }
        }
      } catch (e) {
        console.error('Failed to check file existence:', e);
      }
    }

    await removeDownload(gid, status, deleteFile);
  };

  return (
    <div className="flex h-screen text-foreground overflow-hidden">
      <TitleBar />

      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} backendStatus={backendStatus} />

      <main className="flex-1 flex flex-col min-w-0 pt-8">
        {activeTab !== 'settings' && (
          <header className="px-6 py-4 flex items-center justify-between border-b border-border/50">
            <div>
              <h2 className="text-2xl font-bold capitalize">{activeTab === 'stopped' ? 'Completed' : activeTab} Downloads</h2>
              <p className="text-sm text-muted-foreground">Manage your downloads efficiently</p>
            </div>
            <Button
              className="gap-2 shadow-lg shadow-primary/20"
              onClick={() => {
                setInitialUrl('');
                setInitialBackend(undefined);
                setDownloadOptions({});
                setIsAddDialogOpen(true);
              }}
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
            onRemove={handleRemove}
          />
        )}
      </main>

      <AddDownloadDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setInitialUrl('');
            setInitialBackend(undefined);
            setDownloadOptions({});
          }
        }}
        onAdd={handleAddDownload}
        initialUrl={initialUrl}
        initialBackend={initialBackend}
        initialOptions={downloadOptions}
        autoSubmit={!!initialUrl}
      />
    </div>
  );
}

export default App;
