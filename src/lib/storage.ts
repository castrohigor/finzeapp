import { Category, CategoryMonthlyLimit, CreditCard, Transaction } from '@/types/finance';
import { db, getDefaultCategories } from './db';

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const categories = await db.categories.toArray();
  return categories.length > 0 ? categories : getDefaultCategories();
};

export const saveCategories = async (categories: Category[]): Promise<void> => {
  await db.categories.clear();
  await db.categories.bulkAdd(categories);
};

export const addCategory = async (category: Category): Promise<void> => {
  await db.categories.add(category);
};

export const updateCategory = async (category: Category): Promise<void> => {
  await db.categories.update(category.id, category);
};

export const deleteCategory = async (id: string): Promise<void> => {
  await db.categories.delete(id);
};

// Category Monthly Limits
export const getCategoryMonthlyLimits = async (): Promise<CategoryMonthlyLimit[]> => {
  return await db.categoryLimits.toArray();
};

export const saveCategoryMonthlyLimits = async (limits: CategoryMonthlyLimit[]): Promise<void> => {
  await db.categoryLimits.clear();
  await db.categoryLimits.bulkAdd(limits);
};

export const getCategoryLimit = async (categoryId: string, month: string): Promise<number> => {
  const monthlyLimits = await getCategoryMonthlyLimits();
  const specificLimit = monthlyLimits.find(
    (l) => l.categoryId === categoryId && l.month === month
  );
  if (specificLimit) return specificLimit.limit;

  const categories = await getCategories();
  const category = categories.find((c) => c.id === categoryId);
  return category?.defaultLimit || 0;
};

export const saveCategoryLimit = async (limit: CategoryMonthlyLimit): Promise<void> => {
  const existing = await db.categoryLimits
    .where('categoryId')
    .equals(limit.categoryId)
    .filter(l => l.month === limit.month)
    .first();
  
  if (existing) {
    const key = await db.categoryLimits.add(limit);
    await db.categoryLimits.update(key, limit);
  } else {
    await db.categoryLimits.add(limit);
  }
};

// Credit Cards
export const getCreditCards = async (): Promise<CreditCard[]> => {
  return await db.creditCards.toArray();
};

export const saveCreditCards = async (cards: CreditCard[]): Promise<void> => {
  await db.creditCards.clear();
  await db.creditCards.bulkAdd(cards);
};

export const addCreditCard = async (card: CreditCard): Promise<void> => {
  await db.creditCards.add(card);
};

export const updateCreditCard = async (card: CreditCard): Promise<void> => {
  await db.creditCards.update(card.id, card);
};

export const deleteCreditCard = async (id: string): Promise<void> => {
  await db.creditCards.delete(id);
};

// Transactions
export const getTransactions = async (): Promise<Transaction[]> => {
  return await db.transactions.toArray();
};

export const saveTransactions = async (transactions: Transaction[]): Promise<void> => {
  await db.transactions.clear();
  await db.transactions.bulkAdd(transactions);
};

export const addTransaction = async (transaction: Transaction): Promise<void> => {
  await db.transactions.add(transaction);
};

export const updateTransaction = async (transaction: Transaction): Promise<void> => {
  await db.transactions.update(transaction.id, transaction);
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await db.transactions.delete(id);
};

export const getTransactionsByMonth = async (month: string): Promise<Transaction[]> => {
  return await db.transactions
    .where('effectiveMonth')
    .equals(month)
    .toArray();
};

export const getTransactionsByCategory = async (categoryId: string): Promise<Transaction[]> => {
  return await db.transactions
    .where('categoryId')
    .equals(categoryId)
    .toArray();
};

export const getTransactionsByCreditCard = async (creditCardId: string): Promise<Transaction[]> => {
  return await db.transactions
    .where('creditCardId')
    .equals(creditCardId)
    .toArray();
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
