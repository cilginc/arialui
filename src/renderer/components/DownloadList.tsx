import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pause, Play, X, Trash2 } from 'lucide-react';
import { DownloadItem } from '../hooks/useDownloads';

interface DownloadListProps {
  downloads: DownloadItem[];
  onPause: (gid: string) => void;
  onResume: (gid: string) => void;
  onRemove: (gid: string, status: string) => void;
}

export function DownloadList({ downloads, onPause, onResume, onRemove }: DownloadListProps) {
  if (downloads.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No downloads found</p>
          <p className="text-sm">Add a download to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
      {downloads.map((item) => (
        <Card key={item.gid} className="glass-card border-border/50 hover:bg-accent/5 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-medium truncate" title={item.name}>{item.name}</h3>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.backend === 'aria2' ? 'bg-blue-500/20 text-blue-500' :
                    item.backend === 'wget2' ? 'bg-purple-500/20 text-purple-500' :
                    item.backend === 'wget' ? 'bg-orange-500/20 text-orange-500' :
                    item.backend === 'direct' ? 'bg-cyan-500/20 text-cyan-500' :
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    {item.backend || 'aria2'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    item.status === 'active' ? 'bg-primary/20 text-primary' :
                    item.status === 'error' ? 'bg-destructive/20 text-destructive' :
                    item.status === 'complete' ? 'bg-green-500/20 text-green-500' :
                    item.status === 'paused' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    item.status === 'error' ? 'bg-destructive' :
                    item.status === 'complete' ? 'bg-green-500' :
                    'bg-primary'
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>

              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{item.size} • {item.speed}</span>
                <span>{item.progress.toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex gap-2">
              {item.status === 'active' && (
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onPause(item.gid)}>
                  <Pause size={16} />
                </Button>
              )}
              {item.status === 'paused' && (
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onResume(item.gid)}>
                  <Play size={16} />
                </Button>
              )}
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(item.gid, item.status)}
              >
                {item.status === 'complete' || item.status === 'error' ? <Trash2 size={16} /> : <X size={16} />}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
