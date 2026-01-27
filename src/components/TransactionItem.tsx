import { TrendingUp, TrendingDown, CreditCard, Trash2 } from 'lucide-react';
import { Transaction, Category, CreditCard as CreditCardType } from '@/types/finance';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  creditCard?: CreditCardType;
  onDelete?: (id: string) => void;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

export const TransactionItem = ({
  transaction,
  category,
  creditCard,
  onDelete,
}: TransactionItemProps) => {
  const isIncome = transaction.type === 'income';

  return (
    <div className="transaction-item animate-slide-up">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isIncome ? "bg-success/10" : "bg-destructive/10"
          )}
        >
          {isIncome ? (
            <TrendingUp className="w-5 h-5 text-success" />
          ) : (
            <TrendingDown className="w-5 h-5 text-destructive" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{transaction.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {formatDate(transaction.date)}
            </span>
            {category && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${category.color}20`,
                  color: category.color,
                }}
              >
                {category.name}
              </span>
            )}
            {creditCard && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                {creditCard.name}
              </span>
            )}
            {transaction.totalInstallments && transaction.totalInstallments > 1 && (
              <span className="text-xs text-muted-foreground">
                {transaction.installmentNumber}/{transaction.totalInstallments}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-semibold",
            isIncome ? "text-success" : "text-destructive"
          )}
        >
          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
        </span>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(transaction.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
