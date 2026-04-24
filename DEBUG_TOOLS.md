# 🛠️ Troubleshooting e Debug Avançado

## 1. Verificar se Dexie está funcionando

```typescript
import { db } from "@/lib/db";

async function debugDexie() {
  console.log("🔧 Debug Dexie:");

  // Verificar se banco está aberto
  console.log("Banco aberto:", await db.isOpen());

  // Listar todas as tabelas
  console.log(
    "Tabelas:",
    db.tables.map((t) => t.name),
  );

  // Contar itens em cada tabela
  const counts = await Promise.all([
    db.categories.count(),
    db.creditCards.count(),
    db.transactions.count(),
    db.categoryLimits.count(),
  ]);

  console.log("Contagens:", {
    categories: counts[0],
    creditCards: counts[1],
    transactions: counts[2],
    categoryLimits: counts[3],
  });
}

debugDexie();
```

## 2. Monitorar todas as operações do banco

```typescript
import { db } from "@/lib/db";

// Hook para monitoramento
export function useDbMonitoring() {
  useEffect(() => {
    // Interceptar todas as operações
    const tables = db.tables;

    tables.forEach((table) => {
      const originalAdd = table.add.bind(table);
      const originalUpdate = table.update.bind(table);
      const originalDelete = table.delete.bind(table);

      table.add = async function (...args) {
        console.log(`📝 ADD ${table.name}:`, args);
        const result = await originalAdd(...args);
        console.log(`✅ ADD ${table.name} sucesso`);
        return result;
      };

      table.update = async function (...args) {
        console.log(`✏️  UPDATE ${table.name}:`, args);
        const result = await originalUpdate(...args);
        console.log(`✅ UPDATE ${table.name} sucesso`);
        return result;
      };

      table.delete = async function (...args) {
        console.log(`🗑️  DELETE ${table.name}:`, args);
        const result = await originalDelete(...args);
        console.log(`✅ DELETE ${table.name} sucesso`);
        return result;
      };
    });
  }, []);
}
```

## 3. Exportar dados para debug

```typescript
async function exportDataForDebug() {
  const [categories, creditCards, transactions, limits] = await Promise.all([
    db.categories.toArray(),
    db.creditCards.toArray(),
    db.transactions.toArray(),
    db.categoryLimits.toArray(),
  ]);

  const debug = {
    timestamp: new Date().toISOString(),
    stats: {
      categories: categories.length,
      creditCards: creditCards.length,
      transactions: transactions.length,
      limits: limits.length,
    },
    data: {
      categories,
      creditCards,
      transactions,
      limits,
    },
  };

  // Copiar para clipboard
  console.log(JSON.stringify(debug, null, 2));

  // Ou download
  const blob = new Blob([JSON.stringify(debug, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "debug-data.json";
  a.click();
}
```

## 4. Resetar banco (DELETE ALL)

```typescript
async function resetDatabase() {
  console.warn("⚠️  Resetando banco de dados...");

  try {
    await Promise.all([
      db.categories.clear(),
      db.creditCards.clear(),
      db.transactions.clear(),
      db.categoryLimits.clear(),
    ]);
    console.log("✅ Banco resetado!");
  } catch (error) {
    console.error("❌ Erro ao resetar:", error);
  }
}

// Chamar com confirmação
if (confirm("Tem certeza? Todos os dados serão deletados!")) {
  resetDatabase();
}
```

## 5. Verificar quota de storage

