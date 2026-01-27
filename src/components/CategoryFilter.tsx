import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EXPENSE_CATEGORIES, getCategoryIcon } from '@/types/finance';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export function CategoryFilter({ selectedCategories, onCategoriesChange }: CategoryFilterProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filtrar Categorias</h3>
      <ToggleGroup 
        type="multiple" 
        value={selectedCategories} 
        onValueChange={onCategoriesChange}
        className="flex flex-wrap justify-start gap-2"
      >
        {EXPENSE_CATEGORIES.map((cat) => {
          const IconComponent = getCategoryIcon(cat.icon);
          const isSelected = selectedCategories.includes(cat.id);
          
          return (
            <ToggleGroupItem 
              key={cat.id} 
              value={cat.id} 
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 h-9 rounded-xl border text-xs transition-all touch-target",
                isSelected 
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
              )}
            >
              <IconComponent className="h-4 w-4" />
              <span className="font-medium">{cat.label}</span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
}