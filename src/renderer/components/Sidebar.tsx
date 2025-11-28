import React from 'react';
import { Download, Settings, List, CheckCircle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { BackendStatus } from '../types.d';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  backendStatus: BackendStatus[];
}

export function Sidebar({ activeTab, onTabChange, backendStatus }: SidebarProps) {
  const navItems = [
    { id: 'all', label: 'All Downloads', icon: List },
    { id: 'active', label: 'Active', icon: Download },
    { id: 'waiting', label: 'Waiting', icon: Clock },
    { id: 'stopped', label: 'Completed', icon: CheckCircle },
    { id: 'failed', label: 'Failed', icon: XCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-accent-green';
      case 'unhealthy': return 'bg-accent-red';
      case 'disabled': return 'bg-muted';
      case 'checking': return 'bg-accent-yellow';
      default: return 'bg-muted';
    }
  };

  // Filter to show only enabled backends, excluding direct download
  const enabledBackends = backendStatus.filter(b => b.enabled && b.id !== 'direct');

  return (
    <div className="w-64 bg-secondary/30 border-r border-border h-full flex flex-col p-4 glass">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold text-primary">
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
        <div className="px-2 py-2 text-xs">
          <div className="font-medium text-muted-foreground mb-2">Backend Status</div>
          <div className="space-y-1.5">
            {enabledBackends.length > 0 ? (
              enabledBackends.map((backend) => (
                <div key={backend.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getHealthColor(backend.health)}`}></span>
                    <span className="text-foreground">{backend.name}</span>
                  </div>
                  <span className={`capitalize ${
                    backend.health === 'healthy' ? 'text-accent-green' :
                    backend.health === 'unhealthy' ? 'text-accent-red' :
                    backend.health === 'checking' ? 'text-accent-yellow' :
                    'text-muted-foreground'
                  }`}>
                    {backend.health}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground italic">No backends enabled</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