```typescript
async function checkStorageQuota() {
  if (!("storage" in navigator)) {
    console.log("❌ Storage API não disponível");
    return;
  }

  const estimate = await navigator.storage.estimate();
  const used = estimate.usage;
  const quota = estimate.quota;
  const percentage = (used / quota) * 100;

  console.log("📊 Storage Status:");
  console.log(`  Usado: ${(used / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Total: ${(quota / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Percentual: ${percentage.toFixed(2)}%`);

  if (percentage > 80) {
    console.warn("⚠️  Espaço de armazenamento quase cheio!");
  }
}

checkStorageQuota();
```

## 6. Limpar dados antigos

```typescript
async function cleanOldTransactions(daysOld: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  const cutoffString = cutoffDate.toISOString().split("T")[0];

  const deleted = await db.transactions
    .where("date")
    .below(cutoffString)
    .delete();

  console.log(`🗑️  ${deleted} transações antigas deletadas`);
}

// Usar: cleanOldTransactions(90) para deletar com mais de 90 dias
```

## 7. Validar integridade dos dados

```typescript
async function validateDataIntegrity() {
  console.log("🔍 Validando integridade dos dados...\n");

  const [categories, creditCards, transactions, limits] = await Promise.all([
    db.categories.toArray(),
    db.creditCards.toArray(),
    db.transactions.toArray(),
    db.categoryLimits.toArray(),
  ]);

  let issues = 0;

  // Verificar transações com categorias inválidas
  transactions.forEach((t) => {
    if (t.categoryId && !categories.find((c) => c.id === t.categoryId)) {
      console.warn(
        `⚠️  Transação ${t.id} refere categoria inexistente: ${t.categoryId}`,
      );
      issues++;
    }
  });

  // Verificar transações com cartões inválidos
  transactions.forEach((t) => {
    if (t.creditCardId && !creditCards.find((c) => c.id === t.creditCardId)) {
      console.warn(
        `⚠️  Transação ${t.id} refere cartão inexistente: ${t.creditCardId}`,
      );
      issues++;
    }
  });

  // Verificar limites com categorias inválidas
  limits.forEach((l) => {
    if (!categories.find((c) => c.id === l.categoryId)) {
      console.warn(`⚠️  Limite para categoria inexistente: ${l.categoryId}`);
      issues++;
    }
  });

  // Verificar instalments agrupadas
  const installmentGroups = new Map();
  transactions.forEach((t) => {
    if (t.installmentGroupId) {
      if (!installmentGroups.has(t.installmentGroupId)) {
        installmentGroups.set(t.installmentGroupId, []);
      }
      installmentGroups.get(t.installmentGroupId).push(t);
    }
  });

  installmentGroups.forEach((group, groupId) => {
    if (group.length !== group[0].totalInstallments) {
      console.warn(
        `⚠️  Grupo ${groupId} tem ${group.length} parcelas mas deveria ter ${group[0].totalInstallments}`,
      );
      issues++;
    }
  });

  if (issues === 0) {
    console.log("✅ Todos os dados estão íntegros!");
  } else {
    console.log(`\n❌ Encontrados ${issues} problemas!`);
  }
}

validateDataIntegrity();
```

## 8. Performance Profiling

```typescript
async function profileQueries() {
  console.log("⏱️  Profiling de queries...\n");

  // Teste 1: Contar transações
  console.time("count_transactions");
  const count = await db.transactions.count();
  console.timeEnd("count_transactions");
  console.log(`  Transações: ${count}`);

  // Teste 2: Buscar por mês
  console.time("query_month");
  const monthly = await db.transactions
    .where("effectiveMonth")
    .equals("2025-01")
    .toArray();
  console.timeEnd("query_month");
  console.log(`  Transações em janeiro: ${monthly.length}`);

  // Teste 3: Buscar por categoria
  console.time("query_category");
  const categoryTrans = await db.transactions
    .where("categoryId")
    .equals("1")
    .toArray();
  console.timeEnd("query_category");
  console.log(`  Transações categoria 1: ${categoryTrans.length}`);

  // Teste 4: Range query
  console.time("range_query");
  const range = await db.transactions
    .where("amount")
    .between(100, 1000)
    .toArray();
  console.timeEnd("range_query");
  console.log(`  Transações entre 100-1000: ${range.length}`);

  // Teste 5: Operação complexa
  console.time("complex_query");
  const complex = await db.transactions
    .where("date")
    .between("2025-01-01", "2025-01-31")
    .filter((t) => t.type === "expense" && t.amount > 50)
    .toArray();
  console.timeEnd("complex_query");
  console.log(`  Despesas > 50 em janeiro: ${complex.length}`);
}

profileQueries();
```

## 9. Migrar de localStorage para IndexedDB (se necessário)

```typescript
async function migrateFromLocalStorage() {
  console.log("🔄 Migrando dados de localStorage...\n");

  try {
    // Backup do localStorage
    const lsData = {
      categories: localStorage.getItem("finance_categories"),
      creditCards: localStorage.getItem("finance_credit_cards"),
      transactions: localStorage.getItem("finance_transactions"),
      limits: localStorage.getItem("finance_category_limits"),
    };

    // Parse
    const parsed = {
      categories: lsData.categories ? JSON.parse(lsData.categories) : [],
      creditCards: lsData.creditCards ? JSON.parse(lsData.creditCards) : [],
      transactions: lsData.transactions ? JSON.parse(lsData.transactions) : [],
      limits: lsData.limits ? JSON.parse(lsData.limits) : [],
    };

    // Salvar em IndexedDB
    await Promise.all([
      db.categories.bulkAdd(parsed.categories),
      db.creditCards.bulkAdd(parsed.creditCards),
      db.transactions.bulkAdd(parsed.transactions),
      db.categoryLimits.bulkAdd(parsed.limits),
    ]);

    console.log("✅ Migração concluída!");
    console.log(`  Categories: ${parsed.categories.length}`);
    console.log(`  Credit Cards: ${parsed.creditCards.length}`);
    console.log(`  Transactions: ${parsed.transactions.length}`);
    console.log(`  Limits: ${parsed.limits.length}`);

    // Opcional: deletar localStorage
    // localStorage.clear();
  } catch (error) {
    console.error("❌ Erro na migração:", error);
  }
}
```

## 10. Script de debugging completo

```typescript
// debug-db.ts
export async function fullDatabaseDebug() {
  console.clear();
  console.log("═══════════════════════════════════════");
  console.log("🔍 FULL DATABASE DEBUG");
  console.log("═══════════════════════════════════════\n");

  try {
    // 1. Status
    console.log("1️⃣  DATABASE STATUS");
    await checkStorageQuota();
    console.log("");

    // 2. Integridade
    console.log("2️⃣  DATA INTEGRITY");
    await validateDataIntegrity();
    console.log("");

    // 3. Performance
    console.log("3️⃣  PERFORMANCE");
    await profileQueries();
    console.log("");

    // 4. Estatísticas
    console.log("4️⃣  STATISTICS");
    const [c, cc, t, l] = await Promise.all([
      db.categories.toArray(),
      db.creditCards.toArray(),
      db.transactions.toArray(),
      db.categoryLimits.toArray(),
    ]);

    console.log(`Categories: ${c.length}`);
    console.log(`Credit Cards: ${cc.length}`);
    console.log(`Transactions: ${t.length}`);
    console.log(`Limits: ${l.length}`);
  } catch (error) {
    console.error("❌ Erro no debug:", error);
  }

  console.log("\n═══════════════════════════════════════");
}

// Chamar no console:
// import('./debug-db.ts').then(m => m.fullDatabaseDebug());
```

## Comandos no Console

```javascript
// Verificar banco
db.tables.map((t) => ({ name: t.name, count: t.count() }));

// Listar todas as transações
db.transactions.toArray().then((t) => console.table(t));

// Buscar categoria
db.categories.get("1").then((c) => console.log(c));

// Contar itens
Promise.all([
  db.categories.count(),
  db.creditCards.count(),
  db.transactions.count(),
  db.categoryLimits.count(),
]).then(console.log);

// Deletar tudo (CUIDADO!)
db.delete().then(() => location.reload());

// Ver tamanho
navigator.storage
  .estimate()
  .then((e) =>
    console.log(
      `${(e.usage / 1024 / 1024).toFixed(2)}MB / ${(e.quota / 1024 / 1024).toFixed(2)}MB`,
    ),
  );
```

---

**Ferramentas completas para debug! 🛠️**
