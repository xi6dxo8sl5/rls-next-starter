-- Run once in the Supabase SQL editor (or as a migration).
-- Authorization lives in these policies: every write is checked against auth.uid().

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text unique check (char_length(handle) between 3 and 24),
  created_at timestamptz not null default now()
);

create table public.notes (
  id bigint generated always as identity primary key,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '',
  created_at timestamptz not null default now()
);

create index notes_author_created_idx on public.notes (author_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.notes enable row level security;

create policy "signed-in users read profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "signed-in users read notes"
  on public.notes for select
  to authenticated
  using (true);

create policy "authors insert their own notes"
  on public.notes for insert
  to authenticated
  with check (author_id = (select auth.uid()));

create policy "authors update their own notes"
  on public.notes for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "authors delete their own notes"
  on public.notes for delete
  to authenticated
  using (author_id = (select auth.uid()));

-- Mirror new auth users into profiles so author_id always has a target row.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, handle)
  values (new.id, 'user_' || left(new.id::text, 8));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
