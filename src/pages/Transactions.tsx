import { useState, useMemo } from 'react';
import { Plus, Filter } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { MonthSelector } from '@/components/MonthSelector';
import { TransactionItem } from '@/components/TransactionItem';
import { TransactionForm } from '@/components/TransactionForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const Transactions = () => {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCard, setFilterCard] = useState<string>('all');

  const {
    categories,
    creditCards,
    getMonthTransactions,
    addTransaction,
    deleteTransaction,
  } = useFinanceData();

  const transactions = useMemo(() => {
    let filtered = getMonthTransactions(currentMonth);

    if (filterCategory !== 'all') {
      filtered = filtered.filter((t) => t.categoryId === filterCategory);
    }

    if (filterCard !== 'all') {
      filtered = filtered.filter((t) => t.creditCardId === filterCard);
    }

    return filtered;
  }, [currentMonth, filterCategory, filterCard, getMonthTransactions]);

  const total = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense };
  }, [transactions]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="page-container">
      <div className="page-header space-y-4">
        <MonthSelector currentMonth={currentMonth} onChange={setCurrentMonth} />

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="flex-1">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCard} onValueChange={setFilterCard}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Cartão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos cartões</SelectItem>
              {creditCards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        <div className="flex justify-between text-sm">
          <span className="text-success">+ {formatCurrency(total.income)}</span>
          <span className="text-destructive">- {formatCurrency(total.expense)}</span>
        </div>
      </div>

      <div className="content-container">
        <div className="space-y-2">
          {transactions.length > 0 ? (
            transactions.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                category={categories.find((c) => c.id === t.categoryId)}
                creditCard={creditCards.find((c) => c.id === t.creditCardId)}
                onDelete={deleteTransaction}
              />
            ))
          ) : (
            <div className="stat-card text-center py-12">
              <p className="text-muted-foreground mb-2">Nenhum lançamento encontrado</p>
              <p className="text-sm text-muted-foreground">
                Toque no + para adicionar
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowTransactionForm(true)}
        className="floating-button"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <TransactionForm
          categories={categories}
          creditCards={creditCards}
          onSubmit={addTransaction}
          onClose={() => setShowTransactionForm(false)}
        />
      )}
    </div>
  );
};
