-- T53 · DPDP 1/4: the private buckets the DPDP functions read and clear, and app.uploads.
-- Sources: BUILD_PLAN §12.7 (private buckets, short-lived signed URLs), §13 (retention table:
-- uploads 30 days unless saved, voice notes at most 24 h, export links 7 days);
-- DATA_MODEL §7 (app.uploads); WORK_BREAKDOWN T53.
--
-- 1. Buckets `exports`, `uploads` and `voice-tmp`: private, no policy for anon or
--    authenticated on storage.objects, so no client reads, lists or writes them. Objects are
--    written and removed only with the secret key at the edge (export-data, retention-sweep,
--    delete-account), and a buyer gets a file only through a signed URL that lives 5 minutes
--    (export-data, after a fresh sign-in code). Uploads arrive the same way: an edge function
--    mints a signed upload URL (M3, doc-check), never a client-side storage policy.
--    Direct DELETE on storage.objects is refused by Supabase Storage, so retention removes files
--    through the Storage API and only then marks the rows.
--    PGlite has no `storage` schema (supabase/tests/shim): the block below is a no-op there.
-- 2. app.uploads (DATA_MODEL §7, R1·M3) is created here, ahead of M3, because the retention
--    sweep (Accept: "deletes an unsaved upload and keeps a saved one") needs its lifecycle
--    columns. M3's doc-check task extends it with ALTER, never a second CREATE (PR Handoff).

-- ---------------------------------------------------------------------------
-- 1. Buckets (private). Limits and MIME types only where this Storage version has the columns.
-- ---------------------------------------------------------------------------
do $$
declare
  v_has_public boolean;
  v_has_limit boolean;
  v_has_mime boolean;
begin
  if pg_catalog.to_regclass('storage.buckets') is null then
    raise notice 'T53: no storage schema here (PGlite); buckets are created on Supabase only';
    return;
  end if;

  select
    pg_catalog.bool_or(a.attname = 'public'),
    pg_catalog.bool_or(a.attname = 'file_size_limit'),
    pg_catalog.bool_or(a.attname = 'allowed_mime_types')
  into v_has_public, v_has_limit, v_has_mime
  from pg_catalog.pg_attribute a
  where a.attrelid = pg_catalog.to_regclass('storage.buckets')
    and a.attnum > 0
    and not a.attisdropped;

  execute $q$
    insert into storage.buckets (id, name)
    values ('exports', 'exports'), ('uploads', 'uploads'), ('voice-tmp', 'voice-tmp')
    on conflict (id) do nothing
  $q$;

  if v_has_public then
    execute $q$update storage.buckets set public = false where id in ('exports', 'uploads', 'voice-tmp')$q$;
  end if;
  if v_has_limit then
    -- exports: one ZIP per request; uploads: 15 MB (BUILD_PLAN §12.9); voice notes: 16 MB
    -- (WhatsApp's own voice-note ceiling).
    execute $q$
      update storage.buckets
         set file_size_limit = case id when 'exports' then 52428800 when 'uploads' then 15728640 else 16777216 end
       where id in ('exports', 'uploads', 'voice-tmp')
    $q$;
  end if;
  if v_has_mime then
    -- No SVG anywhere (BUILD_PLAN §12.9).
    execute $q$
      update storage.buckets
         set allowed_mime_types = case id
           when 'exports' then array['application/zip']
           when 'uploads' then array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
           else array['audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/amr', 'audio/webm']
         end
       where id in ('exports', 'uploads', 'voice-tmp')
    $q$;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. app.uploads (DATA_MODEL §7).
-- ---------------------------------------------------------------------------
create table app.uploads (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete set null,
  wa_contact_id uuid references pii.wa_contacts (id) on delete set null,
  kind text not null check (kind in (
    'flyer', 'brochure', 'hoarding_photo', 'cost_sheet', 'demand_letter', 'payment_request',
    'receipt', 'voice_note', 'room_photo'
  )),
  storage_key text not null check (pg_catalog.length(storage_key) between 1 and 512),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  mime text not null check (pg_catalog.length(mime) between 3 and 100),
  pages smallint check (pages is null or pages between 1 and 20),
  saved boolean not null default false,
  retain_until timestamptz not null default (ops.now() + interval '30 days'),
  deleted_at timestamptz,
  created_at timestamptz not null default ops.now(),
  check (kind <> 'voice_note' or not saved)
);
create index uploads_sha256_idx on app.uploads (sha256);
create index uploads_retain_until_idx on app.uploads (retain_until) where not saved and deleted_at is null;
create index uploads_owner_idx on app.uploads (owner_user_id) where owner_user_id is not null;
create index uploads_voice_idx on app.uploads (created_at) where kind = 'voice_note' and deleted_at is null;
comment on table app.uploads is 'Files a buyer sent for a check (DATA_MODEL §7). Bucket uploads, or voice-tmp for voice notes (app.upload_bucket). Kept 30 days unless saved; a voice note at most 24 hours and never saved (BUILD_PLAN §13). retention-sweep removes the file, then sets deleted_at. Own read.';
comment on column app.uploads.owner_user_id is 'pii:C1 · Null for a WhatsApp-only sender, and after an erasure.';
comment on column app.uploads.wa_contact_id is 'pii:C1 · The WhatsApp sender, when it came in on WhatsApp.';
comment on column app.uploads.kind is 'pii:C1';
comment on column app.uploads.storage_key is 'pii:C1 · Object key in the bucket app.upload_bucket(kind) names.';
comment on column app.uploads.sha256 is 'pii:C1 · Same file hash → re-run of the earlier check.';
comment on column app.uploads.mime is 'pii:C1';
comment on column app.uploads.pages is 'pii:C1';
comment on column app.uploads.saved is 'pii:C1 · The buyer saved it to their account: kept past 30 days, until they delete it.';
comment on column app.uploads.retain_until is 'pii:C1 · created + 30 days. Ignored once saved.';
comment on column app.uploads.deleted_at is 'pii:C1 · When the file left Storage (retention-sweep or an erasure).';
comment on column app.uploads.created_at is 'pii:C1';

create trigger uploads_audit
  after insert or update or delete on app.uploads
  for each row execute function ops.audit_trigger();

create function app.upload_bucket(p_kind text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case when p_kind = 'voice_note' then 'voice-tmp' else 'uploads' end
$$;
comment on function app.upload_bucket(text) is 'The private bucket an upload''s file lives in: voice-tmp for voice notes, uploads otherwise.';

alter table app.uploads enable row level security;
create policy own_read on app.uploads for select to authenticated
  using (owner_user_id = (select auth.uid()));

-- Lockdown sweep for `app` (see 20261110000100). Only `app`: sweeping `api` here would drop
-- other tasks' function grants.
revoke all on all tables in schema app from public, anon, authenticated;
revoke all on all sequences in schema app from public, anon, authenticated;
revoke all on all functions in schema app from public, anon, authenticated;
