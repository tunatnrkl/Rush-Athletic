-- =====================================================================
-- RUSH ATHLETIC — Supabase veritabanı şeması
-- Supabase > SQL Editor > New query > bu dosyanın tamamını yapıştır > Run
-- Tekrar çalıştırmak güvenlidir (var olan tabloları silmez).
--
-- Yetki modeli (sunucu tarafında zorunlu):
--   * Antrenör: kendi öğrencilerini görür; ölçüm, test, program, hedef girer (coach alanı).
--   * Öğrenci : yalnızca antrenörün verdiği kodla katılır; kendi kişisel bilgilerini (info)
--               ve antrenman kayıtlarını (logs) yazar; test/ölçüm/program yazamaz.
--   * Veli    : öğrencinin verdiği kodla bağlanır; yalnızca okur, hiçbir şeyi değiştiremez.
-- Tablolara doğrudan yazma kapalıdır; tüm yazmalar aşağıdaki kontrollü fonksiyonlarla yapılır.
-- =====================================================================

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('coach', 'athlete', 'parent')),
  name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.athletes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  coach_name text not null default '',
  athlete_user_id uuid unique references auth.users(id) on delete set null,
  invite_code text unique,
  invite_note text not null default '',
  parent_code text unique,
  info jsonb not null default '{}'::jsonb,
  coach jsonb not null default '{}'::jsonb,
  logs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parent_links (
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  parent_id uuid not null references auth.users(id) on delete cascade,
  parent_name text not null default '',
  created_at timestamptz not null default now(),
  primary key (athlete_id, parent_id)
);

