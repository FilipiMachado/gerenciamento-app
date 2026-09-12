# Documentação Técnica - Gerenciamento Pessoal

## Visão Geral

WebApp de gerenciamento pessoal desenvolvido com foco em Mobile First, permitindo controle de lista de compras e finanças pessoais. O aplicativo é privado e utiliza autenticação via Google OAuth com sistema de whitelist.

---

## Arquitetura do Projeto

### Stack Tecnológica

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth (Google OAuth)
- **Ícones**: Lucide React
- **Hospedagem**: Vercel

### Padrão de Arquitetura

O projeto segue o padrão **Client-Side Rendering** com componentes React que interagem diretamente com o Supabase via SDK. Não há API customizada - toda a comunicação com o banco de dados é feita através do cliente Supabase.

---

## Estrutura de Arquivos

```
gerenciamento-app/
├── src/
│   ├── app/                      # App Router do Next.js
│   │   ├── dashboard/            # Página principal após login
│   │   │   └── page.tsx         # Verifica whitelist e mostra menu
│   │   ├── login/                # Página de login
│   │   │   └── page.tsx         # Botão Google OAuth
│   │   ├── shopping-list/        # Funcionalidade 1: Lista de Compras
│   │   │   └── page.tsx         # CRUD de itens de compra
│   │   ├── financial/            # Funcionalidade 2: Controle Financeiro
│   │   │   └── page.tsx         # Limites e despesas
│   │   ├── history/              # Funcionalidade 3: Histórico
│   │   │   └── page.tsx         # Relatórios mensais
│   │   ├── auth/
│   │   │   └── callback/         # Callback OAuth do Google
│   │   │       └── page.tsx     # Processa login e redireciona
│   │   ├── layout.tsx            # Layout raiz da aplicação
│   │   ├── page.tsx              # Home page (redireciona)
│   │   └── globals.css           # Estilos globais Tailwind
│   ├── components/               # Componentes reutilizáveis (vazio atualmente)
│   ├── lib/
│   │   └── supabase.ts           # Cliente Supabase singleton
│   ├── types/
│   │   └── index.ts              # Definições TypeScript
│   └── middleware.ts             # Middleware Next.js (simplificado)
├── public/                       # Arquivos estáticos
├── supabase-schema.sql           # Script SQL do banco de dados
├── DOCUMENTACAO.md               # Este arquivo
└── README.md                     # Instruções de setup
```

---

## Fluxo de Autenticação

### 1. Login com Google

**Arquivo**: `src/app/login/page.tsx`

```typescript
// Usuário clica no botão "Entrar com o Google"
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

**O que acontece**:
- Supabase redireciona para o Google OAuth
- Google autentica o usuário
- Google redireciona de volta para `/auth/callback`

### 2. Callback OAuth

**Arquivo**: `src/app/auth/callback/page.tsx`

```typescript
// Aguarda 500ms para Supabase processar
await new Promise(resolve => setTimeout(resolve, 500))

// Busca sessão estabelecida
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  router.push('/dashboard')  // Redireciona para dashboard
} else {
  router.push('/login')      // Falha, volta para login
}
```

**O que acontece**:
- Supabase processa o callback OAuth
- Estabelece sessão via cookies
- Redireciona para dashboard se sucesso

### 3. Verificação de Whitelist

**Arquivo**: `src/app/dashboard/page.tsx`

```typescript
// Busca usuário na tabela allowed_users
const { data: allowedUser } = await supabase
  .from('allowed_users')
  .select('*')
  .eq('email', session.user.email)
  .eq('is_active', true)
  .single()

if (!allowedUser) {
  // Mostra tela "Acesso não autorizado"
  return
}

