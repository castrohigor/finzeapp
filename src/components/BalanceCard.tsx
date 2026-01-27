import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { MonthlyBalance } from '@/types/finance';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  balance: MonthlyBalance;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const BalanceCard = ({ balance }: BalanceCardProps) => {
  const isPositive = balance.balance >= 0;

  return (
    <div className="balance-card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 opacity-80" />
          <span className="text-sm font-medium opacity-80">Saldo do Mês</span>
        </div>
        {balance.previousBalance !== 0 && (
          <span className="text-xs opacity-70">
            Anterior: {formatCurrency(balance.previousBalance)}
          </span>
        )}
      </div>

      <div className={cn(
        "text-3xl font-bold mb-6",
        isPositive ? "text-primary-foreground" : "text-destructive-foreground"
      )}>
        {formatCurrency(balance.balance)}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-primary-foreground/10 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-success-foreground opacity-90" />
            <span className="text-xs opacity-80">Receitas</span>
          </div>
          <span className="text-lg font-semibold text-success-foreground opacity-90">
            {formatCurrency(balance.income)}
          </span>
        </div>

        <div className="bg-primary-foreground/10 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-destructive-foreground opacity-90" />
            <span className="text-xs opacity-80">Despesas</span>
          </div>
          <span className="text-lg font-semibold text-destructive-foreground opacity-90">
            {formatCurrency(balance.expenses)}
          </span>
        </div>
      </div>
    </div>
  );
};
