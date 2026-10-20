-- T12 · API reads A 3/3: api.risk_summary(p_slug) and api.evidence(p_fact_id).
-- Sources: API_CONTRACTS §1 (transport, errors), §2 (RiskSummary), §3.1, §4.1, §4.6;
-- packages/contracts schemas risk_summary and evidence (the source of truth in code);
-- DATA_MODEL §12 inv. 1, 2 and 8.
--
-- Public read API (anon, cacheable). SECURITY DEFINER with search_path = '': the
-- functions are the only door to core and ws (deny by default, BUILD_PLAN §12.1).
-- Both are STABLE, so PostgREST also serves them as GET …/rpc/<fn>?p_…=….
-- Errors follow API_CONTRACTS §1: SQLSTATE PT<http>, message = domain code.

create function api.risk_summary(p_slug text)
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

  v_out := core.risk_summary_json(v_phase_id);
  if v_out is null then
    perform ops.raise_api_error('not_found', 'We have not published a risk summary for this project yet.');
  end if;
  return v_out;
end
$$;
comment on function api.risk_summary(text) is 'plinth.risk_summary/1 (API_CONTRACTS §2): the one risk object for web, app, WhatsApp and the card. Published runs only; band, frequency, reasons and what-would-change are null unless bands are public, the group is not facts-only and the phase is scored. Never a pending notice''s band. Errors: invalid_input, not_found.';

create function api.evidence(p_fact_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_out jsonb;
begin
  if p_fact_id is null or pg_catalog.btrim(p_fact_id) = '' then
    perform ops.raise_api_error('invalid_input', 'Give the id of the fact to show.');
  end if;

  -- Fact ids are opaque to clients (contracts FactId): anything that is not one of ours is not found.
  if p_fact_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    perform ops.raise_api_error('not_found', 'We have no record with this id.');
  end if;

  v_out := core.evidence_json(p_fact_id::uuid);
  if v_out is null then
    perform ops.raise_api_error('not_found', 'We have no record with this id.');
  end if;
  return v_out;
end
$$;
comment on function api.evidence(text) is 'plinth.evidence/1 (API_CONTRACTS §4.6): the evidence drawer for one fact. Buyer uploads are never shown. Errors: invalid_input, not_found.';

-- ---------------------------------------------------------------------------
-- Lockdown sweep (T04 pattern, BUILD_PLAN §12.1), then the explicit api grants.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all sequences in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all functions in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;

grant execute on function api.flags() to anon, authenticated, service_role;
grant execute on function api.risk_summary(text) to anon, authenticated, service_role;
grant execute on function api.evidence(text) to anon, authenticated, service_role;
