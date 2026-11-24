-- Row Level Security & privilege tests. Run with: npm run db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

-- ── Fixtures (as superuser) ─────────────────────────────────────────────────
insert into auth.users (id, email, raw_user_meta_data, aud, role)
values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@test.local',  '{"username":"admin_user"}',  'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b2', 'author@test.local', '{"username":"plain_user"}', 'authenticated', 'authenticated');

select is(
  (select username from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  'admin_user', 'trigger creates profile with username from metadata');
select is(
  (select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000b2'),
  'author', 'new users default to role author (not admin)');

update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';

insert into public.posts (slug, title, status) values
  ('published-post', 'Published', 'published'),
  ('draft-post', 'Draft', 'draft');
insert into public.documents (slug, title, external_url, status) values
  ('published-doc', 'Doc', 'https://example.com/a.pdf', 'published'),
  ('draft-doc', 'Draft doc', 'https://example.com/b.pdf', 'draft');

select isnt(
  (select published_at from public.posts where slug = 'published-post'), null,
  'publishing stamps published_at automatically');

-- ── Anonymous visitor ───────────────────────────────────────────────────────
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is((select count(*)::int from public.posts), 1, 'anon sees only published posts');
select is((select count(*)::int from public.posts where slug = 'draft-post'), 0, 'anon cannot see drafts');
select is((select count(*)::int from public.documents), 1, 'anon sees only published documents');
select throws_ok(
  $$ insert into public.posts (slug, title) values ('hack', 'Hack') $$,
  '42501', null, 'anon cannot insert posts');
select throws_ok(
  $$ update public.posts set title = 'pwned' $$,
  '42501', null, 'anon cannot update posts');
select throws_ok(
  $$ select * from public.profiles $$,
  '42501', null, 'anon cannot read profiles');
select throws_ok(
  $$ select * from public.studio_login_guard('admin_user', '1.2.3.4') $$,
  '42501', null, 'anon cannot call the login guard (no email lookup)');
select throws_ok(
  $$ select * from private.login_attempts $$,
  '42501', null, 'anon cannot read private schema');

-- ── Authenticated but NOT admin ─────────────────────────────────────────────
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);

select is((select count(*)::int from public.posts), 1, 'non-admin sees only published posts');
select throws_ok(
  $$ insert into public.posts (slug, title) values ('nope', 'Nope') $$,
  '42501', null, 'non-admin cannot insert posts');
select is_empty(
  $$ delete from public.posts returning id $$,
  'non-admin cannot delete posts');
select is((select count(*)::int from public.profiles), 1, 'non-admin reads only own profile');
select throws_ok(
  $$ update public.profiles set role = 'admin' $$,
  '42501', null, 'non-admin cannot promote themselves');
select throws_ok(
  $$ select * from public.studio_login_guard('admin_user', '1.2.3.4') $$,
  '42501', null, 'authenticated users cannot call the login guard');

-- ── Admin ───────────────────────────────────────────────────────────────────
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select is((select count(*)::int from public.posts), 2, 'admin sees drafts too');
select lives_ok(
  $$ insert into public.posts (slug, title, content, status) values ('new-post', 'New', '# Hi', 'draft') $$,
  'admin can insert posts');
select isnt_empty(
  $$ update public.posts set status = 'published' where slug = 'new-post' returning id $$,
  'admin can publish posts');
select isnt_empty(
  $$ delete from public.posts where slug = 'new-post' returning id $$,
  'admin can delete posts');
select throws_ok(
  $$ insert into public.posts (slug, title) values ('Bad Slug!', 'x') $$,
  '23514', null, 'slug format is enforced by a check constraint');
select throws_ok(
  $$ insert into public.posts (slug, title, featured) values ('f1', 'F1', true), ('f2', 'F2', true) $$,
  '23505', null, 'only one essay can be featured');

-- ── Login guard (as the server's service_role) ──────────────────────────────
reset role;
set local role service_role;
select is(
  (select email from public.studio_login_guard('ADMIN_USER', '1.2.3.4')),
  'admin@test.local', 'login guard resolves username case-insensitively');
select is(
  (select email from public.studio_login_guard('nobody', '1.2.3.4')),
  null, 'unknown username returns no email');

select public.studio_record_login('admin_user', '9.9.9.9', false) from generate_series(1, 5);
select is(
  (select allowed from public.studio_login_guard('admin_user', '1.2.3.4')),
  false, 'username is locked after 5 failed attempts');

select * from finish();
rollback;
