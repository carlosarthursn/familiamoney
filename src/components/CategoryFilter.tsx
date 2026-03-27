import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EXPENSE_CATEGORIES, getCategoryIcon } from '@/types/finance';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckSquare, Square } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export function CategoryFilter({ selectedCategories, onCategoriesChange }: CategoryFilterProps) {
  const allCategoryIds = EXPENSE_CATEGORIES.map(c => c.id);
  const isAllSelected = selectedCategories.length === allCategoryIds.length;

  const toggleAll = () => {
    if (isAllSelected) {
      onCategoriesChange([]);
    } else {
      onCategoriesChange(allCategoryIds);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Filtrar Categorias
        </h3>
        <button 
          onClick={toggleAll}
          className="text-[10px] font-bold text-primary uppercase flex items-center gap-1 active:scale-95 transition-transform"
        >
          {isAllSelected ? (
            <><Square className="h-3 w-3" /> Desmarcar todos</>
          ) : (
            <><CheckSquare className="h-3 w-3" /> Marcar todos</>
          )}
        </button>
      </div>

      <ToggleGroup 
        type="multiple" 
        value={selectedCategories} 
        onValueChange={onCategoriesChange}
        className="grid grid-cols-3 gap-2"
      >
        {EXPENSE_CATEGORIES.map((cat) => {
          const IconComponent = getCategoryIcon(cat.icon);
          const isSelected = selectedCategories.includes(cat.id);
          
          return (
            <ToggleGroupItem 
              key={cat.id} 
              value={cat.id} 
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border text-[10px] transition-all duration-200",
                isSelected 
                  ? "bg-primary/10 text-primary border-primary font-bold shadow-sm"
                  : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted"
              )}
            >
              <IconComponent className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
              <span className="truncate w-full text-center px-1">{cat.label}</span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
}