# Guia de Deploy no Vercel

Este guia explica como fazer o deploy do WebApp de Gerenciamento no Vercel.

## Pré-requisitos

1. **Conta no Vercel**: https://vercel.com/signup
2. **Conta no GitHub**: https://github.com/signup
3. **Projeto no GitHub**: O projeto deve estar em um repositório GitHub
4. **Projeto Supabase configurado**: Siga o **`supabase-setup-guide.md`** antes de continuar

## Passo 1: Preparar o Repositório GitHub

1. Crie um repositório no GitHub
2. Faça commit e push do projeto para o GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/seu-usuario/gerenciamento-app.git
   git push -u origin main
   ```

## Passo 2: Configurar Supabase

Se você ainda não tem um projeto Supabase configurado, siga o guia completo: **`supabase-setup-guide.md`**

### Obter Credenciais do Supabase

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie as seguintes informações:
   - `NEXT_PUBLIC_SUPABASE_URL`: A URL do seu projeto Supabase (ex: https://xyz.supabase.co)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: A chave pública (anon/public key) do seu projeto

### Configurar Variáveis de Ambiente Localmente

Para desenvolvimento local, crie um arquivo `.env.local` na raiz do projeto com:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Importante**: Nunca commit o arquivo `.env.local` no GitHub. Ele já está no `.gitignore` por segurança.

## Passo 3: Deploy no Vercel

### Opção A: Através do site Vercel

1. Acesse https://vercel.com/dashboard
2. Clique em **Add New Project**
3. Clique em **Import Git Repository**
4. Selecione o repositório do seu projeto
5. Configure o projeto:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (deixe padrão)
   - **Build Command**: `npm run build` (deixe padrão)
   - **Output Directory**: `.next` (deixe padrão)
6. Clique em **Environment Variables**
7. Adicione as variáveis do Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`: sua URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: sua anon key do Supabase
8. Clique em **Deploy**
9. **Após o deploy**, copie a URL do Vercel (ex: `https://seu-projeto.vercel.app`)
10. **Configure o redirect URL no Supabase**:
    - Vá em Authentication > Providers > Google
    - Adicione a URL do Vercel: `https://seu-projeto.vercel.app/auth/callback`
    - Clique em Save

### Opção B: Através da CLI do Vercel

1. Instale a CLI do Vercel:
   ```bash
   npm i -g vercel
   ```

2. Faça login:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Configure as variáveis de ambiente quando solicitado

## Passo 4: Configurar Domínio (Opcional)

### Domínio Gratuito do Vercel

O Vercel fornece automaticamente um domínio gratuito como:
- `seu-projeto.vercel.app`

### Domínio Personalizado

Se quiser usar um domínio próprio:

1. Compre um domínio (ex: Namecheap, GoDaddy, etc)
2. No painel do Vercel, vá em **Settings** > **Domains**
3. Clique em **Add Domain**
4. Siga as instruções para configurar DNS

## Passo 5: Testar o Deploy

1. Acesse a URL fornecida pelo Vercel
2. Teste o login com Google OAuth
3. Teste todas as funcionalidades:
   - Lista de compras
   - Controle financeiro
   - Histórico
4. Teste funcionalidade offline (no Chrome do celular)

## Passo 6: Testar PWA no Celular

### No Android (Chrome)

1. Abra o site no Chrome
2. Toque no menu (três pontos)
3. Selecione "Adicionar à tela inicial"
4. Confirme

### No iOS (Safari)

1. Abra o site no Safari
2. Toque no botão de compartilhar
3. Selecione "Adicionar à Tela de Início"
4. Confirme

## Troubleshooting

### Erro de Build

- Verifique se todas as dependências estão instaladas
- Verifique se as variáveis de ambiente estão configuradas
- Verifique os logs de build no painel do Vercel

### Erro de Supabase

- Verifique se as variáveis de ambiente estão corretas
- Verifique se o projeto Supabase está ativo
- Verifique se as RLS policies estão configuradas

### PWA não funciona

- Verifique se o service worker está registrado
- Verifique se o manifest.json está configurado
- Verifique se os ícones existem na pasta public/
- Use Chrome DevTools > Application para debugar

## Deploy Automático

O Vercel faz deploy automático sempre que você faz push para o GitHub. Basta:

```bash
git add .
git commit -m "Descrição das mudanças"
git push
```

O Vercel detectará automaticamente e fará o deploy.
