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
        className="flex flex-wrap justify-start gap-1.5"
      >
        {EXPENSE_CATEGORIES.map((cat) => {
          const IconComponent = getCategoryIcon(cat.icon);
          const isSelected = selectedCategories.includes(cat.id);
          
          return (
            <ToggleGroupItem 
              key={cat.id} 
              value={cat.id} 
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 h-8 rounded-lg border text-[10px] transition-all",
                isSelected 
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-transparent"
              )}
            >
              <IconComponent className="h-3 w-3" />
              <span className="font-medium">{cat.label}</span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
}