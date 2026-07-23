-- Quetzal account and cloud-trip schema.
-- Run once in Supabase SQL Editor. Safe to rerun.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  start_date date,
  end_date date,
  route jsonb not null default '[]'::jsonb check (jsonb_typeof(route) = 'array'),
  activities jsonb not null default '[]'::jsonb check (jsonb_typeof(activities) = 'array'),
  saved_places jsonb not null default '[]'::jsonb check (jsonb_typeof(saved_places) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trips_user_updated_idx on public.trips (user_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.trips enable row level security;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.trips to authenticated;

drop policy if exists "Users manage their profile" on public.profiles;
create policy "Users manage their profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users manage their trips" on public.trips;
create policy "Users manage their trips" on public.trips for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
