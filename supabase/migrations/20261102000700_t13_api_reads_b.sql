-- T13 · API reads B 7/7: the public read API for the M1 pages.
-- Sources: API_CONTRACTS §1 (transport, errors), §3.1, §4.2–§4.6; packages/contracts schemas
-- (the source of truth in code); WORK_BREAKDOWN T13; INTEGRATION_NOTES (T12/T16 handoffs:
-- SQL defaults on every api.search_projects argument; the optional p_slug on api.evidence).
--
-- Public read API (anon, cacheable). Every function is SECURITY DEFINER with
-- search_path = '' (the only door to core and ws, deny by default, BUILD_PLAN §12.1) and STABLE,
-- so PostgREST serves GET …/rpc/<fn>?p_…=… too. Errors follow API_CONTRACTS §1: SQLSTATE
-- PT<http>, message = domain code (not_found, invalid_input).

create function api.project_page(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_phase_id uuid;
  v_out jsonb;
begin
  if p_slug is null or pg_catalog.btrim(p_slug) = '' then
    perform ops.raise_api_error('invalid_input', 'Give the project''s page name, for example aurelia-heights-phase-2.');
  end if;
  select p.id into v_phase_id from core.phases p where p.slug = pg_catalog.lower(pg_catalog.btrim(p_slug));
  if v_phase_id is null then
    perform ops.raise_api_error('not_found', 'We have no project at this address.');
  end if;
  v_out := core.project_page_json(v_phase_id);
  if v_out is null then
    perform ops.raise_api_error('not_found', 'We have not published this project''s page yet.');
  end if;
  return v_out;
end
$$;
comment on function api.project_page(text) is 'plinth.project_page/1 (API_CONTRACTS §4.2): the project page, its risk block identical to api.risk_summary. Published runs only. Errors: invalid_input, not_found.';

create function api.developer_page(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_group_id uuid;
begin
  if p_slug is null or pg_catalog.btrim(p_slug) = '' then
    perform ops.raise_api_error('invalid_input', 'Give the developer''s page name, for example northfield-estates.');
  end if;
  select g.id into v_group_id from core.developer_groups g where g.slug = pg_catalog.lower(pg_catalog.btrim(p_slug));
  if v_group_id is null then
    perform ops.raise_api_error('not_found', 'We have no developer at this address.');
  end if;
  return core.developer_page_json(v_group_id);
end
$$;
comment on function api.developer_page(text) is 'plinth.developer_page/1 (API_CONTRACTS §4.4): a developer group''s page. Errors: invalid_input, not_found.';

-- Every argument has a SQL default (T16 handoff): clients send only what the buyer set.
create function api.search_projects(
  p_q text default null,
  p_filters jsonb default null,
  p_sort text default 'lowest_risk',
  p_bbox jsonb default null,
  p_cursor text default null,
  p_limit integer default 20
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_q is not null and pg_catalog.length(p_q) > 200 then
    perform ops.raise_api_error('invalid_input', 'Keep the search to 200 characters.');
  end if;
  if p_filters is not null and pg_catalog.jsonb_typeof(p_filters) <> 'object' then
    perform ops.raise_api_error('invalid_input', 'Filters are an object, for example {"bhk": [3]}.');
  end if;
  if p_bbox is not null and (pg_catalog.jsonb_typeof(p_bbox) <> 'array' or pg_catalog.jsonb_array_length(p_bbox) <> 4) then
    perform ops.raise_api_error('invalid_input', 'A map box is [min longitude, min latitude, max longitude, max latitude].');
  end if;
  return core.search_json(p_q, p_filters, p_sort, p_bbox, p_cursor, coalesce(p_limit, 20));
end
$$;
comment on function api.search_projects(text, jsonb, text, jsonb, text, integer) is 'plinth.search_results/1 (API_CONTRACTS §4.3): deterministic parsing, filters that say what they hid, lowest delivery risk first. Every argument is optional. Errors: invalid_input.';

create function api.suggest(p_q text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_q is null or pg_catalog.btrim(p_q) = '' or pg_catalog.length(p_q) > 100 then
    perform ops.raise_api_error('invalid_input', 'Type between 1 and 100 characters.');
  end if;
  return core.suggest_json(p_q);
end
$$;
comment on function api.suggest(text) is 'plinth.suggest/1 (API_CONTRACTS §3.1): up to 8 typo-tolerant name, RERA number and sector matches. Errors: invalid_input.';

create function api.compare(p_slugs text[])
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_slugs text[];
  v_ids uuid[];
begin
  select pg_catalog.array_agg(s order by o) into v_slugs
  from (
    select pg_catalog.lower(pg_catalog.btrim(x)) as s, pg_catalog.min(o) as o
    from pg_catalog.unnest(p_slugs) with ordinality as t(x, o)
    where x is not null and pg_catalog.btrim(x) <> ''
    group by pg_catalog.lower(pg_catalog.btrim(x))
  ) as d;
  if v_slugs is null or pg_catalog.cardinality(v_slugs) not between 2 and 4 then
    perform ops.raise_api_error('invalid_input', 'Compare 2 to 4 different projects.');
  end if;
  select pg_catalog.array_agg(p.id order by t.o) into v_ids
  from pg_catalog.unnest(v_slugs) with ordinality as t(s, o)
  join core.phases p on p.slug = t.s
  where p.id in (select l.id from core.listed_phase_ids() as l(id));
  if v_ids is null or pg_catalog.cardinality(v_ids) <> pg_catalog.cardinality(v_slugs) then
    perform ops.raise_api_error('not_found', 'We have no published page for one of these projects.');
  end if;
  return core.compare_json(v_ids);
end
$$;
comment on function api.compare(text[]) is 'plinth.compare/1 (API_CONTRACTS §4.5): 2–4 phases side by side. Errors: invalid_input (not 2–4 different slugs), not_found.';

create function api.methodology()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select core.methodology_json()
$$;
comment on function api.methodology() is 'plinth.methodology/1: model versions, factor weights, red-flag rules, confidence states, the calibration table and the changelog.';

create function api.about()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select core.about_json()
$$;
comment on function api.about() is 'plinth.about/1: who we are, the calibration table, how we make money, response times, the grievance officer and coverage.';

-- The evidence drawer opened from a page: the optional p_slug (T12 → T13). An overload, so
-- api.evidence(p_fact_id) stays as T12 built it and PostgREST picks by the arguments sent.
create function api.evidence(p_fact_id text, p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_phase_id uuid;
  v_out jsonb;
begin
  if p_fact_id is null or pg_catalog.btrim(p_fact_id) = '' then
    perform ops.raise_api_error('invalid_input', 'Give the id of the fact to show.');
  end if;
  if p_fact_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    perform ops.raise_api_error('not_found', 'We have no record with this id.');
  end if;
  if p_slug is not null and pg_catalog.btrim(p_slug) <> '' then
    select p.id into v_phase_id from core.phases p where p.slug = pg_catalog.lower(pg_catalog.btrim(p_slug));
    if v_phase_id is null then
      perform ops.raise_api_error('not_found', 'We have no project at this address.');
    end if;
  end if;
  v_out := core.evidence_in_context(p_fact_id::uuid, v_phase_id);
  if v_out is null then
    perform ops.raise_api_error('not_found', 'We have no record with this id.');
  end if;
  return v_out;
end
$$;
comment on function api.evidence(text, text) is 'plinth.evidence/1 as seen from a project page (p_slug): used_in names that page''s reasons. Errors: invalid_input, not_found.';

-- ---------------------------------------------------------------------------
-- Lockdown sweep (T04 pattern, BUILD_PLAN §12.1), then the explicit api grants.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all sequences in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all functions in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;

grant execute on function api.flags() to anon, authenticated, service_role;
grant execute on function api.risk_summary(text) to anon, authenticated, service_role;
grant execute on function api.evidence(text) to anon, authenticated, service_role;
grant execute on function api.evidence(text, text) to anon, authenticated, service_role;
grant execute on function api.project_page(text) to anon, authenticated, service_role;
grant execute on function api.developer_page(text) to anon, authenticated, service_role;
grant execute on function api.search_projects(text, jsonb, text, jsonb, text, integer) to anon, authenticated, service_role;
grant execute on function api.suggest(text) to anon, authenticated, service_role;
grant execute on function api.compare(text[]) to anon, authenticated, service_role;
grant execute on function api.methodology() to anon, authenticated, service_role;
grant execute on function api.about() to anon, authenticated, service_role;
