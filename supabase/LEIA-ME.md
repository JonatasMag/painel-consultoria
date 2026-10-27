# Ligar o cadastro de clientes e o registro de acessos (Supabase)

Leva uns 15 minutos. Até terminar, o painel continua abrindo pelo link **Acesso do consultor**, com a senha do cofre.

## 1. Criar o projeto
1. Entre em **supabase.com** e clique em **New project**.
2. Nome: `meu-painel`. Região: **South America (São Paulo)**. Crie uma senha de banco e guarde.
3. Espere o projeto ficar pronto (1 a 2 minutos).

> O plano gratuito permite 2 projetos ativos. Se você já usa os dois (Oração e Palavra e Realiza), pode rodar este painel dentro de um deles: todas as tabelas começam com `painel_` e não mexem nas outras.

## 2. Criar as tabelas
1. Menu da esquerda: **SQL Editor** → **New query**.
2. Copie todo o conteúdo do arquivo `supabase/schema.sql` deste repositório, cole e clique em **Run**.
3. Deve aparecer "Success. No rows returned". Isso é o normal.

## 3. Endereço do painel nos e-mails
1. **Authentication** → **URL Configuration**.
2. **Site URL:** `https://jonatasmag.github.io/painel-consultoria/`
3. Em **Redirect URLs**, clique em **Add URL** e cole o mesmo endereço. Salve.

Assim, o link de confirmação de cadastro e o de "esqueci minha senha" abrem direto no painel.

## 4. Ligar o painel ao banco
1. **Project Settings** → **API** (ou **Data API**).
2. Copie a **Project URL** e a chave **anon public**.
3. No GitHub, abra `assets/js/config.js`, clique no lápis (editar) e cole:
   - `supabaseUrl: "https://SEU-PROJETO.supabase.co",`
   - `supabaseAnonKey: "a-chave-anon-public",`
4. Clique em **Commit changes**. Em 1 a 2 minutos o site atualiza.

A chave **anon public** pode ficar no site: quem protege os dados são as regras do banco (RLS) criadas no passo 2. **Nunca** cole a chave `service_role`.

## 5. Virar administrador
1. Abra `https://jonatasmag.github.io/painel-consultoria/#cadastro` e crie sua conta com o seu e-mail.
2. Confirme pelo link que chega no e-mail.
3. Volte ao **SQL Editor**, nova consulta, e rode (troque o e-mail se for outro):

```sql
update public.painel_perfis set papel = 'admin' where email = 'chazaq.adm@gmail.com';
```

4. Rode também o arquivo particular **supabase-chave-do-cofre.sql**, que fica na sua cópia original do painel (nunca no GitHub). Ele permite abrir o CRM e os materiais só com e-mail e senha, sem digitar a senha do cofre.

## Pronto
- **Você:** entra com e-mail e senha e vê o painel completo, com a aba **Acessos** (quem, quando, de onde e o que mais usam).
- **Clientes:** criam conta, entram e baixam as **Ferramentas**. O resto dos materiais fica bloqueado.

## Perguntas comuns
- **O cliente não recebeu o e-mail de confirmação.** Peça para olhar o spam. O Supabase gratuito envia poucos e-mails por hora; se for um problema, em **Authentication → Sign In / Providers → Email** dá para desligar **Confirm email**.
- **Quero tirar alguém.** Em **Authentication → Users**, apague o usuário. O perfil e os acessos dele saem juntos.
- **De onde vem a cidade?** De um serviço público que estima a cidade pela conexão de internet. O endereço IP não é guardado.
