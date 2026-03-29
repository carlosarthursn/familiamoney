import { useState } from 'react';
import { WishlistItem } from '@/types/finance';
import { Card, CardContent } from '@/components/ui/card';
import { Link, ShoppingBag, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { usePlanning } from '@/hooks/usePlanning';

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
  const { updateItem } = usePlanning();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editAmount, setEditAmount] = useState(String(item.price));

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const numAmount = parseFloat(editAmount.replace(',', '.'));
    if (isNaN(numAmount)) return;
    updateItem.mutate({ id: item.id, name: editName, price: numAmount });
    setIsEditing(false);
  };

  return (
    <Card className="shadow-card group transition-all hover:shadow-card-hover overflow-hidden">
      {isEditing ? (
        <CardContent className="p-4">
          <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Item</span>
                <Input 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  className="h-10 rounded-xl font-bold bg-background/80 border border-border/50"
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Preço</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">R$</span>
                  <Input 
                    type="text"
                    inputMode="decimal"
                    value={editAmount} 
                    onChange={e => setEditAmount(e.target.value.replace(/[^0-9,.]/g, ''))} 
                    className="h-10 pl-9 rounded-xl font-black text-base bg-background/80 border border-border/50"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} 
                className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} 
                className="px-4 py-1.5 bg-primary text-white text-xs font-black rounded-lg shadow-md hover:bg-primary/90 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </CardContent>
      ) : (
        <CardContent 
          className="p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform w-full h-full"
          onClick={() => setIsEditing(true)}
        >
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
                    className="text-primary hover:opacity-80 transition-opacity p-1"
                    aria-label="Link do produto"
                    onClick={e => e.stopPropagation()}
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
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-all touch-target"
              aria-label="Excluir item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}