// Mostra dashboard normalmente
```

**O que acontece**:
- Verifica se e-mail está na whitelist
- Se não estiver, bloqueia acesso
- Se estiver, mostra dashboard

---

## Funcionalidade 1: Lista de Compras

### Arquivo: `src/app/shopping-list/page.tsx`

### Estrutura de Dados

**Tabela Supabase**: `shopping_list`

```typescript
interface ShoppingListItem {
  id: string
  user_id: string
  item_name: string
  quantity: number
  estimated_value: number
  is_purchased: boolean
  created_at: string
  updated_at: string
}
```

### Validações

**Constantes de Validação**:
```typescript
const VALIDATION = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 9,
  MAX_NAME_LENGTH: 50,
  TOAST_DURATION: 3000
} as const
```

**Regras de Validação**:
- Nome do item: obrigatório, máximo 50 caracteres
- Quantidade: obrigatória, entre 1 e 9
- Valor estimado: opcional, formato BRL
- Verificação de duplicatas com confirmação do usuário

### Operações CRUD

#### CREATE (Adicionar Item)
```typescript
// Validação antes de inserir
if (!isValidItem(newItem.item_name, newItem.quantity)) return

// Verifica duplicatas
const isDuplicate = checkForDuplicates(newItem.item_name)
if (isDuplicate && !confirmDuplicate(newItem.item_name, 'add')) return

await supabase
  .from('shopping_list')
  .insert({
    user_id: session.user.id,
    item_name: newItem.item_name.trim(),
    quantity: newItem.quantity,
    estimated_value: newItem.estimated_value
  })
```

#### READ (Buscar Itens)
```typescript
await supabase
  .from('shopping_list')
  .select('*')
  .eq('user_id', session.user.id)
  .order('is_purchased', { ascending: true })  // Não comprados primeiro
  .order('created_at', { ascending: true })
```

#### UPDATE (Marcar como Comprado/Editar)
```typescript
// Toggle purchased
await supabase
  .from('shopping_list')
  .update({ is_purchased: !isPurchased })
  .eq('id', id)

// Editar item (com validação)
if (!isValidItem(item.item_name, item.quantity)) return

const isDuplicate = checkForDuplicates(item.item_name, id)
if (isDuplicate && !confirmDuplicate(item.item_name, 'edit')) return

await supabase
  .from('shopping_list')
  .update({
    item_name: item.item_name.trim(),
    quantity: item.quantity,
    estimated_value: item.estimated_value
  })
  .eq('id', id)
```

#### DELETE (Remover Item)
```typescript
await supabase
  .from('shopping_list')
  .delete()
  .eq('id', id)
```

### Cálculos em Tempo Real

```typescript
// Valor total estimado
const calculateTotal = () => {
  return items.reduce((total, item) => 
    total + (item.quantity * item.estimated_value), 0
  )
}
```

### Funcionalidades de UX

#### Toast Notification
Sistema nativo de notificações com 3 tipos:
- `success`: verde, ícone Check
- `error`: vermelho, ícone AlertCircle
- `warning`: amarelo

Duração: 3 segundos

#### Máscara de Moeda
```typescript
// Formata valor para BRL
const formatToBRL = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Converte input de texto para número
const handleCurrencyFormat = (inputValue: string, callback: (value: number) => void) => {
  const numbersOnly = inputValue.replace(/\D/g, '')
  if (!numbersOnly) {
    callback(0)
    return
  }
  const floatValue = parseInt(numbersOnly, 10) / 100
  callback(floatValue)
}
```

#### Atualização Local Durante Edição
```typescript
// Atualiza estado local sem ir ao banco
const updateLocalItem = (id: string, updates: Partial<ShoppingListItem>) => {
  setItems(items.map(i => i.id === id ? { ...i, ...updates } : i))
}
```

### Melhorias de Clean Code Aplicadas

1. **DRY (Don't Repeat Yourself)**: Função `isValidItem` reutilizável para validação
2. **Single Responsibility**: Funções pequenas e focadas (`resetNewItem`, `updateLocalItem`)
3. **Constantes Mágicas**: Extrai para `VALIDATION` object
4. **Type Safety**: Tipo `ToastType` para notificações
5. **Comentários Descritivos**: Cada função tem comentário explicando propósito

---

## Funcionalidade 2: Controle Financeiro

### Arquivo: `src/app/financial/page.tsx`

### Estrutura de Dados

**Tabela Supabase**: `financial_limits`
```typescript
interface FinancialLimits {
  id: string
  user_id: string
  month: number          // 1-12
  year: number
  credit_limit: number
  vale_filipi_limit: number
  vale_vitoria_limit: number
  created_at: string
  updated_at: string
}
```

**Tabela Supabase**: `expenses`
```typescript
interface Expense {
  id: string
  user_id: string
  expense_date: string
  description: string
  payment_method: 'credit' | 'vale_filipi' | 'vale_vitoria'
  amount: number
  created_at: string
  updated_at: string
}
```

### Inicialização de Limites

```typescript
// Busca limites do mês atual
const { data: limitsData } = await supabase
  .from('financial_limits')
  .select('*')
  .eq('user_id', session.user.id)
  .eq('month', currentMonth)
  .eq('year', currentYear)
  .single()

