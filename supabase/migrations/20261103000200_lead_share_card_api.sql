-- Lead · M2 gap: public API wrappers over T43a's core.share_cards functions
-- (DATA_MODEL §2; API_CONTRACTS §3.1, §3.6; supabase/migrations/20261113000400).
-- PR #76 (T46a, WhatsApp risk card) needs these three, which no task has built yet:
--
--   api.share_card(p_code)             -- /c/[code], the WaDigest "returned card" diff
--   api.wa_match_share_card(p_sha256)  -- wa-webhook: forwarded image -> its card
--   api.resolve_short_link(p_code)     -- a plinth.in/r/<code> link typed into WhatsApp
--
-- Each is read-only, SECURITY DEFINER with search_path = '', and raises not_found
-- through ops.raise_api_error when nothing matches (AGENTS.md §6 rules 9-10: never a
-- confirmation or a fact the RPC did not return).

-- ---------------------------------------------------------------------------
-- core.share_card_json: the composition helper behind api.share_card, in the
-- core.risk_summary_json style (core-private; T12's api.risk_summary pattern).
--
-- "sent" is the share_cards row itself: band, model_version and data_as_of are its
-- own stored columns (never re-derived from the run, which may since have been
-- superseded), because that is "the card as it was sent". Its frequency sentence is
-- rebuilt from the issuing run's own freq_low/high/point -- score_runs rows are never
-- edited after publish, so that is still the true historical figure.
--
-- "now" is core.risk_summary_json(phase_id), the one live RiskSummary every other
-- surface reads, so a card's "changed" diff is always against the same number the web
-- page and the app show today.
--
-- The diff ("changes") only ever compares fields both snapshots truly carry: band and
-- data_as_of. Complaints, QPR filing status and similar have no historical snapshot
-- on a share card (T43a stored only band/model_version/data_as_of/phash), so this
-- never fabricates a before/after line for them (AGENTS.md §6 rule 10) -- a future
-- task that gives share_cards a fuller snapshot can extend v_changes here.
-- ---------------------------------------------------------------------------
create function core.share_card_json(p_short_code text)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_card core.share_cards%rowtype;
  v_phase core.phases%rowtype;
  v_project core.projects%rowtype;
  v_run core.score_runs%rowtype;
  v_city jsonb;
  v_base text := core.public_base_url();
  v_sent_label text;
  v_sent_freq text;
  v_sent jsonb;
  v_now jsonb;
  v_now_band text;
  v_now_data_as_of date;
  v_now_model_version text;
  v_now_chip jsonb;
  v_now_lines jsonb;
  v_now_card_url text;
  v_now_since date;
  v_live_url text;
  v_changed boolean := false;
  v_headline text;
  v_changes jsonb := '[]'::jsonb;
begin
  select * into v_card from core.share_cards c where c.short_code = p_short_code;
  if not found then
    return null;
  end if;

  select * into v_phase from core.phases p where p.id = v_card.phase_id;
  select * into v_project from core.projects pr where pr.id = v_phase.project_id;
  v_city := core.locality_city(v_project.locality_id);

  if v_card.run_id is not null then
    select * into v_run from core.score_runs r where r.id = v_card.run_id;
  end if;

  v_sent_label := case when v_card.band is not null then core.band_label(v_card.band::text) end;
  if v_run.id is not null and v_run.set_by is distinct from 'red_flag_rule'
    and (v_run.freq_point is not null or (v_run.freq_low is not null and v_run.freq_high is not null)) then
    v_sent_freq := case
      when v_run.freq_point is not null then 'About ' || v_run.freq_point || ' of 100'
      else 'Between ' || v_run.freq_low || ' and ' || v_run.freq_high || ' of 100'
    end;
  end if;

  v_sent := pg_catalog.jsonb_build_object(
    'issued_at', core.fmt_timestamp(v_card.issued_at),
    'data_as_of', v_card.data_as_of,
    'model_version', v_card.model_version,
    'band', v_card.band,
    'chip', case when v_sent_label is not null then pg_catalog.jsonb_build_object(
      'kind', 'band', 'label', v_sent_label,
      'step', core.band_step(v_card.band::text), 'meter_filled', core.band_step(v_card.band::text)) end,
    'lines', pg_catalog.to_jsonb(pg_catalog.array_remove(array[
      case when v_sent_label is not null then 'Delivery risk: ' || v_sent_label end,
      case when v_sent_freq is not null then v_sent_freq || ' similar ' || (v_city ->> 'name')
        || ' projects got their OC more than 12 months late.' end
    ], null)),
    -- Only kinds /cards/<kind>/[slug].png actually renders (T27, apps/web/app/cards):
    -- risk and cost. visit and digest have no card route yet (default -> 404), so an
    -- honest card_url is null rather than a link that can never resolve.
    'card_url', case when v_card.kind in ('risk', 'cost')
      then v_base || '/cards/' || v_card.kind || '/' || v_phase.slug || '.png'
        || case when v_card.run_id is not null then '?run=' || v_card.run_id else '' end
    end
  );

  -- The live record: the same RiskSummary every surface reads, regardless of which
  -- card template (risk/cost/visit/digest) was originally shared -- "has the risk
  -- picture changed since this card was sent" is one question, not one per kind.
  v_now := core.risk_summary_json(v_phase.id);

  if v_now is not null then
    v_now_band := v_now -> 'band' ->> 'code';
    v_now_data_as_of := (v_now -> 'meta' ->> 'data_as_of')::date;
    v_now_model_version := v_now -> 'meta' ->> 'model_version';
    v_now_chip := v_now -> 'chip';
    v_now_lines := coalesce(v_now -> 'share' -> 'lines', '[]'::jsonb);
    v_now_card_url := v_now -> 'share' ->> 'card_url';
    v_live_url := v_now -> 'meta' ->> 'live_url';
    v_now_since := nullif(v_now -> 'band' ->> 'since', '')::date;
  else
    -- No published run at all (should not happen for a phase that ever issued a
    -- card): the most honest "now" is the last state we truly know, the card itself.
    v_now_band := v_card.band;
    v_now_data_as_of := v_card.data_as_of;
    v_now_model_version := v_card.model_version;
    v_now_chip := v_sent -> 'chip';
    v_now_lines := coalesce(v_sent -> 'lines', '[]'::jsonb);
    v_now_card_url := v_sent ->> 'card_url';
    v_live_url := v_base || '/' || (v_city ->> 'slug') || '/projects/' || v_phase.slug;
  end if;

  if v_now_band is not null and v_now_band is distinct from v_card.band::text then
    v_changed := true;
    v_changes := v_changes || pg_catalog.jsonb_build_object(
      'key', 'band',
      'label', 'Delivery risk',
      'before_line', coalesce(v_sent_label, 'Not scored'),
      'after_line', core.band_label(v_now_band) || coalesce(' since ' || ops.fmt_date(v_now_since), '')
    );
    v_headline := 'Changed since this card was sent: band ' || coalesce(v_sent_label, 'Not scored')
      || ' → ' || core.band_label(v_now_band) || coalesce(' (' || core.fmt_day_month(v_now_since) || ')', '') || '.';
  end if;

  if v_now_data_as_of is not null and v_now_data_as_of is distinct from v_card.data_as_of then
    v_changed := true;
    v_changes := v_changes || pg_catalog.jsonb_build_object(
      'key', 'data_as_of',
      'label', 'Data as of',
      'before_line', coalesce(ops.fmt_date(v_card.data_as_of), 'Not known'),
      'after_line', ops.fmt_date(v_now_data_as_of)
    );
    if v_headline is null then
      v_headline := 'Changed since this card was sent: new data as of ' || ops.fmt_date(v_now_data_as_of) || '.';
    end if;
  end if;

  v_now := pg_catalog.jsonb_build_object(
    'issued_at', null,
    'data_as_of', v_now_data_as_of,
    'model_version', v_now_model_version,
    'band', v_now_band,
    'chip', v_now_chip,
    'lines', v_now_lines,
    'card_url', v_now_card_url
  );

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.share_card/1',
    'kind', v_card.kind,
    'phase', pg_catalog.jsonb_build_object('slug', v_phase.slug, 'name', v_phase.name),
    'sent', v_sent,
    'now', v_now,
    'changed', v_changed,
    'headline_line', v_headline,
    'changes', v_changes,
    'live_url', coalesce(v_live_url, v_base || '/' || (v_city ->> 'slug') || '/projects/' || v_phase.slug)
  );
