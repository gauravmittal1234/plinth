-- T44 · WhatsApp 3/3: the 1-minute sweeper that retries unrouted messages (API_CONTRACTS §5.1).
-- Sources: BUILD_PLAN §5 "Jobs" (pg_cron + pg_net with a Vault-stored dispatch secret).
--
-- pg_cron calls comms.wa_sweep_kick() every minute; it POSTs to
-- /functions/v1/wa-webhook/sweep with x-plinth-dispatch-secret. The function claims rows with
-- api.wa_claim_unrouted and routes them. Both values come from Vault:
--   plinth_functions_url    e.g. https://<ref>.supabase.co/functions/v1 (no trailing slash)
--   plinth_dispatch_secret  the same value as the PLINTH_DISPATCH_SECRET function secret
-- The founder stores them (SETUP_FOR_FOUNDER); until both exist the kick does nothing.
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
  execute 'select decrypted_secret from vault.decrypted_secrets where name = $1 limit 1'
    into v_url using 'plinth_functions_url';
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
  'pg_cron (every minute): POST /functions/v1/wa-webhook/sweep with the Vault dispatch secret. A no-op until Vault holds plinth_functions_url and plinth_dispatch_secret.';

revoke all on function comms.wa_sweep_kick() from public, anon, authenticated;

do $$
begin
  if pg_catalog.to_regnamespace('cron') is not null then
    execute $sql$select cron.schedule('wa-webhook-sweep', '* * * * *', 'select comms.wa_sweep_kick()')$sql$;
  end if;
end
$$;
