-- ════════════════════════════════════════════════════════════════════════════
-- Emergent Thoughts: core schema
--   profiles  : 1:1 with auth.users, holds username + role
--   posts     : essays (Markdown), draft/published workflow
--   documents : PDFs in Storage or external links, draft/published workflow
--
-- Security model: Row Level Security on every table.
--   • Anyone (anon) can read PUBLISHED content only.
--   • Only users whose profile.role = 'admin' can write.
--   • Nobody can change their own role through the API.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Enums ───────────────────────────────────────────────────────────────────
create type public.content_status as enum ('draft', 'published');
create type public.user_role      as enum ('admin', 'author');

-- ── Profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text not null unique
             check (username ~ '^[a-z0-9_]{3,32}$'),
  role       public.user_role not null default 'author',
  created_at timestamptz not null default now()
);
comment on table public.profiles is 'Studio users. role=admin may publish content.';

-- ── Posts ───────────────────────────────────────────────────────────────────
create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique
               check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title        text not null check (char_length(title) between 1 and 200),
  excerpt      text not null default '' check (char_length(excerpt) <= 500),
  content      text not null default '',
  category     text check (category is null or char_length(category) <= 50),
  featured     boolean not null default false,
  status       public.content_status not null default 'draft',
  published_at timestamptz,
  author_id    uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint posts_published_has_date check (status = 'draft' or published_at is not null)
);
comment on column public.posts.content is 'Markdown. Rendered server-side and sanitised.';

create index posts_published_idx on public.posts (published_at desc) where status = 'published';
create index posts_author_id_idx on public.posts (author_id);
create index posts_category_idx  on public.posts (category) where status = 'published';

-- ── Documents ───────────────────────────────────────────────────────────────
create table public.documents (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique
               check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title        text not null check (char_length(title) between 1 and 200),
  description  text not null default '' check (char_length(description) <= 1000),
  category     text check (category is null or char_length(category) <= 50),
  file_path    text unique,     -- object name inside the "documents" storage bucket
  external_url text check (external_url is null or external_url ~ '^https://'),
  status       public.content_status not null default 'draft',
  published_at timestamptz,
  author_id    uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint documents_has_source check (num_nonnulls(file_path, external_url) = 1),
  constraint documents_published_has_date check (status = 'draft' or published_at is not null)
);

create index documents_published_idx on public.documents (published_at desc) where status = 'published';
create index documents_author_id_idx on public.documents (author_id);

-- ── Triggers: timestamps ────────────────────────────────────────────────────
create or replace function public.set_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  -- First publish stamps published_at; keep the original date on later edits.
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger posts_set_timestamps
  before insert or update on public.posts
  for each row execute function public.set_timestamps();

create trigger documents_set_timestamps
  before insert or update on public.documents
  for each row execute function public.set_timestamps();

-- ── Trigger: create a profile for every new auth user ───────────────────────
-- Username comes from user metadata ({"username": "..."}) set when the
-- account is created by an administrator. Role always starts as 'author';
-- promotion to admin is a deliberate, separate SQL step.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Helper: is the current user an admin? ───────────────────────────────────
-- SECURITY DEFINER so RLS policies can consult profiles without recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.posts     enable row level security;
alter table public.documents enable row level security;

-- profiles: read own row (admins read all). No insert/update/delete via API:
-- rows are created by trigger and roles are changed only with SQL.
create policy "profiles: read own or admin"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

-- posts
create policy "posts: public reads published"
  on public.posts for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));
create policy "posts: admin inserts"
  on public.posts for insert to authenticated
  with check ((select public.is_admin()));
create policy "posts: admin updates"
  on public.posts for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "posts: admin deletes"
  on public.posts for delete to authenticated
  using ((select public.is_admin()));

-- documents
create policy "documents: public reads published"
  on public.documents for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));
create policy "documents: admin inserts"
  on public.documents for insert to authenticated
  with check ((select public.is_admin()));
create policy "documents: admin updates"
  on public.documents for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "documents: admin deletes"
  on public.documents for delete to authenticated
  using ((select public.is_admin()));

-- Least privilege at the grant level too (RLS still applies on top).
revoke all on public.profiles, public.posts, public.documents from anon, authenticated;
grant select on public.posts, public.documents to anon;
grant select, insert, update, delete on public.posts, public.documents to authenticated;
grant select on public.profiles to authenticated;
