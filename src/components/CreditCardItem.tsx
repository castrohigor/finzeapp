import { CreditCard, Trash2, Edit } from 'lucide-react';
import { CreditCard as CreditCardType } from '@/types/finance';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CreditCardItemProps {
  card: CreditCardType;
  usedAmount: number;
  onEdit?: (card: CreditCardType) => void;
  onDelete?: (id: string) => void;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const CreditCardItem = ({
  card,
  usedAmount,
  onEdit,
  onDelete,
}: CreditCardItemProps) => {
  const percentage = card.limit > 0 ? (usedAmount / card.limit) * 100 : 0;
  const isOverLimit = usedAmount > card.limit;
  const available = Math.max(0, card.limit - usedAmount);

  return (
    <div
      className="p-4 rounded-xl border border-border bg-card animate-slide-up"
      style={{ borderLeftColor: card.color, borderLeftWidth: '4px' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-muted-foreground" />
          <span className="font-semibold">{card.name}</span>
        </div>
        <div className="flex gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(card)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(card.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Fatura atual</span>
          <span className={cn(
            "font-medium",
            isOverLimit ? "text-destructive" : "text-foreground"
          )}>
            {formatCurrency(usedAmount)}
          </span>
        </div>

        <Progress
          value={Math.min(percentage, 100)}
          className={cn(
            "h-2",
            isOverLimit && "[&>div]:bg-destructive"
          )}
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Disponível: {formatCurrency(available)}</span>
          <span>Limite: {formatCurrency(card.limit)}</span>
        </div>

        <div className="text-xs text-muted-foreground mt-2">
          Fecha dia {card.closingDay} • Vence dia {card.dueDay}
        </div>
      </div>
    </div>
  );
};
