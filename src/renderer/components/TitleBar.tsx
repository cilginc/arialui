import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export function TitleBar() {
  return (
    <div className="fixed top-0 left-0 right-0 h-8 flex justify-end items-center z-50 drag-region bg-transparent">
      <div className="flex h-full no-drag">
        <button
          onClick={() => window.electronAPI.minimize()}
          className="h-full w-12 flex items-center justify-center hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
          title="Minimize"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={() => window.electronAPI.maximize()}
          className="h-full w-12 flex items-center justify-center hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
          title="Maximize"
        >
          <Square size={14} />
        </button>
        <button
          onClick={() => window.electronAPI.close()}
          className="h-full w-12 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors text-muted-foreground"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