// Se não existirem, cria com valores padrão
if (!limitsData) {
  await supabase
    .from('financial_limits')
    .insert({
      user_id: session.user.id,
      month: currentMonth,
      year: currentYear,
      credit_limit: 900,
      vale_filipi_limit: 320,
      vale_vitoria_limit: 320
    })
}
```

### Cálculo de Saldos

```typescript
// Total gasto por método de pagamento
const calculateSpent = (method: PaymentMethod) => {
  return expenses
    .filter(e => e.payment_method === method)
    .reduce((sum, e) => sum + e.amount, 0)
}

// Saldo restante
const remaining = limit - calculateSpent(method)
```

### Saldo Restante por Linha

```typescript
// Calcula saldo restante considerando apenas despesas anteriores
const calculateRunningBalance = (method: PaymentMethod, currentIndex: number) => {
  const limit = limits ? (
    method === 'credit' ? limits.credit_limit :
    method === 'vale_filipi' ? limits.vale_filipi_limit :
    limits.vale_vitoria_limit
  ) : 0

  const spentBefore = expenses
    .filter((e, i) => e.payment_method === method && i < currentIndex)
    .reduce((sum, e) => sum + e.amount, 0)

  return limit - spentBefore
}
```

---

## Funcionalidade 3: Histórico e Relatórios

### Arquivo: `src/app/history/page.tsx`

### Filtro por Período

```typescript
// Busca despesas do mês/ano selecionado
const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`
const endDate = `${selectedYear}-${String(selectedMonth + 2).padStart(2, '0')}-01`

await supabase
  .from('expenses')
  .select('*')
  .eq('user_id', session.user.id)
  .gte('expense_date', startDate)
  .lt('expense_date', endDate)
  .order('expense_date', { ascending: true })
```

### Análises

#### Total por Método de Pagamento
```typescript
const calculateTotalByMethod = (method: PaymentMethod) => {
  return expenses
    .filter(e => e.payment_method === method)
    .reduce((sum, e) => sum + e.amount, 0)
}
```

#### Dia de Maior Gasto
```typescript
const findHighestSpendingDay = () => {
  const spendingByDay = expenses.reduce((acc, expense) => {
    const day = expense.expense_date
    acc[day] = (acc[day] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  return Object.entries(spendingByDay).reduce((max, [day, amount]) => 
    amount > max.amount ? { day, amount } : max
  , { day: '', amount: 0 })
}
```

---

## Integração com Supabase

### Cliente Supabase

**Arquivo**: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Padrão Singleton**: O cliente é criado uma vez e exportado para uso em toda aplicação.

### Tipos TypeScript

**Arquivo**: `src/types/index.ts`

Define interfaces TypeScript para todas as tabelas do Supabase, garantindo type-safety.

---

## Segurança

### Row Level Security (RLS)

Todas as tabelas do Supabase têm RLS habilitado com políticas que garantem:

1. **Usuários só veem seus próprios dados**
   ```sql
   CREATE POLICY "Usuários podem ver seus próprios itens"
     ON shopping_list FOR SELECT
     TO authenticated
     USING (auth.uid() = user_id);
   ```

2. **Usuários só modificam seus próprios dados**
   ```sql
   CREATE POLICY "Usuários podem atualizar seus próprios itens"
     ON shopping_list FOR UPDATE
     TO authenticated
     USING (auth.uid() = user_id);
   ```

### Whitelist de E-mails

A tabela `allowed_users` controla quem pode acessar o aplicativo:

