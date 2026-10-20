-- T53 · DPDP 4/4: the daily retention sweep and the two pg_cron kicks.
-- Sources: BUILD_PLAN §13 retention table (uploads 30 days unless saved; voice notes deleted
-- after transcription, hard maximum 24 h; WhatsApp messages and Ask threads 24 months after last
-- activity, then anonymised; export links 7 days); API_CONTRACTS §3.5, §5.5 (retention-sweep:
-- dispatch secret, pg_cron daily 02:30 IST).
--
-- retention-sweep (edge, dispatch secret) runs:
--   1. api.retention_due        the files past their time: unsaved uploads past retain_until,
--                               voice notes older than 24 h, export ZIPs past link_expires_at;
--   2. the Storage API removes them (direct DELETE on storage.objects is refused by Storage);
--   3. api.retention_mark_deleted marks only the rows that are still due and whose key matches;
--   4. api.retention_anonymise_messages clears the content of WhatsApp messages whose contact
--      has been silent for 24 months (comms.wa_messages.retain_until, T44);
--   5. unfinished erasures (api.dpdp_erasure_pending) are finished.
-- Ask Plinth threads (app.ask_messages) arrive with M5, which adds them to step 4 (PR Handoff).
--
-- pg_cron: retention-sweep daily at 02:30 IST (21:00 UTC) and export-data/build every
-- 15 minutes ("ready within 24 hours"), through ops.dpdp_kick with the Vault dispatch secret,
-- the same sources as T42 and T44. Until the founder stores the secret, the kick does nothing.

-- ---------------------------------------------------------------------------
-- Service: what is due, mark it, anonymise old messages.
-- ---------------------------------------------------------------------------
create function api.retention_due(p_limit integer default 500)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := ops.now();
begin
  if p_limit is null or p_limit < 1 or p_limit > 1000 then
    perform ops.raise_api_error('invalid_input', 'p_limit must be between 1 and 1000.');
  end if;
  return coalesce((
    select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('kind', x.kind, 'id', x.id, 'bucket', x.bucket, 'key', x.key)
      order by x.due_at, x.id
    )
    from (
      select y.kind, y.id, y.bucket, y.key, y.due_at
      from (
        select 'upload'::text as kind, u.id, app.upload_bucket(u.kind) as bucket, u.storage_key as key, u.retain_until as due_at
        from app.uploads u
        where u.deleted_at is null and u.kind <> 'voice_note' and not u.saved and u.retain_until <= v_now
        union all
        select 'voice'::text, u.id, app.upload_bucket(u.kind), u.storage_key, u.created_at + interval '24 hours'
        from app.uploads u
        where u.deleted_at is null and u.kind = 'voice_note' and u.created_at + interval '24 hours' <= v_now
        union all
        select 'export'::text, d.id, 'exports'::text, d.export_key, d.link_expires_at
        from app.data_requests d
        where d.kind = 'export' and d.export_key is not null and d.link_expires_at <= v_now
      ) as y
      order by y.due_at, y.id
      limit p_limit
    ) as x
  ), '[]'::jsonb);
end
$$;
comment on function api.retention_due(integer) is 'Service-only. Files past their retention (BUILD_PLAN §13): unsaved uploads past retain_until (30 days), voice notes older than 24 h, export ZIPs past their 7-day link. [{kind, id, bucket, key}], oldest first.';

