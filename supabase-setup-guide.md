# Guia Completo de Configuração do Supabase

Este guia explica como criar e configurar um novo projeto Supabase do zero para o WebApp de Gerenciamento.

## 📋 Pré-requisitos

- Conta no Supabase (https://supabase.com/signup)
- Conta Google para OAuth

## 🚀 Passo 1: Criar Novo Projeto Supabase

1. **Acesse** https://supabase.com/dashboard
2. **Faça login** com sua conta
3. **Clique em "New Project"**
4. **Preencha as informações:**
   - **Name**: `gerenciamento-app` (ou outro nome de sua preferência)
   - **Database Password**: Crie uma senha forte e **salve-a** (vai precisar dela)
   - **Region**: Escolha a região mais próxima de você (ex: South America)
   - **Pricing Plan**: Free (gratuito)
5. **Clique em "Create new project"**
6. **Aguarde** o projeto ser criado (pode levar 2-3 minutos)

## 🗄️ Passo 2: Configurar Database Schema

### 2.1 Criar Tabela `allowed_users`

1. **No painel do Supabase**, vá em **SQL Editor** (ícone de terminal no menu lateral)
2. **Clique em "New Query"**
3. **Cole e execute** o seguinte SQL:

```sql
-- Criar tabela de usuários permitidos (whitelist)
CREATE TABLE allowed_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca rápida por email
CREATE INDEX idx_allowed_users_email ON allowed_users(email);
```

### 2.2 Criar Tabela `shopping_list`

```sql
-- Criar tabela de lista de compras
CREATE TABLE shopping_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 9),
  estimated_value DECIMAL(10,2) DEFAULT 0,
  is_purchased BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_shopping_list_user_id ON shopping_list(user_id);
CREATE INDEX idx_shopping_list_is_purchased ON shopping_list(is_purchased);
```

### 2.3 Criar Tabela `expenses`

```sql
-- Criar tabela de despesas
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
```

### 2.4 Adicionar Seu Email na Whitelist

```sql
-- Adicionar seu email à whitelist
INSERT INTO allowed_users (email) 
VALUES ('seu-email@gmail.com');

-- Substitua 'seu-email@gmail.com' pelo seu email real do Google
```

## 🔐 Passo 3: Configurar Row Level Security (RLS)

### 3.1 Habilitar RLS nas Tabelas

```sql
-- Habilitar RLS na tabela allowed_users
ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS na tabela shopping_list
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS na tabela expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
```

### 3.2 Criar Policies para `allowed_users`

```sql
-- Policy: Apenas usuários autenticados podem ler a whitelist
CREATE POLICY "Authenticated users can read allowed_users"
ON allowed_users FOR SELECT
TO authenticated
USING (true);

-- Policy: Ninguém pode inserir na whitelist via API (apenas via SQL direto)
CREATE POLICY "No insert via API"
ON allowed_users FOR INSERT
TO authenticated
WITH CHECK (false);

-- Policy: Ninguém pode atualizar a whitelist via API
CREATE POLICY "No update via API"
ON allowed_users FOR UPDATE
TO authenticated
USING (false);

-- Policy: Ninguém pode deletar da whitelist via API
CREATE POLICY "No delete via API"
ON allowed_users FOR DELETE
TO authenticated
USING (false);
```

### 3.3 Criar Policies para `shopping_list`

```sql
-- Policy: Usuários podem ver apenas seus próprios itens
CREATE POLICY "Users can view own shopping list"
ON shopping_list FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Usuários podem inserir apenas seus próprios itens
CREATE POLICY "Users can insert own shopping items"
ON shopping_list FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar apenas seus próprios itens
CREATE POLICY "Users can update own shopping items"
ON shopping_list FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Usuários podem deletar apenas seus próprios itens
CREATE POLICY "Users can delete own shopping items"
ON shopping_list FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

### 3.4 Criar Policies para `expenses`

```sql
-- Policy: Usuários podem ver apenas suas próprias despesas
CREATE POLICY "Users can view own expenses"
ON expenses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Usuários podem inserir apenas suas próprias despesas
CREATE POLICY "Users can insert own expenses"
ON expenses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar apenas suas próprias despesas
CREATE POLICY "Users can update own expenses"
ON expenses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Usuários podem deletar apenas suas próprias despesas
CREATE POLICY "Users can delete own expenses"
ON expenses FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

## 🔑 Passo 4: Configurar Google OAuth

### 4.1 Habilitar Google Auth no Supabase

1. **No painel do Supabase**, vá em **Authentication** > **Providers**
2. **Clique em "Google"**
3. **Clique em "Enable"**
4. **Clique em "Save"**

### 4.2 Configurar Redirect URLs

1. **Ainda na página do Google provider**, configure os redirect URLs:
   - **Development**: `http://localhost:3000/auth/callback`
   - **Production**: `https://seu-projeto.vercel.app/auth/callback` (substitua pelo seu domínio do Vercel)
2. **Clique em "Save"**

## 📝 Passo 5: Obter Credenciais do Supabase

1. **No painel do Supabase**, vá em **Settings** > **API**
2. **Copie as seguintes informações:**
   - **Project URL**: Algo como `https://abcdefghijklmnop.supabase.co`
   - **anon public key**: A chave pública (longa string de caracteres)

## 🔧 Passo 6: Atualizar Variáveis de Ambiente

### 6.1 Atualizar `.env.local` (Desenvolvimento)

No seu projeto, crie/atualize o arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Substitua:**
- `seu-projeto-id` pelo ID do seu projeto (do passo 5)
- `sua-chave-anon-aqui` pela chave anon que você copiou

### 6.2 Preparar para Vercel (Produção)

Guarde essas mesmas informações para configurar no Vercel depois (veja `vercel-deploy-guide.md`).

## ✅ Passo 7: Testar Configuração

### 7.1 Testar Localmente

1. **Pare o servidor** (Ctrl+C no terminal)
2. **Reinicie o servidor**: `npm run dev`
3. **Acesse** http://localhost:3000
4. **Tente fazer login** com Google
5. **Verifique se funciona**

### 7.2 Verificar no Supabase

1. **No painel do Supabase**, vá em **Authentication** > **Users**
2. **Verifique se seu usuário aparece** após o login
3. **Vá em Table Editor** e verifique as tabelas criadas

## 👤 Passo 8: Adicionar Email da Namorada

Depois que tudo estiver funcionando, adicione o email dela:

1. **Vá em SQL Editor** no Supabase
2. **Execute:**

```sql
INSERT INTO allowed_users (email) 
VALUES ('email-da-namorada@gmail.com');
```

3. **Substitua** pelo email real dela

## 🚨 Solução de Problemas

### Erro: "DNS_PROBE_FINISHED_NXDOMAIN"
- Verifique se o URL do Supabase está correto no `.env.local`
- Verifique se o projeto Supabase está ativo no dashboard
- Tente acessar o URL do Supabase diretamente no navegador

### Erro: "Auth failed"
- Verifique se o Google OAuth está habilitado
- Verifique se os redirect URLs estão corretos
- Verifique se seu email está na tabela `allowed_users`

### Erro: "Permission denied"
- Verifique se as RLS policies foram criadas corretamente
- Verifique se você está autenticado
- Verifique no Table Editor se as tabelas existem

## 📚 Recursos Úteis

- **Documentação Supabase**: https://supabase.com/docs
- **SQL Editor**: Para executar queries diretamente
- **Table Editor**: Interface visual para ver/editar dados
- **Authentication**: Gerenciar usuários e providers

## 🎯 Próximos Passos

Após configurar o Supabase:

1. **Teste todas as funcionalidades** localmente
2. **Siga o `vercel-deploy-guide.md`** para fazer o deploy
3. **Configure as variáveis de ambiente** no Vercel
4. **Teste o app em produção**
5. **Adicione o email da namorada** na whitelist

Seu Supabase estará pronto para uso! 🎉
