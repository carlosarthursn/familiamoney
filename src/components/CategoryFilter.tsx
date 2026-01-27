import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EXPENSE_CATEGORIES, getCategoryIcon } from '@/types/finance';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export function CategoryFilter({ selectedCategories, onCategoriesChange }: CategoryFilterProps) {
  const handleToggle = (value: string[]) => {
    onCategoriesChange(value);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Filtrar Despesas por Categoria</h3>
      <ToggleGroup 
        type="multiple" 
        value={selectedCategories} 
        onValueChange={handleToggle}
        className="flex flex-wrap justify-start gap-2"
      >
        {EXPENSE_CATEGORIES.map((cat) => {
          const IconComponent = getCategoryIcon(cat.icon);
          const isSelected = selectedCategories.includes(cat.id);
          
          return (
            <ToggleGroupItem 
              key={cat.id} 
              value={cat.id} 
              aria-label={`Toggle ${cat.label}`}
              className={cn(
                "flex items-center gap-2 px-3 py-2 h-auto rounded-xl border transition-all touch-target",
                isSelected 
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
              )}
            >
              <IconComponent className="h-4 w-4" />
              <span className="text-sm font-medium">{cat.label}</span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
}