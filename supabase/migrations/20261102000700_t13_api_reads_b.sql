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

-- ---------------------------------------------------------------------------
-- Lockdown sweep (T04 pattern, BUILD_PLAN §12.1), then the explicit api grants.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all sequences in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all functions in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;

grant execute on function api.flags() to anon, authenticated, service_role;
grant execute on function api.risk_summary(text) to anon, authenticated, service_role;
grant execute on function api.evidence(text) to anon, authenticated, service_role;
grant execute on function api.project_page(text) to anon, authenticated, service_role;
