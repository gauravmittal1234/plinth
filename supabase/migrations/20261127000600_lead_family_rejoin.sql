-- Lead · the repeat JOIN (T59 PR #89, "Minor"): a second "JOIN AH2-7KQ" from the relative who
-- already joined with it got "This invite link isn't valid any more", because app.live_invite (a
-- used code is no longer live) ran before the already-a-member check.
--
-- Now, when the code is not live, ops.family_join_by_code looks at the code's own row: if it is
-- a joined membership of this very sender (their WhatsApp contact, or their account), the answer
-- is that membership, worded honestly ("You're already in Rohan's circle for Aurelia Heights,
-- Phase 2."), built from the record like every join reply (AGENTS rule 9). Anyone else, and any
-- unknown, used-by-someone-else, cancelled or expired code, still gets the one neutral answer
-- (app.neutral_code_error), so a stranger learns nothing about the code. The same honest line
-- answers a sender already in the circle who sends another live code of it (that code stays
-- unused, as before). plinth.family_join/1 is unchanged: same keys, only joined_line's words.
-- Re-creates ops.family_join_by_code only (T45a, 20261120000300) plus one helper.

create function app.family_already_joined_json(p_member app.family_members)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select app.family_join_json(p_member) || pg_catalog.jsonb_build_object(
    'joined_line', 'You''re already in ' || v.name || '''s circle for ' || app.invite_scope_line(p_member) || '.'
  )
  from (
    select coalesce(app.first_name_of(app.circle_owner(p_member.circle_id)), 'Your relative') as name
  ) v
$$;
comment on function app.family_already_joined_json(app.family_members) is 'plinth.family_join/1 for a relative who is already a member: the membership on record, its joined_line saying so.';

create or replace function ops.family_join_by_code(p_code text, p_wa_contact_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_contact pii.wa_contacts;
  v_member app.family_members;
  v_existing app.family_members;
  v_code text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_code, '')));
begin
  select k.* into v_contact from pii.wa_contacts k where k.id = p_wa_contact_id for update;
  if not found then
    perform ops.raise_api_error('not_found', 'We have no WhatsApp contact with this id.');
  end if;
  v_member := app.live_invite(p_code);
  if v_member.id is null then
    -- Not a live invite. Only the sender's own joined membership under this code is answered;
    -- everything else is the neutral answer.
    select m.* into v_existing from app.family_members m
    where m.invite_code = v_code and m.status = 'joined'
      and (m.wa_contact_id = v_contact.id or (v_contact.user_id is not null and m.member_user_id = v_contact.user_id));
    if found then
      return app.family_already_joined_json(v_existing);
    end if;
    perform app.neutral_code_error();
  end if;
  if v_contact.user_id is not null and app.circle_owner(v_member.circle_id) = v_contact.user_id then
    perform ops.raise_api_error('invalid_input', 'This is your own circle. Send the link to the person you want to invite.');
  end if;
  select m.* into v_existing from app.family_members m
  where m.circle_id = v_member.circle_id and m.status = 'joined'
    and (m.wa_contact_id = v_contact.id or (v_contact.user_id is not null and m.member_user_id = v_contact.user_id));
  if found then
    return app.family_already_joined_json(v_existing);
  end if;

  update app.family_members m
     set wa_contact_id = v_contact.id,
         member_user_id = v_contact.user_id,
         status = 'joined',
         joined_at = ops.now(),
         joined_via = 'whatsapp'
   where m.id = v_member.id
  returning * into v_member;

  -- "JOIN <code>" is the relative's own opt-in to the utility alerts the circle sends.
  if not v_contact.utility_opt_in or v_contact.stopped_at is not null then
    update pii.wa_contacts k set utility_opt_in = true, stopped_at = null where k.id = v_contact.id;
    perform ops.audit('opt_in', 'pii.wa_contacts', v_contact.id::text,
      pg_catalog.jsonb_build_object('utility_opt_in', v_contact.utility_opt_in, 'stopped_at', v_contact.stopped_at),
      pg_catalog.jsonb_build_object('utility_opt_in', true, 'stopped_at', null),
      'JOIN ' || v_member.invite_code);
  end if;
  return app.family_join_json(v_member);
end
$$;
comment on function ops.family_join_by_code(text, uuid) is 'The relative''s own WhatsApp "JOIN <code>" (API_CONTRACTS §4.11): joins them to the circle by their WhatsApp contact (and account, if linked) and records the message as their opt-in to utility alerts. A sender who already joined (with this code, or is in the circle already) gets their membership back, worded "You''re already in <name>''s circle". plinth.family_join/1. Errors: not_found (neutral for unknown, used, cancelled or expired codes), invalid_input (own circle).';

revoke all on function app.family_already_joined_json(app.family_members) from public, anon, authenticated;
revoke all on function ops.family_join_by_code(text, uuid) from public, anon, authenticated;
