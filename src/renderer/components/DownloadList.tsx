import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pause, Play, X } from 'lucide-react';

// Mock type for now
interface DownloadItem {
  gid: string;
  name: string;
  status: 'active' | 'waiting' | 'paused' | 'complete' | 'error';
  progress: number;
  speed: string;
  size: string;
}

export function DownloadList() {
  const downloads: DownloadItem[] = [
    { gid: '1', name: 'ubuntu-22.04-desktop-amd64.iso', status: 'active', progress: 45, speed: '2.5 MB/s', size: '3.4 GB' },
    { gid: '2', name: 'movie_4k_hdr.mkv', status: 'paused', progress: 12, speed: '0 B/s', size: '14.2 GB' },
    { gid: '3', name: 'archive.zip', status: 'complete', progress: 100, speed: '0 B/s', size: '150 MB' },
  ];

  return (
    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
      {downloads.map((item) => (
        <Card key={item.gid} className="glass-card border-border/50 hover:bg-accent/5 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-1">
                <h3 className="font-medium truncate" title={item.name}>{item.name}</h3>
                <span className="text-xs text-muted-foreground">{item.status}</span>
              </div>

              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${item.progress}%` }}
                />
              </div>

              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{item.size} • {item.speed}</span>
                <span>{item.progress}%</span>
              </div>
            </div>

            <div className="flex gap-2">
              {item.status === 'active' ? (
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Pause size={16} />
                </Button>
              ) : (
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Play size={16} />
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                <X size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
