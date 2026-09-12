# Checklist Final de Deploy

Use este checklist para garantir que tudo está pronto antes de colocar o projeto online.

## ✅ Pré-Deploy

### Configuração Local
- [ ] **Criar projeto Supabase** seguindo `supabase-setup-guide.md`
- [ ] **Configurar variáveis de ambiente** no `.env.local`:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Testar o projeto localmente com `npm run dev`
- [ ] Verificar se todas as funcionalidades funcionam localmente

### Supabase
- [ ] **Criar novo projeto Supabase** (se não existir) - veja `supabase-setup-guide.md`
- [ ] **Configurar database schema** (tabelas: allowed_users, shopping_list, expenses)
- [ ] **Configurar Row Level Security (RLS)** nas tabelas
- [ ] **Habilitar Google OAuth** no Supabase
- [ ] **Configurar redirect URLs** (localhost:3000 e domínio Vercel)
- [ ] **Adicionar seu email** na tabela `allowed_users`
- [ ] **Verificar se as RLS policies** estão configuradas corretamente
- [ ] **Copiar credenciais** (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### GitHub
- [ ] Criar repositório no GitHub
- [ ] Fazer commit inicial do projeto
- [ ] Fazer push para o GitHub
- [ ] Verificar se `.env.local` está no `.gitignore` (já está)

### PWA (Desabilitado Temporariamente)
- [ ] **Nota**: Service worker foi desabilitado temporariamente devido a problemas de cache
- [ ] Ícones PWA já estão na pasta `public/` (icon-192.png, icon-512.png)
- [ ] Para reabilitar funcionalidade offline, será necessário implementar service worker robusto

## ✅ Deploy no Vercel

### Configuração
- [ ] Criar conta no Vercel (se não tiver)
- [ ] Conectar o repositório GitHub ao Vercel
- [ ] Configurar as variáveis de ambiente no Vercel:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Verificar se o framework está configurado como Next.js
- [ ] Fazer o deploy inicial

### Pós-Deploy
- [ ] Testar o acesso ao domínio do Vercel
- [ ] Testar o login com Google OAuth
- [ ] Testar todas as funcionalidades:
  - [ ] Dashboard
  - [ ] Lista de compras (com e sem internet)
  - [ ] Controle financeiro
  - [ ] Histórico
- [ ] Testar a funcionalidade offline da lista de compras
- [ ] Testar a sincronização quando volta online

## ✅ Testes no Celular

### PWA Installation
- [ ] Abrir o site no Chrome do celular
- [ ] Instalar como PWA (Adicionar à tela inicial)
- [ ] Verificar se o ícone aparece corretamente
- [ ] Verificar se o app abre em modo standalone

### Funcionalidade Offline
- [ ] Desconectar do Wi-Fi/dados móveis
- [ ] Abrir o PWA offline
- [ ] Testar adicionar itens na lista de compras offline
- [ ] Testar marcar itens como comprados offline
- [ ] Testar editar itens offline
- [ ] Reconectar à internet
- [ ] Verificar se a sincronização ocorre automaticamente
- [ ] Verificar se os dados aparecem no Supabase

### Compartilhamento
- [ ] Enviar o link do Vercel para a namorada
- [ ] Verificar se ela consegue fazer login
- [ ] Verificar se ela vê apenas seus próprios dados (RLS)
- [ ] Verificar se os dados dela não interferem nos seus

## ✅ Manutenção

### Adicionar Novos Usuários
- [ ] Quando precisar adicionar um novo usuário, seguir o `tutorial-habilitar-email.md`

### Atualizações
- [ ] Para fazer atualizações, basta fazer commit e push no GitHub
- [ ] O Vercel fará deploy automático

### Backup
- [ ] Considerar fazer backup dos dados do Supabase periodicamente
- [ ] Documentar as configurações importantes

## ⚠️ Importante

- **Nunca** commit o arquivo `.env.local` no GitHub
- **Sempre** adicionar novos emails na whitelist do Supabase antes de dar acesso
- **Testar** as funcionalidades offline antes de usar no mercado
- **Comunicar** mudanças importantes para a namorada

## 📚 Documentação Disponível

- `supabase-setup-guide.md` - Guia completo para configurar Supabase do zero
- `tutorial-habilitar-email.md` - Como adicionar novos usuários
- `vercel-deploy-guide.md` - Guia completo de deploy no Vercel
- `public/icon-placeholder.txt` - Instruções para criar ícones PWA

## 🚀 Resumo

O projeto está **pronto para deploy** após configurar o Supabase. Os principais itens são:

1. **Configurar novo projeto Supabase** seguindo `supabase-setup-guide.md`
2. **Configurar variáveis de ambiente** localmente (.env.local) e no Vercel
3. **Fazer deploy no Vercel** conectando o repositório GitHub
4. **Adicionar email da namorada** na whitelist do Supabase
5. **Testar funcionalidades** (lista de compras, controle financeiro, histórico)

**Nota**: Funcionalidade offline está temporariamente desabilitada devido a problemas de cache do service worker. O app funciona normalmente online, mas não oferece suporte offline no momento.