create table if not exists public.coach_docs (
  coach_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.athletes enable row level security;
alter table public.parent_links enable row level security;
alter table public.coach_docs enable row level security;

-- Okuma kuralları -------------------------------------------------------
create or replace function public.is_parent_of(p_aid uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.parent_links where athlete_id = p_aid and parent_id = auth.uid());
$$;

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for select using (id = auth.uid());

drop policy if exists athletes_read on public.athletes;
create policy athletes_read on public.athletes for select
  using (coach_id = auth.uid() or athlete_user_id = auth.uid() or public.is_parent_of(id));

drop policy if exists links_read on public.parent_links;
create policy links_read on public.parent_links for select using (parent_id = auth.uid());

drop policy if exists coach_docs_own on public.coach_docs;
create policy coach_docs_own on public.coach_docs for all
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

revoke insert, update, delete on public.profiles, public.athletes, public.parent_links from anon, authenticated;
grant select on public.profiles, public.athletes, public.parent_links to authenticated;
grant select, insert, update, delete on public.coach_docs to authenticated;

-- Yardımcılar -----------------------------------------------------------
create or replace function public.my_role() returns text
language sql security definer set search_path = public stable as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.new_code() returns text
language plpgsql set search_path = public volatile as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c text := '';
begin
  for i in 1..6 loop
    c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return c;
end $$;

-- Profil ---------------------------------------------------------------
create or replace function public.set_profile(p_role text, p_name text) returns json
language plpgsql security definer set search_path = public as $$
declare r public.profiles;
begin
  if auth.uid() is null then raise exception 'Oturum gerekli'; end if;
  if p_role not in ('coach', 'athlete', 'parent') then raise exception 'Geçersiz rol'; end if;
  insert into public.profiles (id, role, name) values (auth.uid(), p_role, coalesce(trim(p_name), ''))
  on conflict (id) do update set name = coalesce(nullif(trim(excluded.name), ''), public.profiles.name)
  returning * into r;
  return row_to_json(r);
end $$;

-- Antrenör → öğrenci daveti ---------------------------------------------
create or replace function public.create_invite(p_note text) returns json
language plpgsql security definer set search_path = public as $$
declare c text; aid uuid; cname text;
begin
  if public.my_role() is distinct from 'coach' then raise exception 'Yalnızca antrenör öğrenci ekleyebilir'; end if;
  select name into cname from public.profiles where id = auth.uid();
  loop
    c := public.new_code();
    exit when not exists (select 1 from public.athletes where invite_code = c or parent_code = c);
  end loop;
  insert into public.athletes (coach_id, coach_name, invite_code, invite_note)
  values (auth.uid(), coalesce(cname, ''), c, coalesce(trim(p_note), ''))
  returning id into aid;
  return json_build_object('athlete_id', aid, 'code', c);
end $$;

create or replace function public.invite_info(p_code text) returns json
language sql security definer set search_path = public stable as $$
  select json_build_object('coach_name', coach_name, 'note', invite_note)
  from public.athletes where invite_code = upper(trim(p_code)) and athlete_user_id is null;
$$;

create or replace function public.redeem_invite(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare aid uuid;
begin
  if public.my_role() is distinct from 'athlete' then raise exception 'Bu kod yalnızca öğrenci hesabıyla kullanılabilir'; end if;
  if exists (select 1 from public.athletes where athlete_user_id = auth.uid()) then raise exception 'Bu hesap zaten bir antrenöre bağlı'; end if;
  update public.athletes set athlete_user_id = auth.uid(), invite_code = null, updated_at = now()
  where invite_code = upper(trim(p_code)) and athlete_user_id is null
  returning id into aid;
  if aid is null then raise exception 'Kod geçersiz veya daha önce kullanılmış'; end if;
  return aid;
end $$;

-- Öğrenci → veli kodu -----------------------------------------------------
create or replace function public.create_parent_code(p_aid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not exists (select 1 from public.athletes where id = p_aid and athlete_user_id = auth.uid()) then
    raise exception 'Veli kodunu yalnızca öğrencinin kendisi oluşturabilir';
  end if;
  loop
    c := public.new_code();
    exit when not exists (select 1 from public.athletes where invite_code = c or parent_code = c);
  end loop;
  update public.athletes set parent_code = c, updated_at = now() where id = p_aid;
  return c;
end $$;

create or replace function public.parent_code_info(p_code text) returns json
language sql security definer set search_path = public stable as $$
  select json_build_object('athlete_name', coalesce(info->>'name', ''), 'coach_name', coach_name)
  from public.athletes where parent_code = upper(trim(p_code));
$$;

create or replace function public.redeem_parent_code(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare aid uuid; pname text;
begin
  if public.my_role() is distinct from 'parent' then raise exception 'Bu kod yalnızca veli hesabıyla kullanılabilir'; end if;
  select id into aid from public.athletes where parent_code = upper(trim(p_code));
  if aid is null then raise exception 'Veli kodu geçersiz'; end if;
  select name into pname from public.profiles where id = auth.uid();
  insert into public.parent_links (athlete_id, parent_id, parent_name) values (aid, auth.uid(), coalesce(pname, ''))
  on conflict do nothing;
  return aid;
end $$;

create or replace function public.athlete_parents(p_aid uuid) returns json
language sql security definer set search_path = public stable as $$
  select coalesce(json_agg(json_build_object('parent_id', parent_id, 'name', parent_name, 'created_at', created_at)), '[]'::json)
  from public.parent_links pl
  where pl.athlete_id = p_aid
    and exists (select 1 from public.athletes a where a.id = p_aid and (a.athlete_user_id = auth.uid() or a.coach_id = auth.uid()));
$$;

create or replace function public.remove_parent(p_aid uuid, p_parent uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.athletes where id = p_aid and (athlete_user_id = auth.uid() or coach_id = auth.uid())) then
    raise exception 'Yetki yok';
  end if;
  delete from public.parent_links where athlete_id = p_aid and parent_id = p_parent;
end $$;

-- Yazma işlemleri (rol kontrollü) ------------------------------------------
create or replace function public.save_info(p_aid uuid, p_data jsonb) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare t timestamptz := now();
begin
  update public.athletes set info = p_data, updated_at = t where id = p_aid and athlete_user_id = auth.uid();
  if not found then raise exception 'Kişisel bilgileri yalnızca öğrencinin kendisi değiştirebilir'; end if;
  return t;
end $$;

create or replace function public.save_logs(p_aid uuid, p_data jsonb) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare t timestamptz := now();
begin
  update public.athletes set logs = p_data, updated_at = t where id = p_aid and athlete_user_id = auth.uid();
  if not found then raise exception 'Antrenman kayıtlarını yalnızca öğrenci girebilir'; end if;
  return t;
end $$;

create or replace function public.save_coach(p_aid uuid, p_data jsonb) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare t timestamptz := now();
begin
  update public.athletes set coach = p_data, updated_at = t where id = p_aid and coach_id = auth.uid();
  if not found then raise exception 'Ölçüm, test ve programları yalnızca antrenör girebilir'; end if;
  return t;
end $$;

create or replace function public.delete_athlete(p_aid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.athletes where id = p_aid and coach_id = auth.uid();
  if not found then raise exception 'Yetki yok'; end if;
end $$;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Oturum gerekli'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- Fonksiyon izinleri ---------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on function public.set_profile(text, text), public.create_invite(text), public.redeem_invite(text),
  public.create_parent_code(uuid), public.redeem_parent_code(text), public.athlete_parents(uuid), public.remove_parent(uuid, uuid),
  public.save_info(uuid, jsonb), public.save_logs(uuid, jsonb), public.save_coach(uuid, jsonb), public.delete_athlete(uuid),
  public.delete_my_account(), public.my_role(), public.is_parent_of(uuid) to authenticated;
grant execute on function public.invite_info(text), public.parent_code_info(text) to anon, authenticated;