create function api.retention_mark_deleted(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := ops.now();
  v_item jsonb;
  v_id uuid;
  v_n integer;
  n_uploads integer := 0;
  n_voice integer := 0;
  n_exports integer := 0;
begin
  if p_items is null or pg_catalog.jsonb_typeof(p_items) <> 'array' or pg_catalog.jsonb_array_length(p_items) > 1000 then
    perform ops.raise_api_error('invalid_input', 'p_items is an array of at most 1000 {kind, id, key}.');
  end if;

  for v_item in select e.value from pg_catalog.jsonb_array_elements(p_items) as e(value) loop
    if pg_catalog.jsonb_typeof(v_item) <> 'object'
       or coalesce(v_item ->> 'kind', '') not in ('upload', 'voice', 'export')
       or coalesce(v_item ->> 'id', '') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or coalesce(v_item ->> 'key', '') = '' then
      perform ops.raise_api_error('invalid_input', 'Each item is {kind: upload | voice | export, id, key}.');
    end if;
    v_id := (v_item ->> 'id')::uuid;

    -- Only rows still due, with the same key: this never marks a file it was not told about.
    if v_item ->> 'kind' = 'upload' then
      update app.uploads u set deleted_at = v_now
       where u.id = v_id and u.storage_key = v_item ->> 'key' and u.deleted_at is null
         and u.kind <> 'voice_note' and not u.saved and u.retain_until <= v_now;
      get diagnostics v_n = row_count;
      n_uploads := n_uploads + v_n;
    elsif v_item ->> 'kind' = 'voice' then
      update app.uploads u set deleted_at = v_now
       where u.id = v_id and u.storage_key = v_item ->> 'key' and u.deleted_at is null
         and u.kind = 'voice_note' and u.created_at + interval '24 hours' <= v_now;
      get diagnostics v_n = row_count;
      n_voice := n_voice + v_n;
    else
      update app.data_requests d set export_key = null
       where d.id = v_id and d.kind = 'export' and d.export_key = v_item ->> 'key' and d.link_expires_at <= v_now;
      get diagnostics v_n = row_count;
      n_exports := n_exports + v_n;
    end if;
  end loop;

  perform ops.audit(
    'retention_delete', 'storage', null, null,
    pg_catalog.jsonb_build_object('uploads', n_uploads, 'voice_notes', n_voice, 'exports', n_exports),
    'Retention sweep: files removed from Storage, rows marked'
  );
  return pg_catalog.jsonb_build_object('uploads', n_uploads, 'voice_notes', n_voice, 'exports', n_exports);
end
$$;
comment on function api.retention_mark_deleted(jsonb) is 'Service-only. After Storage removed the files: sets app.uploads.deleted_at and clears app.data_requests.export_key, only for rows still due whose key matches. Returns counts. Errors: invalid_input.';

create function api.retention_anonymise_messages(p_limit integer default 5000)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := ops.now();
  v_n integer;
begin
  if p_limit is null or p_limit < 1 or p_limit > 50000 then
    perform ops.raise_api_error('invalid_input', 'p_limit must be between 1 and 50000.');
  end if;

  -- 24 months after the conversation's last activity: a message past its retain_until whose
  -- contact has sent or received nothing in the last 24 months loses its content. The row
  -- stays (direction, type, status, dates), so counts and idempotency keep working.
  with due as (
    select m.id
    from comms.wa_messages m
    where m.retain_until <= v_now
      and m.payload <> '{"anonymised": true}'::jsonb
      and not exists (
        select 1 from comms.wa_messages r
        where r.contact_id = m.contact_id and r.created_at > v_now - interval '24 months'
      )
    order by m.created_at, m.id
    limit p_limit
  )
  update comms.wa_messages m
     set payload = '{"anonymised": true}'::jsonb, error = null, context_wa_message_id = null, route_error = null
    from due
   where m.id = due.id;
  get diagnostics v_n = row_count;

  perform ops.audit(
    'retention_anonymise', 'comms.wa_messages', null, null,
    pg_catalog.jsonb_build_object('messages', v_n),
    'Retention sweep: WhatsApp messages 24 months after last activity'
  );
  return pg_catalog.jsonb_build_object('messages', v_n);
end
$$;
comment on function api.retention_anonymise_messages(integer) is 'Service-only. Clears the content of WhatsApp messages past retain_until whose contact has been silent for 24 months (BUILD_PLAN §13). Returns the count.';

revoke all on function api.retention_due(integer) from public, anon, authenticated;
revoke all on function api.retention_mark_deleted(jsonb) from public, anon, authenticated;
revoke all on function api.retention_anonymise_messages(integer) from public, anon, authenticated;

grant execute on function api.retention_due(integer) to service_role;
grant execute on function api.retention_mark_deleted(jsonb) to service_role;
grant execute on function api.retention_anonymise_messages(integer) to service_role;

-- ---------------------------------------------------------------------------
-- pg_cron kicks (the T44 pattern: vault + net reached by dynamic SQL, so PGlite applies this).
-- ---------------------------------------------------------------------------
create function ops.dpdp_kick(p_path text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  if p_path is null or p_path not in ('retention-sweep', 'export-data/build') then
    raise exception using errcode = '22023', message = 'ops.dpdp_kick: unknown path';
  end if;
  if pg_catalog.to_regnamespace('vault') is null or pg_catalog.to_regnamespace('net') is null then
    return;
  end if;
  v_url := coalesce(
    (select s.value from ops.runtime_settings s where s.key = 'functions_base_url'),
    'http://127.0.0.1:54321/functions/v1'
  );
  execute 'select decrypted_secret from vault.decrypted_secrets where name = $1 limit 1'
    into v_secret using 'plinth_dispatch_secret';
  if v_url is null or v_secret is null then
    return;
  end if;
  execute 'select net.http_post(url := $1, body := $2, headers := $3, timeout_milliseconds := 60000)'
    using pg_catalog.rtrim(v_url, '/') || '/' || p_path,
          '{}'::jsonb,
          pg_catalog.jsonb_build_object(
            'content-type', 'application/json',
            'x-plinth-dispatch-secret', v_secret
          );
end
$$;
comment on function ops.dpdp_kick(text) is
  'pg_cron: POST /functions/v1/<retention-sweep | export-data/build> with the Vault dispatch secret. Base URL from ops.runtime_settings(functions_base_url), as T42; a no-op until Vault holds plinth_dispatch_secret.';

revoke all on function ops.dpdp_kick(text) from public, anon, authenticated;

do $$
begin
  if pg_catalog.to_regnamespace('cron') is not null then
    -- 21:00 UTC = 02:30 IST (pg_cron runs in UTC).
    execute $sql$select cron.schedule('dpdp-retention-sweep', '0 21 * * *', $c$select ops.dpdp_kick('retention-sweep')$c$)$sql$;
    execute $sql$select cron.schedule('dpdp-export-build', '*/15 * * * *', $c$select ops.dpdp_kick('export-data/build')$c$)$sql$;
  end if;
end
$$;

-- Lockdown sweep for `ops` (functions only; ops tables are untouched here).
revoke all on all functions in schema ops from public, anon, authenticated;
