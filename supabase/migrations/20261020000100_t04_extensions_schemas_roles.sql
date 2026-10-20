-- T04 · DB core 1/7: extensions, schemas, the pipeline_writer role, deny by default.
-- Sources: DATA_MODEL §0; BUILD_PLAN §5.4, §12 (1 deny by default, 5 least privilege).
-- Only the `api` schema is exposed to PostgREST (supabase/config.toml `api.schemas`).
-- Clients call `api.*` functions; every other schema is private.

-- ---------------------------------------------------------------------------
-- Extensions (Supabase convention: relocatable ones live in `extensions`).
-- pg_cron, pg_net and pgmq install into their own schemas (cron, net, pgmq).
-- ---------------------------------------------------------------------------
create schema if not exists extensions;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists vector with schema extensions;
create extension if not exists postgis with schema extensions;
create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists pgmq;

-- ---------------------------------------------------------------------------
-- Schemas.
-- ---------------------------------------------------------------------------
create schema if not exists core;
create schema if not exists ws;
create schema if not exists app;
create schema if not exists comms;
create schema if not exists pii;
create schema if not exists ops;
create schema if not exists api;

comment on schema core is 'Public records, evidence, scoring and score governance. Writers: pipeline_writer (evidence, drafts) and admin/methodology RPCs. api-only.';
comment on schema ws is 'Developer workspace. pipeline_writer has no grant here, so developer content cannot feed a band (DATA_MODEL §0, §12 inv. 6).';
comment on schema app is 'Buyer-owned data (follows, alerts, consents, checks, visits, family). Reached only through api.* RPCs.';
comment on schema comms is 'Outbox, WhatsApp messages and sessions, templates. Edge functions only.';
comment on schema pii is 'Phone numbers and other direct identifiers. Edge functions only, through audited functions.';
comment on schema ops is 'Audit, flags, refs, jobs, review queue, AI log, grievances. Functions and admin.';
comment on schema api is 'The contract: SECURITY DEFINER functions with search_path = ''''. The only schema PostgREST exposes.';

-- ---------------------------------------------------------------------------
-- Deny by default (BUILD_PLAN §12.1). anon and authenticated get nothing on the
-- private schemas: no USAGE, so no table, sequence or function is reachable.
-- `api` gets USAGE only; each api function grants EXECUTE explicitly.
-- ---------------------------------------------------------------------------
revoke all on schema core, ws, app, comms, pii, ops, api from public;
revoke all on schema core, ws, app, comms, pii, ops, api from anon, authenticated;
revoke create on schema public from public, anon, authenticated;

grant usage on schema api to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- pipeline_writer: the Python pipelines' login role (never the service key).
-- No password here: the founder sets it in the SQL editor (SETUP_FOR_FOUNDER,
-- PIPELINE_DB_URL). It can read and write `core` evidence and score drafts and
-- has no privilege at all on ws, app, comms or pii (DATA_MODEL §12 inv. 6).
-- Table grants are made next to each table in the later T04 migrations.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'pipeline_writer') then
    create role pipeline_writer login noinherit nocreatedb nocreaterole nobypassrls;
  end if;
end
$$;

-- Lets migrations and pgTAP (which run as postgres) `set role pipeline_writer`.
do $$
begin
  grant pipeline_writer to postgres;
exception
  when insufficient_privilege then
    raise notice 'T04: could not grant pipeline_writer to postgres (%); pgTAP role tests need it', sqlerrm;
end
$$;

grant usage on schema core, ops, extensions to pipeline_writer;
revoke all on schema ws, app, comms, pii from pipeline_writer;
