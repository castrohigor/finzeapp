# 🚀 Guia de Deploy e Produção

## Antes de Deploy

### 1. Verificar Build
```bash
npm run build
# Deve compilar sem erros ✅
```

### 2. Testar Preview
```bash
npm run preview
# Abrir em http://localhost:4173
# Verificar no DevTools > Application > IndexedDB
```

### 3. Validar Dados
```bash
npm run test
# Testes devem passar ✅
```

## Build Otimizado

### Produção
```bash
# Build padrão (otimizado automaticamente)
npm run build

# Resultado em dist/
# - CSS minificado
# - JS minificado
# - Assets otimizados
```

### Desenvolvimento
```bash
npm run dev
# Hot reload ativado
```

## Configuração de Servidor

### Headers Recomendados

#### HTTPS (Obrigatório para PWA)
```
Strict-Transport-Security: max-age=31536000
```

#### Cache Control
```
# Arquivos estáticos
Cache-Control: public, max-age=31536000

# Service Worker
Cache-Control: no-cache, must-revalidate

# index.html
Cache-Control: no-cache, must-revalidate
```

#### CORS (Se usar API)
```
Access-Control-Allow-Origin: https://seu-dominio.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type
```

## Monitoramento IndexedDB

### Tamanho do Banco
```javascript
// Adicionar ao App.tsx para monitoramento
import { useEffect } from 'react';

export function MonitorStorage() {
  useEffect(() => {
    if ('storage' in navigator) {
      navigator.storage.estimate().then(estimate => {
        const used = estimate.usage / 1024 / 1024;
        const quota = estimate.quota / 1024 / 1024;
        const percent = (used / quota * 100).toFixed(2);
        
        console.log(`💾 Storage: ${used.toFixed(2)}MB / ${quota.toFixed(2)}MB (${percent}%)`);
        
        if (percent > 80) {
          console.warn('⚠️ Storage almost full!');
        }
      });
    }
  }, []);
  
  return null; // Invisible component
}
```

### Uso no App
```tsx
import { MonitorStorage } from '@/components/MonitorStorage';

function App() {
  return (
    <>
      <MonitorStorage />
      {/* resto da app */}
    </>
  );
}
```

## Estratégia de Sincronização (Opcional)

Se quiser sincronizar com servidor:

### Estrutura Backend Sugerida

```typescript
// POST /api/sync
export async function handleSync(userData) {
  // Verificar timestamp último sync
  const lastSync = await getLastSyncTime(userId);
  
  // Sincronizar dados
  const data = {
    categories: userData.categories,
    creditCards: userData.creditCards,
    transactions: userData.transactions.filter(t => t.date > lastSync),
    limits: userData.limits
  };
  
  // Salvar no servidor
  await saveUserData(userId, data);
  
  // Retornar dados do servidor
  return getServerData(userId);
}
```

### Client-Side Sync
```typescript
// src/hooks/useSyncData.ts
import { useEffect } from 'react';
import { useFinanceData } from './useFinanceData';

export function useSyncData() {
  const { categories, transactions, creditCards } = useFinanceData();
  
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        if (!navigator.onLine) return; // Skip offline
        
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categories, transactions, creditCards })
        });
        
        if (response.ok) {
          console.log('✅ Sincronizado com servidor');
        }
      } catch (error) {
        console.warn('⚠️ Sync falhou, tentando novamente...');
      }
    }, 5 * 60 * 1000); // A cada 5 minutos
    
    return () => clearInterval(syncInterval);
  }, [categories, transactions, creditCards]);
}

// Usar no App.tsx
function App() {
  useSyncData(); // Sincronizar periodicamente
}
```

## Backup Automático

