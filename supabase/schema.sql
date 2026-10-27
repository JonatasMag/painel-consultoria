-- =====================================================================
-- PAINEL DE CONSULTORIA: cadastro de clientes, login e registro de acessos
-- Rode este arquivo inteiro no Supabase: SQL Editor > New query > colar > Run.
-- Pode rodar de novo sem perder dados (cria só o que ainda não existe).
-- Todas as tabelas começam com "painel_" para conviver com outros projetos.
-- =====================================================================

-- ---------- Perfis: um por pessoa cadastrada no painel ----------
create table if not exists public.painel_perfis (
  id            uuid primary key references auth.users (id) on delete cascade,
  nome          text not null default '' check (char_length(nome) <= 120),
  empresa       text not null default '' check (char_length(empresa) <= 120),
  telefone      text not null default '' check (char_length(telefone) <= 30),
  email         text not null default '' check (char_length(email) <= 254),
  papel         text not null default 'cliente' check (papel in ('cliente', 'admin')),
  aceite_em     timestamptz,
  criado_em     timestamptz not null default now(),
  ultimo_acesso timestamptz
);

-- ---------- Eventos: cada login, tela visitada e arquivo baixado ----------
create table if not exists public.painel_eventos (
  id          bigint generated always as identity primary key,
  usuario     uuid not null references public.painel_perfis (id) on delete cascade,
  tipo        text not null check (tipo in ('cadastro', 'login', 'visita', 'download')),
  recurso     text not null default '' check (char_length(recurso) <= 160),
  cidade      text not null default '' check (char_length(cidade) <= 80),
  regiao      text not null default '' check (char_length(regiao) <= 80),
  pais        text not null default '' check (char_length(pais) <= 80),
  dispositivo text not null default '' check (char_length(dispositivo) <= 40),
  criado_em   timestamptz not null default now()
);
create index if not exists painel_eventos_data_idx on public.painel_eventos (criado_em desc);
create index if not exists painel_eventos_usuario_idx on public.painel_eventos (usuario);

-- ---------- Cofre: chave que abre os materiais restritos (só o admin lê) ----------
create table if not exists public.painel_cofre (
  id    int primary key default 1 check (id = 1),
  chave text not null
);

-- ---------- É administrador? ----------
create or replace function public.painel_e_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.painel_perfis where id = auth.uid() and papel = 'admin');
$$;

-- ---------- Ao cadastrar pelo painel, cria o perfil ----------
create or replace function public.painel_novo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'origem', '') = 'painel' then
    insert into public.painel_perfis (id, nome, empresa, telefone, email, aceite_em)
    values (
      new.id,
      left(coalesce(new.raw_user_meta_data ->> 'nome', ''), 120),
      left(coalesce(new.raw_user_meta_data ->> 'empresa', ''), 120),
      left(coalesce(new.raw_user_meta_data ->> 'telefone', ''), 30),
      left(coalesce(new.email, ''), 254),
      case when new.raw_user_meta_data ->> 'aceite' = 'sim' then now() end
    )
    on conflict (id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists painel_ao_cadastrar on auth.users;
create trigger painel_ao_cadastrar
  after insert on auth.users
  for each row execute function public.painel_novo_usuario();

-- ---------- Registrar um acesso (o painel chama esta função) ----------
-- Quem registra é sempre o usuário logado: ninguém consegue registrar em nome de outro.
create or replace function public.painel_registrar(
  p_tipo text, p_recurso text default '', p_cidade text default '', p_regiao text default '',
  p_pais text default '', p_dispositivo text default ''
) returns void language plpgsql security definer set search_path = public as $$
declare
  eu uuid := auth.uid();
begin
  if eu is null or not exists (select 1 from public.painel_perfis where id = eu) then
    return;
  end if;
  if p_tipo not in ('cadastro', 'login', 'visita', 'download') then
    raise exception 'tipo de evento inválido';
  end if;
  -- evita registros repetidos do mesmo evento em menos de 1 minuto
  if exists (
    select 1 from public.painel_eventos
    where usuario = eu and tipo = p_tipo and recurso = left(coalesce(p_recurso, ''), 160)
      and criado_em > now() - interval '1 minute'
  ) then
    return;
  end if;
  insert into public.painel_eventos (usuario, tipo, recurso, cidade, regiao, pais, dispositivo)
  values (eu, p_tipo, left(coalesce(p_recurso, ''), 160), left(coalesce(p_cidade, ''), 80),
          left(coalesce(p_regiao, ''), 80), left(coalesce(p_pais, ''), 80), left(coalesce(p_dispositivo, ''), 40));
  if p_tipo in ('login', 'cadastro') then
    update public.painel_perfis set ultimo_acesso = now() where id = eu;
  end if;
end $$;

-- ---------- Excluir a própria conta (direito previsto na LGPD) ----------
create or replace function public.painel_excluir_conta()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;
  if public.painel_e_admin() then
    raise exception 'a conta de administrador não pode ser excluída por aqui';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

-- ---------- Permissões (RLS) ----------
alter table public.painel_perfis  enable row level security;
alter table public.painel_eventos enable row level security;
alter table public.painel_cofre   enable row level security;

drop policy if exists "perfil: ver o próprio ou admin vê todos" on public.painel_perfis;
create policy "perfil: ver o próprio ou admin vê todos" on public.painel_perfis
  for select to authenticated using (id = auth.uid() or public.painel_e_admin());

drop policy if exists "perfil: só admin altera" on public.painel_perfis;
create policy "perfil: só admin altera" on public.painel_perfis
  for update to authenticated using (public.painel_e_admin()) with check (public.painel_e_admin());

drop policy if exists "eventos: só admin vê" on public.painel_eventos;
create policy "eventos: só admin vê" on public.painel_eventos
  for select to authenticated using (public.painel_e_admin());

drop policy if exists "cofre: só admin lê" on public.painel_cofre;
create policy "cofre: só admin lê" on public.painel_cofre
  for select to authenticated using (public.painel_e_admin());

-- Ninguém de fora (anon) lê nada; funções só para usuários logados
revoke all on public.painel_perfis, public.painel_eventos, public.painel_cofre from anon;
revoke execute on function public.painel_registrar(text, text, text, text, text, text) from public, anon;
revoke execute on function public.painel_excluir_conta() from public, anon;
revoke execute on function public.painel_novo_usuario() from public, anon, authenticated;
grant execute on function public.painel_registrar(text, text, text, text, text, text) to authenticated;
grant execute on function public.painel_excluir_conta() to authenticated;
grant execute on function public.painel_e_admin() to authenticated;
