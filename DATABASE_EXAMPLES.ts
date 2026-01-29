// Exemplos de uso do novo sistema de banco de dados com Dexie.js

import { 
  getCategories, 
  getCreditCards, 
  getTransactions,
  addTransaction,
  getTransactionsByMonth,
  getTransactionsByCategory,
  saveCategoryLimit,
  getCategoryMonthlyLimits,
} from '@/lib/storage';
import { db } from '@/lib/db';
import { Transaction, CreditCard } from '@/types/finance';

/**
 * EXEMPLO 1: Carregar todos os dados
 */
export async function loadAllData() {
  console.log('Carregando dados do IndexedDB...');
  
  const [categories, creditCards, transactions, limits] = await Promise.all([
    getCategories(),
    getCreditCards(),
    getTransactions(),
    getCategoryMonthlyLimits(),
  ]);

  console.log('✅ Categorias:', categories.length);
  console.log('✅ Cartões:', creditCards.length);
  console.log('✅ Transações:', transactions.length);
  console.log('✅ Limites mensuais:', limits.length);
  
  return { categories, creditCards, transactions, limits };
}

/**
 * EXEMPLO 2: Adicionar uma transação com parcelas
 */
export async function addInstallmentTransaction() {
  const transaction: Transaction = {
    id: crypto.randomUUID(),
    description: 'Notebook - Parcelado em 3x',
    amount: 3000,
    type: 'expense',
    date: '2025-01-28',
    categoryId: '1', // Alimentação (exemplo)
    creditCardId: 'card-1',
    effectiveMonth: '2025-01',
    installmentNumber: 1,
    totalInstallments: 3,
    installmentGroupId: crypto.randomUUID(),
  };

  await addTransaction(transaction);
  console.log('✅ Transação adicionada!');
}

/**
 * EXEMPLO 3: Buscar transações de um mês específico
 */
export async function getMonthData(month: string = '2025-01') {
  console.log(`\n📅 Transações do mês ${month}:`);
  
  const transactions = await getTransactionsByMonth(month);
  
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  console.log(`  💰 Receita: R$ ${income.toFixed(2)}`);
  console.log(`  💸 Despesa: R$ ${expenses.toFixed(2)}`);
  console.log(`  📊 Saldo: R$ ${(income - expenses).toFixed(2)}`);
  
  return { income, expenses, balance: income - expenses, transactions };
}

/**
 * EXEMPLO 4: Obter despesas por categoria
 */
export async function getCategoryExpenses(categoryId: string, categoryName: string) {
  console.log(`\n📂 Despesas em "${categoryName}":`);
  
  const transactions = await getTransactionsByCategory(categoryId);
  
  const total = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  console.log(`  Total: R$ ${total.toFixed(2)}`);
  console.log(`  Transações: ${transactions.length}`);
  
  transactions.slice(0, 5).forEach(t => {
    console.log(`    - ${t.description}: R$ ${t.amount.toFixed(2)}`);
  });
  
  return { total, transactions };
}

/**
 * EXEMPLO 5: Definir limite mensal para uma categoria
 */
export async function setMonthlyLimit(categoryId: string, month: string, limit: number) {
  console.log(`\n⚙️  Definindo limite de R$ ${limit.toFixed(2)} para categoria ${categoryId} em ${month}`);
  
  await saveCategoryLimit({
    categoryId,
    month,
    limit,
  });
  
  console.log('✅ Limite salvo!');
}

/**
 * EXEMPLO 6: Consultas avançadas com Dexie
 */
export async function advancedQueries() {
  console.log('\n🔍 Consultas avançadas:');
  
  // Transações de uma data específica
  const dateTransactions = await db.transactions
    .where('date')
    .equals('2025-01-28')
    .toArray();
  
  console.log(`  Transações em 28/01/2025: ${dateTransactions.length}`);
  
  // Transações em range de datas (usando índice)
  const rangeTransactions = await db.transactions
    .where('date')
    .between('2025-01-01', '2025-01-31')
    .toArray();
  
  console.log(`  Transações de janeiro: ${rangeTransactions.length}`);
  
  // Filtrar despesas de uma categoria
  const categoryExpenses = await db.transactions
    .where('categoryId')
    .equals('1')
    .filter(t => t.type === 'expense')
    .toArray();
  
  console.log(`  Despesas da categoria 1: ${categoryExpenses.length}`);
  
  // Contar transações agrupadas
  const cardTransactions = await db.transactions
    .where('creditCardId')
    .notEqual(undefined)
    .toArray();
  
  console.log(`  Transações com cartão: ${cardTransactions.length}`);
}

/**
 * EXEMPLO 7: Backup e restauração
 */
export async function backupDatabase() {
  console.log('\n💾 Fazendo backup...');
  
  const [categories, creditCards, transactions, limits] = await Promise.all([
    getCategories(),
    getCreditCards(),
    getTransactions(),
    getCategoryMonthlyLimits(),
  ]);
  
  const backup = {
    version: 1,
    exportDate: new Date().toISOString(),
    data: {
      categories,
      creditCards,
      transactions,
      limits,
    },
  };
  
  // Converter para JSON para download
  const json = JSON.stringify(backup, null, 2);
  console.log('✅ Backup pronto!');
  console.log(`  Tamanho: ${(json.length / 1024).toFixed(2)}KB`);
  
  return backup;
}

/**
 * EXEMPLO 8: Limpar dados do banco
 */
export async function clearDatabase() {
  console.log('\n🗑️  Limpando banco de dados...');
  
  await db.categories.clear();
  await db.creditCards.clear();
  await db.transactions.clear();
  await db.categoryLimits.clear();
  
  console.log('✅ Banco limpo!');
}

// ========== EXECUÇÃO ==========

// Descomentar para testar:
/*
(async () => {
  try {
    await loadAllData();
    await getMonthData('2025-01');
    await getCategoryExpenses('1', 'Alimentação');
    await advancedQueries();
    await backupDatabase();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
})();
*/
