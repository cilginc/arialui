import React from 'react';
import { Download, Settings, List, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navItems = [
    { id: 'all', label: 'All Downloads', icon: List },
    { id: 'active', label: 'Active', icon: Download },
    { id: 'waiting', label: 'Waiting', icon: Clock },
    { id: 'stopped', label: 'Completed', icon: CheckCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-secondary/30 border-r border-border h-full flex flex-col p-4 glass">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          AriaLUI
        </h1>
      </div>

      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start gap-3",
              activeTab === item.id && "bg-primary/10 text-primary hover:bg-primary/20"
            )}
            onClick={() => onTabChange(item.id)}
          >
            <item.icon size={18} />
            {item.label}
          </Button>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="px-2 py-2 text-xs text-muted-foreground">
          Aria2 Status: <span className="text-green-400">Connected</span>
        </div>
      </div>
    </div>
  );
}
