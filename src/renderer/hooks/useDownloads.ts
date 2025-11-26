import { useState, useEffect, useCallback, useRef } from 'react';
import { Aria2Client } from '../api/aria2';

export interface DownloadItem {
  gid: string;
  name: string;
  status: 'active' | 'waiting' | 'paused' | 'complete' | 'error' | 'removed';
  progress: number;
  speed: string;
  size: string;
  totalLength: number;
  completedLength: number;
  downloadSpeed: number;
  dir: string;
}

export function useDownloads(client: Aria2Client | null) {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [globalStat, setGlobalStat] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec: number) => {
    return formatSize(bytesPerSec) + '/s';
  };

  const mapAria2Item = (item: any): DownloadItem => {
    const totalLength = parseInt(item.totalLength);
    const completedLength = parseInt(item.completedLength);
    const downloadSpeed = parseInt(item.downloadSpeed);
    
    let progress = 0;
    if (totalLength > 0) {
      progress = (completedLength / totalLength) * 100;
    }

    // Determine name
    let name = 'Unknown';
    if (item.bittorrent && item.bittorrent.info && item.bittorrent.info.name) {
      name = item.bittorrent.info.name;
    } else if (item.files && item.files.length > 0) {
      const filePath = item.files[0].path;
      if (filePath) {
        // Extract filename from path
        name = filePath.split(/[/\\]/).pop() || 'Unknown';
      } else if (item.files[0].uris && item.files[0].uris.length > 0) {
        name = item.files[0].uris[0].uri.split('/').pop() || 'Unknown';
      }
    }

    return {
      gid: item.gid,
      name,
      status: item.status,
      progress,
      speed: formatSpeed(downloadSpeed),
      size: formatSize(totalLength),
      totalLength,
      completedLength,
      downloadSpeed,
      dir: item.dir,
    };
  };

  const fetchDownloads = useCallback(async () => {
    if (!client) return;

    try {
      const [active, waiting, stopped, stat] = await Promise.all([
        client.tellActive(),
        client.tellWaiting(0, 1000),
        client.tellStopped(0, 1000),
        client.getGlobalStat(),
      ]);

      const allRaw = [...active, ...waiting, ...stopped];
      const mapped = allRaw.map(mapAria2Item);
      
      // Sort by GID or maybe something else? For now, just reverse to show newest first if they are ordered by ID
      // Actually aria2 returns them in order.
      
      setDownloads(mapped);
      setGlobalStat(stat);
    } catch (err) {
      console.error('Failed to fetch downloads:', err);
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      fetchDownloads();
      intervalRef.current = setInterval(fetchDownloads, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [client, fetchDownloads]);

  const pauseDownload = async (gid: string) => {
    if (!client) return;
    try {
      await client.pause(gid);
      fetchDownloads();
    } catch (e) {
      // If pause fails, it might be because it's already paused or not active, try force pause or ignore
      console.error(e);
    }
  };

  const resumeDownload = async (gid: string) => {
    if (!client) return;
    try {
      await client.unpause(gid);
      fetchDownloads();
    } catch (e) {
      console.error(e);
    }
  };

  const removeDownload = async (gid: string, status: string) => {
    if (!client) return;
    try {
      if (['active', 'waiting', 'paused'].includes(status)) {
         await client.remove(gid);
      } else {
         await client.removeDownloadResult(gid);
      }
      fetchDownloads();
    } catch (e) {
       console.error('Failed to remove download:', e);
       // Fallback: try the other method just in case status was stale
       try {
         if (['active', 'waiting', 'paused'].includes(status)) {
            await client.removeDownloadResult(gid);
         } else {
            await client.remove(gid);
         }
         fetchDownloads();
       } catch (e2) {
         console.error('Retry failed:', e2);
       }
    }
  };

  return {
    downloads,
    globalStat,
    refresh: fetchDownloads,
    pauseDownload,
    resumeDownload,
    removeDownload
  };
}
