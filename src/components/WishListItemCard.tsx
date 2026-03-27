import { WishlistItem } from '@/types/finance';
import { Card, CardContent } from '@/components/ui/card';
import { Link, ShoppingBag, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WishListItemCardProps {
  item: WishlistItem;
  onDelete: (id: string) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

const priorityMap = {
  high: { label: 'Alta', color: 'bg-destructive/10 text-destructive', icon: '!' },
  medium: { label: 'Média', color: 'bg-warning/10 text-warning', icon: '!!' },
  low: { label: 'Baixa', color: 'bg-primary/10 text-primary', icon: '...' },
};

export function WishListItemCard({ item, onDelete }: WishListItemCardProps) {
  const priority = priorityMap[item.priority];

  return (
    <Card className="shadow-card p-4 group transition-all hover:shadow-card-hover">
      <CardContent className="p-0 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{item.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", priority.color)}>
                {priority.label}
              </span>
              {item.link && (
                <a 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:opacity-80 transition-opacity"
                  aria-label="Link do produto"
                >
                  <Link className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <p className="font-bold text-sm text-foreground whitespace-nowrap">
            {formatCurrency(item.price)}
          </p>
          
          <button
            onClick={() => onDelete(item.id)}
            className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-all touch-target"
            aria-label="Excluir item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}