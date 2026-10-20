-- T40 · DB people 2/3 (m2_people): the family circle.
-- app.family_circles, app.family_members, app.shortlist_notes.
-- Sources: DATA_MODEL §5, §12 inv. 5. A member row carries no phone: the relative's
-- own "JOIN <code>" message is the opt-in, and members are not cap parties.
-- Wall 2 (tested with a temporary grant): the owner manages the circle; a member
-- reads their own row and, once joined, the shared shortlist notes. Nothing here
-- opens the owner's follows, consents, shares, relays or bookings to a member.

create table app.family_circles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
comment on table app.family_circles is 'One family circle per owner (DATA_MODEL §5). Owner only.';
comment on column app.family_circles.owner_user_id is 'pii:C1';

create table app.family_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references app.family_circles (id) on delete cascade,
  member_user_id uuid references auth.users (id) on delete set null,
  wa_contact_id uuid,
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{3}-[A-Z0-9]{3}$'),
  scope_phase_ids uuid[] not null default '{}'::uuid[],
  scope_all boolean not null default false,
  status text not null default 'invited' check (status in ('invited', 'joined', 'left', 'removed', 'expired')),
  invited_at timestamptz not null default ops.now(),
  expires_at timestamptz not null default (ops.now() + interval '7 days'),
  joined_at timestamptz,
  joined_via text check (joined_via in ('whatsapp', 'app')),
  can_add_notes boolean not null default false,
  created_at timestamptz not null default now(),
  check (scope_all or pg_catalog.cardinality(scope_phase_ids) > 0),
  check (status <> 'joined' or ((member_user_id is not null or wa_contact_id is not null) and joined_at is not null and joined_via is not null))
);
create index family_members_circle_idx on app.family_members (circle_id);
create unique index family_members_one_live_per_user on app.family_members (circle_id, member_user_id)
  where member_user_id is not null and status in ('invited', 'joined');
comment on table app.family_members is 'Invites and members of a circle (DATA_MODEL §5). Carries no phone. Owner manages; a member reads their own row.';
comment on column app.family_members.member_user_id is 'pii:C1 · Set once the relative has an account.';
comment on column app.family_members.wa_contact_id is 'pii:C1 · The relative''s WhatsApp contact (pii.wa_contacts, T44) once they send JOIN <code>. No FK until that table lands.';
comment on column app.family_members.invite_code is 'pii:C1 · e.g. AH2-7KQ, valid 7 days.';
comment on column app.family_members.scope_phase_ids is 'pii:C1 · The shared phases when scope_all is false.';
comment on column app.family_members.status is 'pii:C1';

create table app.shortlist_notes (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references app.family_circles (id) on delete cascade,
  phase_id uuid not null references core.phases (id),
  author_user_id uuid references auth.users (id) on delete set null,
  body text not null check (pg_catalog.length(pg_catalog.btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index shortlist_notes_circle_idx on app.shortlist_notes (circle_id);
comment on table app.shortlist_notes is 'The shared shortlist''s dated notes (DATA_MODEL §5). Circle owner and joined members.';
comment on column app.shortlist_notes.author_user_id is 'pii:C1';
comment on column app.shortlist_notes.body is 'pii:C1 · User-written note.';

-- ---------------------------------------------------------------------------
-- RLS (wall 2). Subqueries run under the queried table's own policies:
-- circles → owner only; members → owner or self. No policy cycle.
-- ---------------------------------------------------------------------------
alter table app.family_circles enable row level security;
alter table app.family_members enable row level security;
alter table app.shortlist_notes enable row level security;

create policy owner_all on app.family_circles for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy owner_all on app.family_members for all to authenticated
  using (exists (select 1 from app.family_circles c where c.id = family_members.circle_id and c.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from app.family_circles c where c.id = family_members.circle_id and c.owner_user_id = (select auth.uid())));
create policy member_read_self on app.family_members for select to authenticated
  using (member_user_id = (select auth.uid()));

create policy circle_read on app.shortlist_notes for select to authenticated
  using (
    exists (select 1 from app.family_circles c where c.id = shortlist_notes.circle_id and c.owner_user_id = (select auth.uid()))
    or exists (
      select 1 from app.family_members m
      where m.circle_id = shortlist_notes.circle_id and m.member_user_id = (select auth.uid()) and m.status = 'joined'
    )
  );
create policy circle_write on app.shortlist_notes for insert to authenticated
  with check (
    author_user_id = (select auth.uid())
    and (
      exists (select 1 from app.family_circles c where c.id = shortlist_notes.circle_id and c.owner_user_id = (select auth.uid()))
      or exists (
        select 1 from app.family_members m
        where m.circle_id = shortlist_notes.circle_id and m.member_user_id = (select auth.uid())
          and m.status = 'joined' and m.can_add_notes
      )
    )
  );
create policy author_delete on app.shortlist_notes for delete to authenticated
  using (author_user_id = (select auth.uid()));

create trigger family_members_audit
  after insert or update or delete on app.family_members
  for each row execute function ops.audit_trigger();

-- Lockdown sweep for `app` (see 20261110000100).
revoke all on all tables in schema app from public, anon, authenticated;
revoke all on all sequences in schema app from public, anon, authenticated;
revoke all on all functions in schema app from public, anon, authenticated;
