-- pglite: skip PostGIS, pg_cron, pg_net and pgmq do not exist in PGlite; ci-db runs this on Postgres 17.
-- T04 · Extensions (BUILD_PLAN §5.1): postgis, vector, pg_trgm, pgcrypto, pg_cron, pg_net, pgmq,
-- and real geography columns with GiST indexes.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

select has_extension('postgis', 'PostGIS is installed');
select has_extension('vector', 'pgvector is installed');
select has_extension('pg_trgm', 'pg_trgm is installed');
select has_extension('pgcrypto', 'pgcrypto is installed');
select has_extension('pg_cron', 'pg_cron is installed');
select has_extension('pg_net', 'pg_net is installed');
select has_extension('pgmq', 'pgmq is installed');

select is(
  (
    select array_agg(format('%s.%s', c.relname, a.attname) order by 1)
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'core'
      and (c.relname, a.attname) in (('localities', 'geom'), ('projects', 'footprint'), ('projects', 'centroid'))
      and format_type(a.atttypid, a.atttypmod) !~ '^(extensions\.)?geography\((MultiPolygon|Polygon|Point),4326\)$'
  ),
  null::text[],
  'localities.geom, projects.footprint and projects.centroid are geography(…, 4326)'
);

select lives_ok(
  $$insert into core.localities (kind, name, slug, geom)
    values ('sector', 'T04 Sector', 't04-sector',
      extensions.st_geogfromtext('SRID=4326;MULTIPOLYGON(((77.00 28.40, 77.01 28.40, 77.01 28.41, 77.00 28.41, 77.00 28.40)))'))$$,
  'a sector polygon can be stored'
);

select ok(
  (select extensions.st_dwithin(
     l.geom,
     extensions.st_geogfromtext('SRID=4326;POINT(77.005 28.405)'),
     10)
   from core.localities l where l.slug = 't04-sector'),
  'a point inside the sector is found with ST_DWithin'
);

select * from finish();
rollback;
