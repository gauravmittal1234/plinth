-- T43a · Event engine 4/5: core.share_cards issue and lookup (DATA_MODEL §2;
-- WORK_BREAKDOWN T43a: "Also core.share_cards issue and lookup, and a
-- perceptual-hash column"). The phash bit(64) column itself was created by
-- T04; a perceptual hash is computed outside Postgres (an image library in the
-- pipeline or the WhatsApp handler) and handed to issue_share_card to store.
--
-- short_code convention (fixtures C-37; seed/40_share_cards.sql): the card's
-- own id, first 8 hex characters — ce57248d-00f6-… → short_code ce57248d.
-- "Derived from the card id", never a separate random sequence.

create function core.issue_share_card(
  p_phase_id uuid,
  p_kind text,
  p_run_id uuid default null,
  p_data_as_of date default null,
  p_phash bit(64) default null
)
returns core.share_cards
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_model_version text;
  v_band core.band;
  v_data_as_of date := p_data_as_of;
  v_id uuid;
  v_short text;
  v_attempt integer := 0;
  v_row core.share_cards;
begin
  if p_kind not in ('risk', 'cost', 'visit', 'digest') then
    perform ops.raise_api_error('invalid_input', pg_catalog.format('issue_share_card: %L is not a share-card kind (risk, cost, visit, digest).', p_kind));
  end if;

  if p_run_id is not null then
    select r.model_version, r.band, r.data_cutoff into v_model_version, v_band, v_data_as_of
      from core.score_runs r where r.id = p_run_id;
    if v_model_version is null then
      perform ops.raise_api_error('not_found', 'issue_share_card: run_id does not match a score run.');
    end if;
  end if;

  if v_data_as_of is null then
    perform ops.raise_api_error('invalid_input', 'issue_share_card: give data_as_of, or a run_id to take it from.');
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_id := extensions.gen_random_uuid();
    v_short := pg_catalog.left(v_id::text, 8);
    begin
      insert into core.share_cards (id, phase_id, kind, run_id, data_as_of, model_version, band, phash, short_code)
      values (v_id, p_phase_id, p_kind, p_run_id, v_data_as_of, v_model_version, v_band, p_phash, v_short)
      returning * into v_row;
      exit;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise;
      end if;
    end;
  end loop;

  return v_row;
end
$$;
comment on function core.issue_share_card(uuid, text, uuid, date, bit) is 'Issues a share card. With run_id, model_version/band/data_as_of always come from that published run, never a caller-supplied value. short_code = the card''s own id, first 8 hex characters.';

create function core.find_share_card(p_short_code text)
returns setof core.share_cards
language sql
stable
security definer
set search_path = ''
as $$
  select c.* from core.share_cards c where c.short_code = p_short_code;
$$;
comment on function core.find_share_card(text) is 'Looks up a card by its short code (printed on the card / in its QR link), so an old forwarded card can answer "Changed since this card was sent". setof: zero rows for an unknown code, never one row of nulls.';

create function core.find_share_cards_by_phash(p_phash bit(64), p_max_distance integer default 8)
returns setof core.share_cards
language sql
stable
security definer
set search_path = ''
as $$
  select c.*
    from core.share_cards c
   where c.phash is not null
     and pg_catalog.bit_count(c.phash # p_phash) <= p_max_distance
   order by pg_catalog.bit_count(c.phash # p_phash), c.issued_at desc;
$$;
comment on function core.find_share_cards_by_phash(bit, integer) is 'Fuzzy lookup for a forwarded card image with no readable short code: cards within max_distance Hamming bits of the given 64-bit perceptual hash, closest first.';

-- ---------------------------------------------------------------------------
-- Deny by default (BUILD_PLAN §12.1), targeted at only the functions this
-- task created (20261113000100-000400): a schema-wide "revoke all … from
-- public, anon, authenticated" here would also strip the grants other tasks'
-- migrations already gave api.* functions (T12/T13's api_reads_b.sql is the
-- last file to re-run that sweep; T40/T41/T42 do not), so this task revokes
-- by name instead of repeating that whole-schema sweep.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('core', 'ops')
       and p.proname in (
         'ist_noon', 'sweep_qpr_missing',
         '_emit_event', 'events_from_qpr_filing', 'events_from_extension', 'events_from_order',
         'events_from_price_list', 'events_from_developer_reply', 'events_from_band_history',
         'events_from_rescore_start', 'issue_share_card', 'find_share_card', 'find_share_cards_by_phash'
       )
  loop
    execute pg_catalog.format('revoke execute on function %s from public, anon, authenticated', r.sig);
  end loop;
end
$$;

grant execute on function core.issue_share_card(uuid, text, uuid, date, bit) to pipeline_writer, service_role;
grant execute on function core.find_share_card(text) to pipeline_writer, service_role;
grant execute on function core.find_share_cards_by_phash(bit, integer) to pipeline_writer, service_role;
