import { WishlistItem } from '@/types/finance';
import { Card, CardContent } from '@/components/ui/card';
import { Tag, Link, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WishListItemCardProps {
  item: WishlistItem;
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

export function WishListItemCard({ item }: WishListItemCardProps) {
  const priority = priorityMap[item.priority];

  return (
    <Card className="shadow-card p-4">
      <CardContent className="p-0 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
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
        
        <p className="font-bold text-lg text-foreground shrink-0">
          {formatCurrency(item.price)}
        </p>
      </CardContent>
    </Card>
  );
}