```sql
CREATE TABLE allowed_users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);
```

A verificação é feita no dashboard ao carregar.

---

## Estado da Aplicação

### Padrão de Gerenciamento de Estado

O projeto usa **React Hooks** para gerenciamento de estado local:

```typescript
const [items, setItems] = useState<ShoppingListItem[]>([])
const [loading, setLoading] = useState(true)
const [showAddForm, setShowAddForm] = useState(false)
```

**Não utiliza Redux ou Context API** - cada página gerencia seu próprio estado localmente.

### Sincronização com Supabase

Sempre que há uma modificação (insert/update/delete), a aplicação:

1. Executa a operação no Supabase
2. Recarrega os dados do banco
3. Atualiza o estado local

```typescript
const handleAddItem = async () => {
  // 1. Insere no Supabase
  await supabase.from('shopping_list').insert({...})
  
  // 2. Recarrega dados
  fetchItems()
}
```

---

## Estilização

### Mobile First

Todas as classes Tailwind seguem o padrão mobile-first:

```tsx
/* Mobile primeiro */
className="grid grid-cols-1 gap-4"

/* Desktop (md breakpoint) */
className="grid grid-cols-1 md:grid-cols-3 gap-4"
```

### Botões Grandes e Fáceis de Tocar

```tsx
className="bg-indigo-600 text-white font-semibold py-4 px-6 rounded-xl"
// py-4 = padding vertical grande para touch
```

### Cores e Tema

- **Primária**: Indigo (`indigo-600`)
- **Sucesso**: Verde (`green-600`)
- **Erro**: Vermelho (`red-600`)
- **Aviso**: Laranja (`orange-500`)

---

## Fluxo de Navegação

```
/ (Home)
  ↓ (verifica sessão)
/login (se não logado)
  ↓ (Google OAuth)
/auth/callback
  ↓ (processa sessão)
/dashboard
  ↓ (verifica whitelist)
  ├─→ /shopping-list (Lista de Compras)
  ├─→ /financial (Controle Financeiro)
  └─→ /history (Histórico e Relatórios)
```

---

## Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Obrigatórias** para o funcionamento da aplicação.

---

## Deploy

### Vercel

1. Conectar repositório Git
2. Adicionar variáveis de ambiente
3. Deploy automático

### Configuração Supabase

1. Criar projeto
2. Executar `supabase-schema.sql`
3. Configurar Google OAuth
4. Adicionar e-mails na `allowed_users`
5. Copiar URL e Anon Key para `.env.local`

---

## Troubleshooting Comum

### Login volta para tela de login

**Causa**: Middleware bloqueando sessão ou callback não processando corretamente.

**Solução**: Verificar se middleware está simplificado e callback aguarda tempo suficiente.

### Erro "supabaseKey is required"

**Causa**: Variáveis de ambiente não configuradas.

**Solução**: Criar `.env.local` com credenciais do Supabase.

### Acesso não autorizado

**Causa**: E-mail não está na tabela `allowed_users`.

**Solução**: Inserir e-mail na tabela via SQL Editor.

---

## Pontos de Extensão

### Para Adicionar Nova Funcionalidade

1. Criar pasta em `src/app/nova-funcionalidade/`
2. Adicionar `page.tsx` com componente React
3. Criar tabela no Supabase (se necessário)
4. Adicionar tipo em `src/types/index.ts`
5. Implementar CRUD com Supabase
6. Adicionar link no dashboard

### Para Adicionar Novo Método de Pagamento

1. Atualizar tipo `PaymentMethod` em `src/types/index.ts`
2. Adicionar coluna em `financial_limits`
3. Atualizar UI em `src/app/financial/page.tsx`
4. Atualizar script SQL se necessário

---

## Conclusão

Este projeto foi desenvolvido seguindo princípios de simplicidade e manutenibilidade. A arquitetura direta (sem camadas complexas) facilita o entendimento e modificação. O uso de Supabase como backend-as-a-service elimina a necessidade de servidor customizado, permitindo foco na experiência do usuário.

Para dúvidas ou sugestões, consulte o README.md para instruções de setup.
