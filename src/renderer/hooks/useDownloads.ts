import { useState, useEffect, useCallback, useRef } from 'react';
import { Aria2Client } from '../api/aria2';
import type { TrackedDownload } from '../types.d';

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
  backend?: 'aria2' | 'wget2' | 'wget' | 'direct';
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
      backend: 'aria2',
    };
  };

  const mapTrackedItem = (item: TrackedDownload): DownloadItem => {
    const speed = item.status === 'active' && item.speed > 0 ? item.speed : 0;
    
    return {
      gid: item.id,
      name: item.filename,
      status: item.status,
      progress: item.progress,
      speed: formatSpeed(speed),
      size: formatSize(item.totalBytes),
      totalLength: item.totalBytes,
      completedLength: item.downloadedBytes,
      downloadSpeed: speed,
      dir: item.savePath || '',
      backend: item.backend,
    };
  };

  const fetchDownloads = useCallback(async () => {
    if (!client) return;

    try {
      // Fetch aria2 downloads
      const [active, waiting, stopped, stat] = await Promise.all([
        client.tellActive(),
        client.tellWaiting(0, 1000),
        client.tellStopped(0, 1000),
        client.getGlobalStat(),
      ]);

      const aria2Downloads = [...active, ...waiting, ...stopped].map(mapAria2Item);
      
      // Fetch tracked downloads (non-aria2)
      const trackedDownloads = await window.electronAPI.getTrackedDownloads();
      const mappedTracked = trackedDownloads.map(mapTrackedItem);
      
      // Merge both lists
      const allDownloads = [...aria2Downloads, ...mappedTracked];
      
      setDownloads(allDownloads);
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
    // Check if this is a tracked download (non-aria2)
    if (gid.startsWith('direct-') || gid.startsWith('wget-') || gid.startsWith('wget2-')) {
      try {
        await window.electronAPI.removeTrackedDownload(gid);
        fetchDownloads();
      } catch (e) {
        console.error('Failed to remove tracked download:', e);
      }
      return;
    }

    // Aria2 download
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
