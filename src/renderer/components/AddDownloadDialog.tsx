import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (url: string) => void;
  initialUrl?: string;
  autoSubmit?: boolean;
}

export function AddDownloadDialog({ open, onOpenChange, onAdd, initialUrl = '', autoSubmit = false }: AddDownloadDialogProps) {
  const [url, setUrl] = useState('');
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Update URL when initialUrl changes
  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  // Auto-submit when URL is pre-filled and autoSubmit is true
  useEffect(() => {
    if (open && initialUrl && autoSubmit) {
      // Small delay to ensure dialog is fully rendered
      setTimeout(() => {
        onAdd(initialUrl);
        setUrl('');
        onOpenChange(false);
      }, 300);
    }
  }, [open, initialUrl, autoSubmit, onAdd, onOpenChange]);

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
      onAdd(url);
      setUrl('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass-card border-border">
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
          <DialogFooter>
            <Button type="submit" ref={submitButtonRef}>Start Download</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
