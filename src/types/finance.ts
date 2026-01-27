export interface Category {
  id: string;
  name: string;
  defaultLimit: number;
  color: string;
  icon?: string;
}

export interface CategoryMonthlyLimit {
  categoryId: string;
  month: string; // YYYY-MM format
  limit: number;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  dueDay: number; // Day of month when bill is due
  closingDay: number; // Day when the billing cycle closes
  color: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string; // YYYY-MM-DD
  categoryId?: string;
  creditCardId?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroupId?: string; // Groups all installments of same purchase
  effectiveMonth: string; // YYYY-MM - The month this transaction affects the balance
}

export interface MonthlyBalance {
  month: string; // YYYY-MM
  income: number;
  expenses: number;
  balance: number;
  previousBalance: number;
  categoryExpenses: Record<string, number>;
}
