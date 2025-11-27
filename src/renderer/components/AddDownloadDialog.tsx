import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BackendStatus, BackendType } from '../types.d';
import { AlertCircle } from 'lucide-react';

interface AddDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (url: string, backend: BackendType, options?: { cookies?: string; userAgent?: string }) => void;
  initialUrl?: string;
  initialOptions?: { cookies?: string; userAgent?: string };
  initialBackend?: string;
  autoSubmit?: boolean;
}

export function AddDownloadDialog({ 
  open, 
  onOpenChange, 
  onAdd, 
  initialUrl = '', 
  initialOptions, 
  initialBackend,
  autoSubmit = false 
}: AddDownloadDialogProps) {
  const [url, setUrl] = useState('');
  const [backends, setBackends] = useState<BackendStatus[]>([]);
  const [selectedBackend, setSelectedBackend] = useState<BackendType>('aria2');
  const [defaultBackend, setDefaultBackend] = useState<BackendType | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const hasAutoSubmittedRef = useRef<string>('');

  // Load backends when dialog opens
  useEffect(() => {
    if (open) {
      loadBackends();
    }
  }, [open]);

  const loadBackends = async () => {
    try {
      const [backendStatus, defBackend] = await Promise.all([
        window.electronAPI.getBackendStatus(),
        window.electronAPI.getDefaultBackend()
      ]);
      
      setBackends(backendStatus);
      setDefaultBackend(defBackend);
      
      // Set initial selection
      if (initialBackend) {
        setSelectedBackend(initialBackend as BackendType);
      } else if (defBackend) {
        setSelectedBackend(defBackend);
      } else {
        // Fallback to first healthy backend
        const healthy = backendStatus.find(b => b.enabled && b.health === 'healthy');
        if (healthy) {
          setSelectedBackend(healthy.id);
        }
      }
    } catch (error) {
      console.error('Failed to load backends:', error);
    }
  };

  // Update URL when initialUrl changes
  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
      hasAutoSubmittedRef.current = '';
    }
  }, [initialUrl]);

  // Auto-submit when URL is pre-filled and autoSubmit is true
  useEffect(() => {
    if (open && initialUrl && autoSubmit && hasAutoSubmittedRef.current !== initialUrl) {
      console.log('[DIALOG] Auto-submitting download:', initialUrl);
      hasAutoSubmittedRef.current = initialUrl;
      setTimeout(() => {
        onAdd(initialUrl, selectedBackend, initialOptions);
        setUrl('');
        onOpenChange(false);
        console.log('[DIALOG] Auto-submit completed');
      }, 300);
    }
  }, [open, initialUrl, autoSubmit, selectedBackend, onAdd, onOpenChange, initialOptions]);

  // Focus submit button when URL is pre-filled (but not auto-submitting)
  useEffect(() => {
    if (open && initialUrl && !autoSubmit && submitButtonRef.current) {
      setTimeout(() => {
        submitButtonRef.current?.focus();
      }, 100);
    }
  }, [open, initialUrl, autoSubmit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      onAdd(url, selectedBackend, initialOptions);
      setUrl('');
      onOpenChange(false);
    }
  };

  const getBackendStatusColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-500';
      case 'unhealthy': return 'text-red-500';
      case 'disabled': return 'text-gray-500';
      case 'checking': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getBackendStatusIndicator = (health: string) => {
    const color = getBackendStatusColor(health);
    return <span className={`inline-block w-2 h-2 rounded-full ${color.replace('text-', 'bg-')} mr-2`}></span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-card border-border">
        <DialogHeader>
          <DialogTitle>Add New Download</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">Download URL</Label>
            <Input
              id="url"
              placeholder="https://example.com/file.zip"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="col-span-3 bg-secondary/50 border-border"
              autoFocus={!initialUrl}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="backend">Download Backend</Label>
            <select
              id="backend"
              value={selectedBackend}
              onChange={(e) => setSelectedBackend(e.target.value as BackendType)}
              className="flex h-10 w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground"
            >
              {backends.map((backend) => (
                <option 
                  key={backend.id} 
                  value={backend.id}
                  disabled={!backend.enabled || backend.health !== 'healthy'}
                >
                  {backend.name}
                  {backend.id === defaultBackend && ' (Default)'}
                  {!backend.enabled && ' - Disabled'}
                  {backend.enabled && backend.health !== 'healthy' && ` - ${backend.health}`}
                </option>
              ))}
            </select>
            
            {backends.find(b => b.id === selectedBackend)?.id === 'direct' && (
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                <p className="text-xs text-yellow-500">
                  <strong>Not Recommended:</strong> Direct download doesn't support advanced features like resume or segmented downloads. 
                  Only use when other backends are unavailable.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-1">
              {backends.map((backend) => (
                <div key={backend.id} className="flex items-center text-xs">
                  {getBackendStatusIndicator(backend.health)}
                  <span className={getBackendStatusColor(backend.health)}>
                    {backend.name}: {backend.health}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" ref={submitButtonRef}>Start Download</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

