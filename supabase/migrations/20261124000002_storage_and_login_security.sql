-- ════════════════════════════════════════════════════════════════════════════
-- Storage for PDFs + Studio login hardening
-- ════════════════════════════════════════════════════════════════════════════

-- ── Storage bucket: documents (PRIVATE) ─────────────────────────────────────
-- Private bucket: files are served through short-lived signed URLs, and only
-- for documents that are published. Draft PDFs cannot be fetched by URL guessing.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Read (needed to create signed URLs): admins, or anyone for a published document's file.
create policy "documents bucket: read published or admin"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'documents'
    and (
      (select public.is_admin())
      or exists (
        select 1 from public.documents d
        where d.file_path = storage.objects.name and d.status = 'published'
      )
    )
  );

create policy "documents bucket: admin uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (select public.is_admin()));

create policy "documents bucket: admin updates"
  on storage.objects for update to authenticated
  using (bucket_id = 'documents' and (select public.is_admin()))
  with check (bucket_id = 'documents' and (select public.is_admin()));

create policy "documents bucket: admin deletes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (select public.is_admin()));

-- ── Private schema (never exposed through the Data API) ─────────────────────
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.login_attempts (
  id         bigint generated always as identity primary key,
  username   text not null,
  ip_hash    text not null,          -- sha256 of client IP; raw IPs are not stored
  succeeded  boolean not null,
  created_at timestamptz not null default now()
);
create index login_attempts_username_idx on private.login_attempts (username, created_at desc);
create index login_attempts_ip_idx       on private.login_attempts (ip_hash, created_at desc);

-- ── Login guard ─────────────────────────────────────────────────────────────
-- Called ONLY by the server (secret key). Returns whether a login attempt is
-- allowed and, if so, the email behind the username (Supabase Auth signs in
-- by email). The username→email mapping is never exposed to browsers.
-- Limits: 5 failures / 15 min per username, 20 failures / 15 min per IP.
create or replace function public.studio_login_guard(p_username text, p_ip text)
returns table (allowed boolean, email text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := lower(trim(p_username));
  v_ip_hash  text := encode(sha256(convert_to(coalesce(p_ip, 'unknown'), 'UTF8')), 'hex');
  v_user_failures int;
  v_ip_failures   int;
begin
  select count(*) into v_user_failures
  from private.login_attempts
  where username = v_username and not succeeded and created_at > now() - interval '15 minutes';

  select count(*) into v_ip_failures
  from private.login_attempts
  where ip_hash = v_ip_hash and not succeeded and created_at > now() - interval '15 minutes';

  if v_user_failures >= 5 or v_ip_failures >= 20 then
    return query select false, null::text;
    return;
  end if;

  return query
    select true, u.email::text
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.username = v_username
    union all
    select true, null::text
    where not exists (select 1 from public.profiles where username = v_username)
    limit 1;
end;
$$;

create or replace function public.studio_record_login(p_username text, p_ip text, p_succeeded boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := lower(trim(p_username));
begin
  insert into private.login_attempts (username, ip_hash, succeeded)
  values (v_username, encode(sha256(convert_to(coalesce(p_ip, 'unknown'), 'UTF8')), 'hex'), p_succeeded);

  if p_succeeded then
    delete from private.login_attempts where username = v_username and not succeeded;
  end if;

  -- Housekeeping: keep one day of history.
  delete from private.login_attempts where created_at < now() - interval '1 day';
end;
$$;

-- Only the server-side secret key (service_role) may call these.
revoke all on function public.studio_login_guard(text, text) from public, anon, authenticated;
revoke all on function public.studio_record_login(text, text, boolean) from public, anon, authenticated;
grant execute on function public.studio_login_guard(text, text) to service_role;
grant execute on function public.studio_record_login(text, text, boolean) to service_role;
