import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (url: string) => void;
}

export function AddDownloadDialog({ open, onOpenChange, onAdd }: AddDownloadDialogProps) {
  const [url, setUrl] = useState('');

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
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit">Start Download</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
