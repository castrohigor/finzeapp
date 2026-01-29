import { useState, useEffect, useCallback } from 'react';
import {
  Category,
  CategoryMonthlyLimit,
  CreditCard,
  Transaction,
  MonthlyBalance,
} from '@/types/finance';
import {
  getCategories,
  saveCategories,
  getCategoryMonthlyLimits,
  saveCategoryMonthlyLimits,
  getCategoryLimit,
  getCreditCards,
  saveCreditCards,
  getTransactions,
  saveTransactions,
} from '@/lib/storage';
import { db, initializeDatabase } from '@/lib/db';

export const useFinanceData = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLimits, setCategoryLimits] = useState<CategoryMonthlyLimit[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await initializeDatabase();
        const [categoriesData, limitsData, cardsData, transactionsData] = await Promise.all([
          getCategories(),
          getCategoryMonthlyLimits(),
          getCreditCards(),
          getTransactions(),
        ]);
        setCategories(categoriesData);
        setCategoryLimits(limitsData);
        setCreditCards(cardsData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error loading data from database:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Categories
  const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    const newCategory = { ...category, id: crypto.randomUUID() };
    const updated = [...categories, newCategory];
    setCategories(updated);
    await saveCategories(updated);
    return newCategory;
  }, [categories]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    const updated = categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCategories(updated);
    await saveCategories(updated);
  }, [categories]);

  const deleteCategory = useCallback(async (id: string) => {
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    await saveCategories(updated);
  }, [categories]);

  // Category Monthly Limits
  const setCategoryMonthlyLimit = useCallback(async (categoryId: string, month: string, limit: number) => {
    const existing = categoryLimits.findIndex(
      (l) => l.categoryId === categoryId && l.month === month
    );
    let updated: CategoryMonthlyLimit[];
    if (existing >= 0) {
      updated = [...categoryLimits];
      updated[existing] = { categoryId, month, limit };
    } else {
      updated = [...categoryLimits, { categoryId, month, limit }];
    }
    setCategoryLimits(updated);
    await saveCategoryMonthlyLimits(updated);
  }, [categoryLimits]);

  // Credit Cards
  const addCreditCard = useCallback(async (card: Omit<CreditCard, 'id'>) => {
    const newCard = { ...card, id: crypto.randomUUID() };
    const updated = [...creditCards, newCard];
    setCreditCards(updated);
    await saveCreditCards(updated);
    return newCard;
  }, [creditCards]);

  const updateCreditCard = useCallback(async (id: string, updates: Partial<CreditCard>) => {
    const updated = creditCards.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCreditCards(updated);
    await saveCreditCards(updated);
  }, [creditCards]);

  const deleteCreditCard = useCallback(async (id: string) => {
    const updated = creditCards.filter((c) => c.id !== id);
    setCreditCards(updated);
    await saveCreditCards(updated);
  }, [creditCards]);

  // Transactions
  const addTransaction = useCallback(async (transaction: Transaction | Transaction[]) => {
    const newTransactions = Array.isArray(transaction) ? transaction : [transaction];
    const updated = [...transactions, ...newTransactions];
    setTransactions(updated);
    await saveTransactions(updated);
  }, [transactions]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    const updated = transactions.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTransactions(updated);
    await saveTransactions(updated);
  }, [transactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    const transaction = transactions.find((t) => t.id === id);
    let updated: Transaction[];
    
    // If it's part of an installment group, delete all installments
    if (transaction?.installmentGroupId) {
      updated = transactions.filter(
        (t) => t.installmentGroupId !== transaction.installmentGroupId
      );
    } else {
      updated = transactions.filter((t) => t.id !== id);
    }
    
    setTransactions(updated);
    await saveTransactions(updated);
  }, [transactions]);

  // Calculate monthly balance
  const getMonthlyBalance = useCallback((month: string): MonthlyBalance => {
    const monthTransactions = transactions.filter((t) => t.effectiveMonth === month);
    
    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryExpenses: Record<string, number> = {};
    monthTransactions
      .filter((t) => t.type === 'expense' && t.categoryId)
      .forEach((t) => {
        categoryExpenses[t.categoryId!] = (categoryExpenses[t.categoryId!] || 0) + t.amount;
      });

    // Calculate previous month balance
    const [year, monthNum] = month.split('-').map(Number);
    const prevMonth = monthNum === 1
      ? `${year - 1}-12`
      : `${year}-${String(monthNum - 1).padStart(2, '0')}`;
    
    const prevBalance = getPreviousMonthBalance(prevMonth);

    return {
      month,
      income,
      expenses,
      balance: prevBalance + income - expenses,
      previousBalance: prevBalance,
      categoryExpenses,
    };
  }, [transactions]);

  const getPreviousMonthBalance = useCallback((month: string): number => {
    // Recursive calculation - in production, you'd want to cache this
    const [year, monthNum] = month.split('-').map(Number);
    
    // Base case: before app started, assume 0
    if (year < 2020) return 0;

    const monthTransactions = transactions.filter((t) => t.effectiveMonth === month);
    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const prevMonth = monthNum === 1
      ? `${year - 1}-12`
      : `${year}-${String(monthNum - 1).padStart(2, '0')}`;

    // Limit recursion depth
    const prevBalance = year > 2023 ? getPreviousMonthBalance(prevMonth) : 0;

    return prevBalance + income - expenses;
  }, [transactions]);

  // Get credit card balance for a month
  const getCreditCardBalance = useCallback((cardId: string, month: string): number => {
    return transactions
      .filter(
        (t) =>
          t.creditCardId === cardId &&
          t.effectiveMonth === month &&
          t.type === 'expense'
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Check if category is over limit
  const isCategoryOverLimit = useCallback((categoryId: string, month: string): boolean => {
    const balance = getMonthlyBalance(month);
    const spent = balance.categoryExpenses[categoryId] || 0;
    const limit = getCategoryLimitSync(categoryId, month);
    return spent > limit;
  }, [getMonthlyBalance]);

  // Get category limit synchronously (from cached data)
  const getCategoryLimitSync = useCallback((categoryId: string, month: string): number => {
    const specificLimit = categoryLimits.find(
      (l) => l.categoryId === categoryId && l.month === month
    );
    if (specificLimit) return specificLimit.limit;

    const category = categories.find((c) => c.id === categoryId);
    return category?.defaultLimit || 0;
  }, [categoryLimits, categories]);

  // Get transactions for a month
  const getMonthTransactions = useCallback((month: string): Transaction[] => {
    return transactions
      .filter((t) => t.effectiveMonth === month)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  return {
    categories,
    categoryLimits,
    creditCards,
    transactions,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    setCategoryMonthlyLimit,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getMonthlyBalance,
    getCreditCardBalance,
    isCategoryOverLimit,
    getMonthTransactions,
    getCategoryLimitSync,
  };
};