end
$$;
comment on function core.share_card_json(text) is 'plinth.share_card/1 for one share code, or null when it is unknown. api.share_card wraps it; the diff never carries a fact share_cards did not itself store (band, data_as_of only).';

-- ---------------------------------------------------------------------------
-- api.share_card(p_code): /c/[code] and the WaDigest "returned card" flow
-- (API_CONTRACTS §3.1, §3.6). Anon-safe: every field is already public on the
-- project page (phase slug/name, band, lines, card_url, live_url) -- nothing a
-- buyer or developer gave us privately, so there is nothing to withhold from anon.
-- ---------------------------------------------------------------------------
create function api.share_card(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_out jsonb;
begin
  if p_code is null or pg_catalog.btrim(p_code) = '' then
    perform ops.raise_api_error('invalid_input', 'Give the card''s short code, from its link or QR.');
  end if;

  v_out := core.share_card_json(pg_catalog.lower(pg_catalog.btrim(p_code)));
  if v_out is null then
    perform ops.raise_api_error('not_found', 'We have no card with this code.');
  end if;
  return v_out;
end
$$;
comment on function api.share_card(text) is 'plinth.share_card/1 (API_CONTRACTS §3.1): the card as sent, the record now, and the "Changed since this card was sent" diff. Public and cacheable: no personal data. Errors: invalid_input, not_found.';

-- ---------------------------------------------------------------------------
-- api.wa_match_share_card(p_image_sha256): wa-webhook's card_changed handler,
-- matching a forwarded image with no readable short code to the card Plinth sent
-- (fix-since-family.md §1; Handoff on PR #76 / T46a's card_changed.ts).
--
-- T43a stored only core.share_cards.phash, a 64-bit hash compared by Hamming
-- distance (core.find_share_cards_by_phash); no task yet computes a true
-- perceptual hash for an inbound WhatsApp image or for a card at issue time, and
-- none is owed by this gap task either. This wrapper matches on the substrate
-- T43a actually built: it takes the first 64 bits of whatever hash it is given
-- and asks for an exact match only (distance 0) -- a forwarded, byte-identical
-- file hashes identically wherever that hash is computed. A later task that adds
-- real perceptual hashing on both the issuing and matching sides can widen the
-- distance for re-compressed near-duplicates without changing this function's
-- name or shape.
-- ---------------------------------------------------------------------------
create function api.wa_match_share_card(p_image_sha256 text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_hex text;
  v_phash bit(64);
  v_short text;
begin
  v_hex := pg_catalog.lower(pg_catalog.btrim(coalesce(p_image_sha256, '')));
  if v_hex !~ '^[0-9a-f]{16,}$' then
    perform ops.raise_api_error('invalid_input', 'Give the forwarded image''s hash.');
  end if;

  v_phash := ('x' || pg_catalog.left(v_hex, 16))::bit(64);

  select c.short_code into v_short
    from core.find_share_cards_by_phash(v_phash, 0) c
   limit 1;

  if v_short is null then
    perform ops.raise_api_error('not_found', 'We can''t match this image to a card.');
  end if;

  return pg_catalog.jsonb_build_object('short_code', v_short);
end
$$;
comment on function api.wa_match_share_card(text) is 'wa-webhook (service_role): matches a forwarded card image to the card whose stored hash it equals (core.find_share_cards_by_phash, exact match). Service-role only -- never anon: an oracle that could enumerate every issued card by brute-forcing hashes if it were public. Errors: invalid_input, not_found.';

-- ---------------------------------------------------------------------------
-- api.resolve_short_link(p_code): what a plinth.in/r/<code> link means, typed or
-- pasted into WhatsApp (router.ts SHORT_LINK_RE) -- risk_card.ts's
-- resolveSlugForCard Handoff ("route.args.short_code ... no resolver RPC exists
-- yet"). No name is given for this in API_CONTRACTS, which documents only
-- api.live_record(p_code) (M4) for the same route: that one also increments a
-- physical placement's daily scan count, a write api.live_record owns alone and
-- this function must never duplicate. This is the read-only half: which record
-- (a project, or an issued card) the code names, nothing more.
-- ---------------------------------------------------------------------------
create function api.resolve_short_link(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_code text := pg_catalog.btrim(coalesce(p_code, ''));
  v_slug text;
  v_card_code text;
begin
  if v_code = '' then
    perform ops.raise_api_error('invalid_input', 'Give the code from the plinth.in/r/ link.');
  end if;

  select p.slug into v_slug from core.phases p where pg_catalog.lower(p.short_code) = pg_catalog.lower(v_code);
  if v_slug is not null then
    return pg_catalog.jsonb_build_object('schema', 'plinth.short_link/1', 'kind', 'phase', 'slug', v_slug, 'card_code', null);
  end if;

  select c.short_code into v_card_code from core.share_cards c where c.short_code = pg_catalog.lower(v_code);
  if v_card_code is not null then
    return pg_catalog.jsonb_build_object('schema', 'plinth.short_link/1', 'kind', 'card', 'slug', null, 'card_code', v_card_code);
  end if;

  perform ops.raise_api_error('not_found', 'We have no record with this short link.');
end
$$;
comment on function api.resolve_short_link(text) is 'plinth.short_link/1: what a plinth.in/r/<code> link names -- a project''s short code (kind phase) or an issued share card''s short code (kind card). Anon-safe: a slug or a card code only, both already public; never increments the Live Record placement count that api.live_record (M4) owns. Errors: invalid_input, not_found.';

-- ---------------------------------------------------------------------------
-- Deny by default (BUILD_PLAN §12.1), targeted at only the functions this
-- migration created (T43a's pattern, 20261113000400): a schema-wide revoke
-- here would also strip grants other tasks' migrations already made.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('core', 'api')
       and p.proname in ('share_card_json', 'share_card', 'wa_match_share_card', 'resolve_short_link')
  loop
    execute pg_catalog.format('revoke execute on function %s from public, anon, authenticated', r.sig);
  end loop;
end
$$;

grant execute on function api.share_card(text) to anon, authenticated, service_role;
-- service_role only: a reverse-image lookup is an oracle an anonymous caller could
-- use to enumerate issued cards by brute-forcing hashes; only the wa-webhook edge
-- function (service_role) ever has a real forwarded image's hash to offer it.
grant execute on function api.wa_match_share_card(text) to service_role;
-- anon-safe: resolves to the same slug or card code a plinth.in/r/<code> link
-- already names in public; a reader who never signed in must be able to follow one.
grant execute on function api.resolve_short_link(text) to anon, authenticated, service_role;
