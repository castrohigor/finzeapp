import { Category } from '@/types/finance';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CategoryProgressProps {
  category: Category;
  spent: number;
  limit: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const CategoryProgress = ({ category, spent, limit }: CategoryProgressProps) => {
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const isOverLimit = spent > limit;

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all animate-fade-in",
        isOverLimit ? "category-over-limit" : "category-within-limit"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <span className="font-medium text-sm">{category.name}</span>
        </div>
        <span className={cn(
          "text-sm font-semibold",
          isOverLimit ? "text-destructive" : "text-foreground"
        )}>
          {formatCurrency(spent)}
        </span>
      </div>

      <Progress
        value={percentage}
        className={cn(
          "h-2",
          isOverLimit && "[&>div]:bg-destructive"
        )}
      />

      <div className="flex justify-between mt-1">
        <span className="text-xs text-muted-foreground">
          {percentage.toFixed(0)}%
        </span>
        <span className="text-xs text-muted-foreground">
          Limite: {formatCurrency(limit)}
        </span>
      </div>
    </div>
  );
};