### Estratégia Diária
```typescript
// src/utils/backup.ts
export async function setupAutoBackup() {
  const BACKUP_KEY = 'lastBackup';
  const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas
  
  const lastBackup = localStorage.getItem(BACKUP_KEY);
  const now = Date.now();
  
  if (!lastBackup || now - parseInt(lastBackup) > BACKUP_INTERVAL) {
    await createBackup();
    localStorage.setItem(BACKUP_KEY, now.toString());
  }
}

async function createBackup() {
  const [cats, cards, trans, limits] = await Promise.all([
    getCategories(),
    getCreditCards(),
    getTransactions(),
    getCategoryMonthlyLimits()
  ]);
  
  const backup = {
    date: new Date().toISOString(),
    categories: cats,
    creditCards: cards,
    transactions: trans,
    limits
  };
  
  // Salvar em IndexedDB como backup
  localStorage.setItem('backup_' + Date.now(), JSON.stringify(backup));
  
  // Manter apenas últimos 7 backups
  cleanOldBackups();
}

function cleanOldBackups() {
  const keys = Object.keys(localStorage)
    .filter(k => k.startsWith('backup_'))
    .sort()
    .reverse();
  
  keys.slice(7).forEach(key => localStorage.removeItem(key));
}
```

### Usar no App.tsx
```tsx
import { setupAutoBackup } from '@/utils/backup';

function App() {
  useEffect(() => {
    setupAutoBackup();
  }, []);
}
```

## Logs e Debugging Produção

### Logger Estruturado
```typescript
// src/utils/logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

const isDev = import.meta.env.DEV;

export function log(level: LogLevel, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}]`;
  
  const levelName = LogLevel[level];
  
  const logData = {
    timestamp,
    level: levelName,
    message,
    data,
    userAgent: navigator.userAgent
  };
  
  if (isDev) {
    console.log(prefix, levelName, message, data);
  } else {
    // Em produção, enviar para servidor
    sendLogToServer(logData);
  }
}

async function sendLogToServer(logData: any) {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    });
  } catch (e) {
    // Falha silenciosa - não quer quebrar app por logs
  }
}

// Usar
import { log, LogLevel } from '@/utils/logger';

log(LogLevel.INFO, 'Transação adicionada', { id: '123' });
log(LogLevel.ERROR, 'Erro ao sincronizar', error);
```

## Performance Monitoring

### Web Vitals
```typescript
// src/utils/vitals.ts
export function measureWebVitals() {
  // Cumulative Layout Shift
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('CLS:', entry);
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {}
  }
  
  // First Input Delay
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('FID:', entry);
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {}
  }
}
```

## Checklist de Deploy

- [ ] Build sem erros: `npm run build`
- [ ] Testes passando: `npm run test`
- [ ] HTTPS habilitado
- [ ] Service Worker registrado
- [ ] manifest.json válido
- [ ] Ícones PWA configurados
- [ ] Headers corretos
- [ ] IndexedDB operacional
- [ ] Offline funcional
- [ ] Backups automáticos configurados

## Monitoramento em Produção

### Métricas Chave
```typescript
interface ProdMetrics {
  indexedDBSize: number;
  syncSuccess: number;
  syncFailure: number;
  userErrors: number;
  avgLoadTime: number;
}
```

### Dashboard Recomendado
- Google Analytics (User behavior)
- Sentry (Error tracking)
- DataDog (Performance monitoring)
- Custom dashboard (Métricas do app)

## Troubleshooting Produção

### Problema: IndexedDB quotaExceeded
```typescript
// Limpar transações antigas
async function cleanOldData() {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  
  await db.transactions
    .where('date')
    .below(cutoff.toISOString())
    .delete();
}
```

### Problema: Sync falha constantemente
```typescript
// Implementar retry com backoff exponencial
async function syncWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await performSync();
    } catch (error) {
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Sync failed after retries');
}
```

### Problema: Usuário com dados corrompidos
```typescript
// Opção 1: Limpar e recarregar do servidor
async function recoverData() {
  await db.delete();
  return fetch('/api/data').then(r => r.json());
}

// Opção 2: Fazer rollback para último backup
async function restoreLastBackup() {
  const backup = JSON.parse(localStorage.getItem('backup_latest') || '{}');
  if (backup.transactions) {
    // Restaurar...
  }
}
```

## Atualizações Futuras

### v2.0: Sincronização em Tempo Real
- WebSocket para updatesinstantâneos
- Conflito resolution
- Offline queue

### v3.0: Analytics
- Dashboard de despesas
- Previsões de gastos
- Recomendações

### v4.0: Mobile Native
- React Native app
- Push notifications
- Biometria

---

**Seu app está pronto para produção! 🚀**
