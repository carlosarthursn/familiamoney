import { Home, PieChart, CalendarDays, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'calendar', label: 'Calendário', icon: CalendarDays },
  { id: 'analysis', label: 'Análise', icon: PieChart },
  { id: 'planning', label: 'Planejar', icon: Target },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-40">
      <div className="grid grid-cols-4 max-w-lg mx-auto h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={tab.label}
            >
              <Icon className={cn(
                "h-6 w-6 transition-transform",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-bold"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full shadow-glow" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}