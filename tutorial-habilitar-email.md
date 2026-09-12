# Tutorial: Habilitar Email na Whitelist

Este tutorial explica como adicionar um novo email à tabela `allowed_users` no Supabase para permitir que outra pessoa acesse o WebApp.

## Passo 1: Acessar o Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login com sua conta
3. Selecione o projeto do WebApp de Gerenciamento

## Passo 2: Abrir o SQL Editor

1. No menu lateral esquerdo, clique em **SQL Editor** (ícone de terminal)
2. Clique em **New Query** para criar uma nova consulta

## Passo 3: Verificar emails já cadastrados

Para ver quais emails já estão na whitelist, execute:

```sql
SELECT * FROM allowed_users;
```

## Passo 4: Adicionar novo email

Para adicionar o email da sua namorada (ou outra pessoa), execute:

```sql
INSERT INTO allowed_users (email) 
VALUES ('email-da-pessoa@exemplo.com');
```

**Substitua** `email-da-pessoa@exemplo.com` pelo email real da pessoa.

## Passo 5: Verificar se foi adicionado

Execute novamente a consulta para confirmar:

```sql
SELECT * FROM allowed_users;
```

Você deve ver o novo email na lista.

## Passo 6: Remover email (se necessário)

Se precisar remover um email da whitelist:

```sql
DELETE FROM allowed_users 
WHERE email = 'email-a-remover@exemplo.com';
```

## Importante

- Apenas emails na tabela `allowed_users` podem acessar o sistema
- Cada email deve ser único (não pode duplicar)
- A pessoa precisará fazer login com Google OAuth usando o email cadastrado
- Os dados de cada usuário são separados (RLS garante que cada um veja apenas seus próprios dados)

## Exemplo Prático

Para adicionar o email da sua namorada, supondo que seja `maria@gmail.com`:

```sql
INSERT INTO allowed_users (email) 
VALUES ('maria@gmail.com');
```

Após isso, ela poderá acessar o WebApp usando o Google OAuth com esse email.
