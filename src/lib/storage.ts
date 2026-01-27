import { Category, CategoryMonthlyLimit, CreditCard, Transaction } from '@/types/finance';

const STORAGE_KEYS = {
  CATEGORIES: 'finance_categories',
  CATEGORY_LIMITS: 'finance_category_limits',
  CREDIT_CARDS: 'finance_credit_cards',
  TRANSACTIONS: 'finance_transactions',
};

// Categories
export const getCategories = (): Category[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  return data ? JSON.parse(data) : getDefaultCategories();
};

export const saveCategories = (categories: Category[]): void => {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
};

export const getDefaultCategories = (): Category[] => [
  { id: '1', name: 'Alimentação', defaultLimit: 800, color: '#10b981' },
  { id: '2', name: 'Transporte', defaultLimit: 400, color: '#3b82f6' },
  { id: '3', name: 'Moradia', defaultLimit: 2000, color: '#8b5cf6' },
  { id: '4', name: 'Lazer', defaultLimit: 300, color: '#f59e0b' },
  { id: '5', name: 'Saúde', defaultLimit: 500, color: '#ec4899' },
  { id: '6', name: 'Educação', defaultLimit: 400, color: '#06b6d4' },
];

// Category Monthly Limits
export const getCategoryMonthlyLimits = (): CategoryMonthlyLimit[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CATEGORY_LIMITS);
  return data ? JSON.parse(data) : [];
};

export const saveCategoryMonthlyLimits = (limits: CategoryMonthlyLimit[]): void => {
  localStorage.setItem(STORAGE_KEYS.CATEGORY_LIMITS, JSON.stringify(limits));
};

export const getCategoryLimit = (categoryId: string, month: string): number => {
  const monthlyLimits = getCategoryMonthlyLimits();
  const specificLimit = monthlyLimits.find(
    (l) => l.categoryId === categoryId && l.month === month
  );
  if (specificLimit) return specificLimit.limit;

  const categories = getCategories();
  const category = categories.find((c) => c.id === categoryId);
  return category?.defaultLimit || 0;
};

// Credit Cards
export const getCreditCards = (): CreditCard[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CREDIT_CARDS);
  return data ? JSON.parse(data) : [];
};

export const saveCreditCards = (cards: CreditCard[]): void => {
  localStorage.setItem(STORAGE_KEYS.CREDIT_CARDS, JSON.stringify(cards));
};

// Transactions
export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  return data ? JSON.parse(data) : [];
};

export const saveTransactions = (transactions: Transaction[]): void => {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
};

// Calculate effective month for credit card transactions
export const calculateEffectiveMonth = (
  transactionDate: string,
  creditCard: CreditCard
): string => {
  const date = new Date(transactionDate);
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  // If transaction is after closing day, it goes to next month's bill
  if (day > creditCard.closingDay) {
    const nextMonth = new Date(year, month + 2, 1); // +2 because it's due next month
    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
  } else {
    const nextMonth = new Date(year, month + 1, 1);
    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
  }
};

// Generate installment transactions
export const generateInstallments = (
  baseTransaction: Omit<Transaction, 'id' | 'installmentNumber' | 'effectiveMonth'>,
  totalInstallments: number,
  creditCard?: CreditCard
): Transaction[] => {
  const transactions: Transaction[] = [];
  const installmentGroupId = crypto.randomUUID();
  const installmentAmount = baseTransaction.amount / totalInstallments;

  for (let i = 0; i < totalInstallments; i++) {
    const installmentDate = new Date(baseTransaction.date);
    installmentDate.setMonth(installmentDate.getMonth() + i);
    const dateStr = installmentDate.toISOString().split('T')[0];

    let effectiveMonth: string;
    if (creditCard) {
      effectiveMonth = calculateEffectiveMonth(dateStr, creditCard);
    } else {
      effectiveMonth = `${installmentDate.getFullYear()}-${String(installmentDate.getMonth() + 1).padStart(2, '0')}`;
    }

    transactions.push({
      ...baseTransaction,
      id: crypto.randomUUID(),
      amount: installmentAmount,
      date: dateStr,
      installmentNumber: i + 1,
      totalInstallments,
      installmentGroupId,
      effectiveMonth,
    });
  }

  return transactions;
};

// Initialize with default categories if empty
export const initializeStorage = (): void => {
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    saveCategories(getDefaultCategories());
  }
};
