-- T43a · Event engine 5/5: schedule the daily QPR-missing sweep.
-- pglite: skip pg_cron is not available in PGlite; CI's ci-db runs this against real Postgres 17, where T04 installs the extension.
--
-- 03:15 IST: well after HARERA's own overnight batch and before Gurugram's
-- working day, so a filing due "yesterday" is swept to missing before anyone
-- reads it. ops.sweep_qpr_missing() does the work; core.qpr_filings' own
-- trigger (20261113000100) then logs the qpr_missing event.
select cron.schedule('qpr-missing-sweep', '45 21 * * *', $$select ops.sweep_qpr_missing()$$);
