-- T44 · WhatsApp 3/3: the 1-minute sweeper that retries unrouted messages (API_CONTRACTS §5.1).
-- Sources: BUILD_PLAN §5 "Jobs" (pg_cron + pg_net with a Vault-stored dispatch secret).
--
-- pg_cron calls comms.wa_sweep_kick() every minute; it POSTs to
-- /functions/v1/wa-webhook/sweep with x-plinth-dispatch-secret. The function claims rows with
-- api.wa_claim_unrouted and routes them. Same sources as T42's outbox kick:
--   the base URL   ops.runtime_settings('functions_base_url') (not a secret; T42 seeds the
--                  local default, the founder sets the hosted one), else the local default
--   the secret     Vault plinth_dispatch_secret, the same value as PLINTH_DISPATCH_SECRET
-- Until the Vault secret exists the kick does nothing.
-- PGlite has no pg_cron, pg_net or Vault: the schedule is skipped there, and the kick returns
-- early because the vault and net schemas are absent.

create function comms.wa_sweep_kick()
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
  execute 'select net.http_post(url := $1, body := $2, headers := $3, timeout_milliseconds := 5000)'
    using pg_catalog.rtrim(v_url, '/') || '/wa-webhook/sweep',
          '{}'::jsonb,
          pg_catalog.jsonb_build_object(
            'content-type', 'application/json',
            'x-plinth-dispatch-secret', v_secret
          );
end
$$;
comment on function comms.wa_sweep_kick() is
  'pg_cron (every minute): POST /functions/v1/wa-webhook/sweep with the Vault dispatch secret. Base URL from ops.runtime_settings(functions_base_url), as T42; a no-op until Vault holds plinth_dispatch_secret.';

revoke all on function comms.wa_sweep_kick() from public, anon, authenticated;

do $$
begin
  if pg_catalog.to_regnamespace('cron') is not null then
    execute $sql$select cron.schedule('wa-webhook-sweep', '* * * * *', 'select comms.wa_sweep_kick()')$sql$;
  end if;
end
$$;
