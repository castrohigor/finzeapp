import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { MonthSelector } from '@/components/MonthSelector';
import { BalanceCard } from '@/components/BalanceCard';
import { CategoryProgress } from '@/components/CategoryProgress';
import { ExpenseCharts } from '@/components/ExpenseCharts';
import { TransactionItem } from '@/components/TransactionItem';
import { TransactionForm } from '@/components/TransactionForm';

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const Dashboard = () => {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const {
    categories,
    creditCards,
    getMonthlyBalance,
    getMonthTransactions,
    addTransaction,
    deleteTransaction,
    getCategoryLimitSync,
  } = useFinanceData();

  const balance = useMemo(
    () => getMonthlyBalance(currentMonth),
    [currentMonth, getMonthlyBalance]
  );

  const transactions = useMemo(
    () => getMonthTransactions(currentMonth).slice(0, 5),
    [currentMonth, getMonthTransactions]
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <MonthSelector currentMonth={currentMonth} onChange={setCurrentMonth} />
      </div>

      <div className="content-container">
        <BalanceCard balance={balance} />

        {/* Category Progress */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Limites por Categoria
          </h2>
          <div className="grid gap-3">
            {categories.slice(0, 4).map((category) => (
              <CategoryProgress
                key={category.id}
                category={category}
                spent={balance.categoryExpenses[category.id] || 0}
                limit={getCategoryLimitSync(category.id, currentMonth)}
              />
            ))}
          </div>
        </div>

        {/* Charts */}
        <ExpenseCharts
          categoryExpenses={balance.categoryExpenses}
          categories={categories}
        />

        {/* Recent Transactions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Últimos Lançamentos
          </h2>
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
              <div className="stat-card text-center py-8">
                <p className="text-muted-foreground">Nenhum lançamento neste mês</p>
              </div>
            )}
          </div>
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
