import Dexie, { Table } from 'dexie';
import { Category, CategoryMonthlyLimit, CreditCard, Transaction } from '@/types/finance';

export class FinanceDatabase extends Dexie {
  categories!: Table<Category>;
  categoryLimits!: Table<CategoryMonthlyLimit>;
  creditCards!: Table<CreditCard>;
  transactions!: Table<Transaction>;

  constructor() {
    super('FinanceDB');
    this.version(1).stores({
      categories: 'id',
      categoryLimits: '++, categoryId, month',
      creditCards: 'id',
      transactions: 'id, effectiveMonth, categoryId, creditCardId, date',
    });
  }
}

export const db = new FinanceDatabase();

// Initialize database with default categories if empty
export const initializeDatabase = async () => {
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkAdd(getDefaultCategories());
  }
};

// Default categories
const getDefaultCategories = (): Category[] => [
  { id: '1', name: 'Alimentação', defaultLimit: 800, color: '#10b981' },
  { id: '2', name: 'Transporte', defaultLimit: 400, color: '#3b82f6' },
  { id: '3', name: 'Moradia', defaultLimit: 2000, color: '#8b5cf6' },
  { id: '4', name: 'Lazer', defaultLimit: 300, color: '#f59e0b' },
  { id: '5', name: 'Saúde', defaultLimit: 500, color: '#ec4899' },
  { id: '6', name: 'Educação', defaultLimit: 400, color: '#06b6d4' },
];

export { getDefaultCategories };
