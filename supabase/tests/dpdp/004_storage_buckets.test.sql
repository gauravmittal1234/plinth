-- T53 · The DPDP buckets are private and no storage policy opens them to a client
-- (BUILD_PLAN §12.7). Files move only through the secret key at the edge and 5-minute signed
-- URLs. PGlite has no storage schema, so both checks skip there; ci-db runs them.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

create function pg_temp.t53_scalar(p_sql text)
returns text
language plpgsql
as $$
declare
  v text;
begin
  execute p_sql into v;
  return v;
end
$$;

select case
  when to_regclass('storage.buckets') is null
    then skip('no storage schema here (PGlite); ci-db checks the buckets', 1)
  else is(
    pg_temp.t53_scalar($q$
      select string_agg(b.id || ':' || coalesce(to_jsonb(b) ->> 'public', 'false'), ',' order by b.id)
      from storage.buckets b where b.id in ('exports', 'uploads', 'voice-tmp')
    $q$),
    'exports:false,uploads:false,voice-tmp:false',
    'exports, uploads and voice-tmp exist and are private'
  )
end;

select case
  when to_regclass('storage.objects') is null
    then skip('no storage schema here (PGlite); ci-db checks the policies', 1)
  else is(
    pg_temp.t53_scalar($q$
      select count(*)::text from pg_catalog.pg_policies p
      where p.schemaname = 'storage' and p.tablename = 'objects'
        and (coalesce(p.qual, '') ~ '(exports|uploads|voice-tmp)' or coalesce(p.with_check, '') ~ '(exports|uploads|voice-tmp)')
    $q$),
    '0',
    'no storage.objects policy names them: no client reads, lists or writes these files'
  )
end;

select * from finish();
rollback;
