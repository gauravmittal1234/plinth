-- T42 · Outbox and notify router 2/2: the pg_cron poll and the pg_net insert trigger
-- (API_CONTRACTS §5.5 "pg_cron (every 10 s) and an insert trigger via pg_net | outbox-dispatch |
-- x-plinth-dispatch-secret from Vault"). Not `pglite: skip`: supabase/tests/shim/supabase_shim.psql
-- stubs cron.schedule/net.http_post/vault.* well enough for this file to apply on PGlite too; the
-- stubs just don't fire anything, so ci-db (real Postgres 17, Docker) stays the authoritative run.
--
-- Setup the founder still has to do once (SETUP_FOR_FOUNDER.md), not committed here (AGENTS §6):
--   select vault.create_secret('<the PLINTH_DISPATCH_SECRET value>', 'plinth_dispatch_secret');
--   update ops.runtime_settings set value = 'https://<project-ref>.supabase.co/functions/v1'
--     where key = 'functions_base_url';  -- (or insert it; local/dev default below works as is)
-- Until the secret exists, ops.outbox_dispatch_secret() is null and both the trigger and the
-- poll job skip the HTTP call — rows still queue; nothing dispatches until the secret is set.

insert into ops.runtime_settings (key, value) values
  ('functions_base_url', 'http://127.0.0.1:54321/functions/v1')
on conflict (key) do nothing;

create function ops.outbox_dispatch_url()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (select s.value from ops.runtime_settings s where s.key = 'functions_base_url'),
    'http://127.0.0.1:54321/functions/v1'
  ) || '/outbox-dispatch'
$$;
comment on function ops.outbox_dispatch_url() is 'outbox-dispatch''s URL: ops.runtime_settings(functions_base_url) + /outbox-dispatch.';

create function ops.outbox_dispatch_secret()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select v.decrypted_secret from vault.decrypted_secrets v where v.name = 'plinth_dispatch_secret' limit 1
$$;
comment on function ops.outbox_dispatch_secret() is 'The PLINTH_DISPATCH_SECRET value from Vault (name plinth_dispatch_secret), or null until the founder sets it.';

create function ops.outbox_notify_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text := ops.outbox_dispatch_secret();
begin
  if v_secret is not null then
    perform net.http_post(
      url := ops.outbox_dispatch_url(),
      body := jsonb_build_object('reason', 'insert', 'id', new.id),
      headers := jsonb_build_object('content-type', 'application/json', 'x-plinth-dispatch-secret', v_secret),
      timeout_milliseconds := 2000
    );
  end if;
  return new;
end;
$$;
comment on function ops.outbox_notify_insert() is 'AFTER INSERT on comms.outbox: wakes outbox-dispatch immediately via pg_net, instead of waiting for the 10 s poll.';

create trigger outbox_notify_insert
  after insert on comms.outbox
  for each row execute function ops.outbox_notify_insert();

-- The 10 s safety-net poll: covers deferred rows (quiet hours, retry backoff) and anything the
-- insert trigger's fire-and-forget call missed.
select cron.schedule(
  'outbox-dispatch-poll',
  '10 seconds',
  $cron$
    select net.http_post(
      url := ops.outbox_dispatch_url(),
      body := '{"reason": "poll"}'::jsonb,
      headers := jsonb_build_object('content-type', 'application/json', 'x-plinth-dispatch-secret', ops.outbox_dispatch_secret()),
      timeout_milliseconds := 5000
    )
    where ops.outbox_dispatch_secret() is not null
  $cron$
);

-- ---------------------------------------------------------------------------
-- Lockdown sweep (BUILD_PLAN §12.1; this file only adds ops functions, which the sweep already
-- revokes EXECUTE on from public/anon/authenticated by default — no explicit grant needed here:
-- these three run only as the migration owner (trigger, security definer) or pg_cron (superuser)).
-- ---------------------------------------------------------------------------
revoke all on all functions in schema ops from public, anon, authenticated;
