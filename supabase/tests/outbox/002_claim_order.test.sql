-- Lead · the claim order (lead decision on T59 PR #89, migration 20261127000400): at the same
-- not_before, api.outbox_claim_due hands out push, then WhatsApp, then email, so "push, then
-- WhatsApp" is certain, not left to insert order. An earlier not_before still goes first.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, raw_user_meta_data) values ('00000000-0000-4000-8000-0000000042d1', '{"first_name":"Lead Claim"}');

-- Due rows, inserted in the worst order: email, WhatsApp, push at 08:00; an email due at 07:59.
insert into comms.outbox (id, dedupe_key, user_id, contact_id, channel, template_code, payload, not_before, created_at) values
  ('00000000-0000-4000-8000-0000000042c1', 'lead-claim-email', '00000000-0000-4000-8000-0000000042d1', null,
   'email', null, '{}'::jsonb, '2026-10-18T08:00:00+05:30', '2026-10-18T07:00:00+05:30'),
  ('00000000-0000-4000-8000-0000000042c2', 'lead-claim-wa', '00000000-0000-4000-8000-0000000042d1', '00000000-0000-4000-8000-0000000042e1',
   'whatsapp_template', 'band_change_alert', '{}'::jsonb, '2026-10-18T08:00:00+05:30', '2026-10-18T07:01:00+05:30'),
  ('00000000-0000-4000-8000-0000000042c3', 'lead-claim-push', '00000000-0000-4000-8000-0000000042d1', null,
   'push', null, '{}'::jsonb, '2026-10-18T08:00:00+05:30', '2026-10-18T07:02:00+05:30'),
  ('00000000-0000-4000-8000-0000000042c4', 'lead-claim-early-email', '00000000-0000-4000-8000-0000000042d1', null,
   'email', null, '{}'::jsonb, '2026-10-18T07:59:00+05:30', '2026-10-18T07:03:00+05:30');

set local role service_role;
select set_config('lead.claim1', api.outbox_claim_due(2)::text, true);
select set_config('lead.claim2', api.outbox_claim_due(200)::text, true);
reset role;

select is(
  array(select x.v ->> 'dedupe_key' from jsonb_array_elements(current_setting('lead.claim1')::jsonb) with ordinality x(v, n) order by x.n),
  array['lead-claim-early-email', 'lead-claim-push'],
  'a limited claim takes the earliest not_before first, then push before the WhatsApp and email due with it'
);
select is(
  array(select x.v ->> 'dedupe_key' from jsonb_array_elements(current_setting('lead.claim2')::jsonb) with ordinality x(v, n)
         where x.v ->> 'dedupe_key' like 'lead-claim-%' order by x.n),
  array['lead-claim-wa', 'lead-claim-email'],
  '...and the next claim: WhatsApp, then email'
);
select is(
  array[ops.outbox_channel_rank('push'), ops.outbox_channel_rank('whatsapp_template'),
        ops.outbox_channel_rank('whatsapp_session'), ops.outbox_channel_rank('email')],
  array[1, 2, 2, 3],
  'the channel rank: push, then WhatsApp (template or session), then email'
);
select is(
  (select x -> 'template' ->> 'code' from jsonb_array_elements(current_setting('lead.claim2')::jsonb) x
    where x ->> 'dedupe_key' = 'lead-claim-wa'),
  'band_change_alert',
  'a claimed template row names its comms.templates code (the dispatcher''s renderer key)'
);

select * from finish();
rollback;
