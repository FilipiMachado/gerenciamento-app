# Gerenciamento Pessoal

WebApp de gerenciamento pessoal com foco em Mobile First, desenvolvido com Next.js, Tailwind CSS e Supabase.

## Funcionalidades

- **Lista de Compras**: Gerenciamento dinâmico de itens com valores estimados, checkbox para marcar como comprado, edição e exclusão
- **Controle Financeiro**: Painel de limites mensais (Crédito e Vales) com cálculo de saldos restantes em tempo real
- **Histórico e Relatórios**: Visualização de despesas por mês/ano com resumos e destaque do dia de maior gasto

## Stack Tecnológico

- **Front-end/Back-end**: Next.js (App Router)
- **Estilização**: Tailwind CSS (Mobile First)
- **Ícones**: Lucide React
- **Banco de Dados/Autenticação**: Supabase
- **Hospedagem**: Vercel

## Configuração

### 1. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o script SQL disponível em `supabase-schema.sql` no SQL Editor do Supabase
3. Configure o Google OAuth em Authentication > Providers > Google
4. Adicione e-mails autorizados na tabela `allowed_users`
5. Copie as credenciais:
   - Project URL
   - Anon Key

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=seu-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu-anon-key
```

### 3. Instalar Dependências e Executar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Estrutura do Projeto

```
src/
├── app/
│   ├── dashboard/          # Dashboard principal
│   ├── login/               # Página de login com Google OAuth
│   ├── shopping-list/       # Funcionalidade 1: Lista de Compras
│   ├── financial/           # Funcionalidade 2: Controle Financeiro
│   ├── history/             # Funcionalidade 3: Histórico e Relatórios
│   └── auth/callback/       # Callback OAuth
├── components/              # Componentes reutilizáveis
├── lib/
│   └── supabase.ts          # Cliente Supabase
├── types/
│   └── index.ts             # Tipos TypeScript
└── middleware.ts            # Middleware de autenticação
```

## Segurança

- Autenticação exclusiva via Google OAuth
- Whitelist de e-mails autorizados (tabela `allowed_users`)
- Row Level Security (RLS) configurado em todas as tabelas
- Acesso bloqueado para usuários não autorizados

## Deploy no Vercel

1. Conecte o repositório ao Vercel
2. Adicione as variáveis de ambiente nas configurações do projeto
3. Deploy automático ao fazer push para a branch principal
