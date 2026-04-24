# Migração de LocalStorage para IndexedDB (Dexie.js)

## 📊 Resumo das Mudanças

Sua aplicação PWA agora usa **Dexie.js** para armazenar dados em um banco de dados local IndexedDB ao invés de localStorage.

## ✅ O que foi feito:

### 1. **Criado novo arquivo de banco de dados** (`src/lib/db.ts`)

- Schema do Dexie com todas as tabelas necessárias
- Índices otimizados para consultas rápidas
- Função de inicialização com dados padrão

### 2. **Atualizado `src/lib/storage.ts`**

- Todas as funções agora são **async** e usam Dexie
- Novas funções de CRUD individual:
  - `addCategory()`, `updateCategory()`, `deleteCategory()`
  - `addCreditCard()`, `updateCreditCard()`, `deleteCreditCard()`
  - `addTransaction()`, `updateTransaction()`, `deleteTransaction()`
- Funções de consulta avançadas:
  - `getTransactionsByMonth()`
  - `getTransactionsByCategory()`
  - `getTransactionsByCreditCard()`
  - `saveCategoryLimit()`

### 3. **Atualizado hook `useFinanceData.ts`**

- Callbacks agora são **async**
- Carregamento de dados no mount via Promise.all() para melhor performance
- Novo método síncrono `getCategoryLimitSync()` para componentes que precisam de dados em cache
- Adicionado estado `isLoading` para controlar carregamento

### 4. **Atualizado `Dashboard.tsx`**

- Removida importação de `getCategoryLimit` síncrono
- Usando novo `getCategoryLimitSync` do hook

## 🎯 Benefícios

| Recurso           | localStorage           | IndexedDB (Dexie)     |
| ----------------- | ---------------------- | --------------------- |
| **Espaço**        | ~5-10MB                | 50MB+                 |
| **Velocidade**    | Lenta com muitos dados | ⚡ Muito rápida       |
| **Índices**       | Nenhum                 | Sim, otimizado        |
| **Queries**       | Apenas JSON parse      | SQL-like              |
| **PWA Offline**   | Sim                    | Sim (melhor)          |
| **Sincronização** | Manual                 | Suporta sincronização |

## 🚀 Como usar

### Suas funções continuam funcionando igual, mas agora são async:

```typescript
// Antes (localStorage)
const categories = getCategories(); // Síncrono

// Agora (IndexedDB)
const categories = await getCategories(); // Async

// No seu hook, tudo já está tratado automaticamente!
const { categories, addCategory, updateCategory } = useFinanceData();

// Você pode usar o hook normalmente, ele cuida das operações async:
await addCategory({ name: "Nova", defaultLimit: 500, color: "#fff" });
```

### Usando as novas funções de CRUD:

```typescript
// Importar do storage
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/storage";

// Usar diretamente:
await addTransaction(transaction);
await updateTransaction(transaction);
await deleteTransaction(transactionId);
```

### Consultando com índices:

```typescript
import {
  getTransactionsByMonth,
  getTransactionsByCategory,
  getTransactionsByCreditCard,
} from "@/lib/storage";

// Rápido! Usa índices do banco
const monthTransactions = await getTransactionsByMonth("2025-01");
const categoryTransactions = await getTransactionsByCategory("1");
const cardTransactions = await getTransactionsByCreditCard("card-123");
```

## 📋 Schema do Banco de Dados

```typescript
{
  categories: 'id',  // Índice primário
  categoryLimits: '++, categoryId, month',  // Índices para buscas rápidas
  creditCards: 'id',
  transactions: 'id, effectiveMonth, categoryId, creditCardId, date'  // Múltiplos índices
}
```

## 🔄 Dados Offline

A aplicação funciona **100% offline**:

- ✅ Todos os dados salvos em IndexedDB
- ✅ Funciona sem conexão com internet
- ✅ Dados sincronizam quando voltar online (se implementado)

## 📱 Compatibilidade

- ✅ Chrome/Edge (IndexedDB completo)
- ✅ Firefox (IndexedDB completo)
- ✅ Safari (IndexedDB funcionando)
- ✅ PWAs em Android/iOS

## 🎓 Próximos Passos Opcionais

Se quiser adicionar sincronização com servidor:

```typescript
// Exportar dados para backup
async function exportData() {
  const [cats, cards, trans, limits] = await Promise.all([
    getCategories(),
    getCreditCards(),
    getTransactions(),
    getCategoryMonthlyLimits(),
  ]);
  return { categories: cats, creditCards: cards, transactions: trans, limits };
}

// Importar dados do servidor
async function syncWithServer(serverData) {
  await saveCategories(serverData.categories);
  // ... etc
}
```

## 📦 Dependências

- ✅ **dexie**: ^4.2.1 (já instalado)

Nenhuma dependência adicional necessária!

---

**Tudo está funcionando!** A aplicação PWA está pronta com IndexedDB como banco de dados local. 🎉
