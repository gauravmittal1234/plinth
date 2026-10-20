-- T43a · Event engine 2/5: extensions, orders and "from the developer" facts
-- (DATA_MODEL §2; WORK_BREAKDOWN T43a: "… extensions, orders, price lists,
-- developer replies …"). Same pattern as 20261113000100: one AFTER trigger per
-- source table, each calling core._emit_event with dates taken from the row.

-- ---------------------------------------------------------------------------
-- core.extensions → extension_granted. before/after carry the completion date
-- either side of the extension (Coral: Feb 2029 → Aug 2029), read from the
-- previous extension on the same registration, or the registration's own
-- original_completion when this is the first one.
-- ---------------------------------------------------------------------------
create function core.events_from_extension()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phase_id uuid;
  v_prior_to date;
begin
  select r.phase_id into v_phase_id from core.rera_registrations r where r.id = new.registration_id;
  if v_phase_id is null or new.granted_on is null then
    return new;
  end if;

  select e.to_completion into v_prior_to
    from core.extensions e
   where e.registration_id = new.registration_id
     and e.id <> new.id
     and (e.granted_on < new.granted_on or (e.granted_on is null and new.granted_on is not null))
   order by e.granted_on desc
   limit 1;
  if v_prior_to is null then
    select r.original_completion into v_prior_to from core.rera_registrations r where r.id = new.registration_id;
  end if;

  perform core._emit_event(
    p_phase_id := v_phase_id,
    p_kind := 'extension_granted',
    p_occurred_on := new.granted_on,
    p_detected_at := ops.ist_noon(new.granted_on),
    p_before := case when v_prior_to is not null then pg_catalog.jsonb_build_object('to_completion', v_prior_to) else null end,
    p_after := pg_catalog.jsonb_build_object('to_completion', new.to_completion, 'from_completion', new.from_completion, 'kind', new.kind, 'order_ref', new.order_ref),
    p_fact_ids := array[new.id]
  );
  return new;
end
$$;
comment on function core.events_from_extension() is 'core.extensions AFTER INSERT: logs extension_granted (DATA_MODEL §2; Coral''s Extension 2, 14 Oct 2026).';

create trigger extensions_events
  after insert on core.extensions
  for each row execute function core.events_from_extension();

-- ---------------------------------------------------------------------------
-- core.orders → order_decided. Only when the order is tied to one phase
-- (core.orders.phase_id is nullable: a group- or developer-level order has none).
-- ---------------------------------------------------------------------------
create function core.events_from_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.phase_id is null or new.decided_on is null then
    return new;
  end if;
  perform core._emit_event(
    p_phase_id := new.phase_id,
    p_kind := 'order_decided',
    p_occurred_on := new.decided_on,
    p_detected_at := ops.ist_noon(new.decided_on),
    p_before := null,
    p_after := pg_catalog.jsonb_build_object('order_type', new.order_type, 'outcome', new.outcome, 'case_no', new.case_no),
    p_fact_ids := array[new.id]
  );
  return new;
end
$$;
comment on function core.events_from_order() is 'core.orders AFTER INSERT: logs order_decided for an order filed against one phase.';

create trigger orders_events
  after insert on core.orders
  for each row execute function core.events_from_order();

-- ---------------------------------------------------------------------------
-- ws.price_lists → price_list_published, on the transition into status =
-- published (a direct insert, or a future draft → published update). after
-- carries the price_list's own id and version so a reader can join
-- ws.price_list_items for the amounts; T43a does not restate a price here,
-- since a phase's first seeded price list has no earlier row to diff against
-- ("never invented" — DESIGN §0).
-- ---------------------------------------------------------------------------
create function core.events_from_price_list()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'published' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'published' then
    return new;
  end if;
  perform core._emit_event(
    p_phase_id := new.phase_id,
    p_kind := 'price_list_published',
    p_occurred_on := new.published_on,
    p_detected_at := ops.ist_noon(new.published_on),
    p_before := null,
    p_after := pg_catalog.jsonb_build_object('price_list_id', new.id, 'published_on', new.published_on, 'version', new.version),
    p_fact_ids := array[new.id]
  );
  return new;
end
$$;
comment on function core.events_from_price_list() is 'ws.price_lists AFTER INSERT OR UPDATE: logs price_list_published once a list becomes published (Sapphire Grove Ph 1, 16 Oct 2026).';

create trigger price_lists_events
  after insert or update on ws.price_lists
  for each row execute function core.events_from_price_list();

-- ---------------------------------------------------------------------------
-- ws.developer_replies → developer_replied, only when the reply answers a
-- specific published run (run_id set). A general claim or an un-linked reply
-- already reaches a buyer inline (RiskSummary.developer_response, the
-- "Developer says" tone field) without needing a feed event; this keeps
-- "Since you last looked" to record changes, not developer commentary
-- (fix-since-family.md §1: the hero names exactly 5 changes).
-- ---------------------------------------------------------------------------
create function core.events_from_developer_reply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'published' or new.run_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'published' then
    return new;
  end if;
  perform core._emit_event(
    p_phase_id := new.phase_id,
    p_kind := 'developer_replied',
    p_occurred_on := (new.published_at at time zone 'Asia/Kolkata')::date,
    p_detected_at := new.published_at,
    p_before := null,
    p_after := pg_catalog.jsonb_build_object('reply_id', new.id, 'scope', new.scope),
    p_fact_ids := array[new.id],
    p_run_id := new.run_id
  );
  return new;
end
$$;
comment on function core.events_from_developer_reply() is 'ws.developer_replies AFTER INSERT OR UPDATE: logs developer_replied only when the published reply answers a specific run (run_id set).';

create trigger developer_replies_events
  after insert or update on ws.developer_replies
  for each row execute function core.events_from_developer_reply();
