-- Lead · M2 integration fix: re-assert the grants on the three functions created by
-- 20261103000200_lead_share_card_api.sql (api.share_card, api.wa_match_share_card,
-- api.resolve_short_link).
--
-- Why a second migration: 20261112000100_t42_m2_comms_outbox.sql -- already merged to
-- main, so never editable (AGENTS.md §1 "never edit a merged migration") -- runs after
-- 20261103's date prefix and repeats the full-schema sweep ("revoke all on all
-- functions in schema core, ws, app, comms, pii, ops, api from public, anon,
-- authenticated"), the same pattern T12/T13 used (its own comment: "every earlier
-- task's api grants are re-asserted here too, not just T42's"). It re-grants every
-- function that existed when it was written, but it could not know about these three,
-- which did not exist yet, so the sweep silently revokes them and nothing after T42
-- restores them -- confirmed by supabase/tests/cards/001_share_card_api.test.sql
-- failing with "permission denied for function share_card" before this file existed.
--
-- T43a, T44 and T54 (all dated after T42) hit the same hazard and each avoided it by
-- reverting to a targeted, per-function revoke-then-grant instead of the blanket
-- sweep (T54's own comment: "a schema-wide revoke... here would revoke theirs once
-- they merge ahead of this file"). The lead's 20261103 prefix sits before T42's
-- 20261112, so that option was not available to it; this file is the targeted fix,
-- placed after every sweep in the merged history (none of T43a/T44/T54 sweeps the
-- `api` schema, so nothing after this revokes it again). No function body changes;
-- 20261103000200 keeps owning the functions themselves and their grants' reasoning.
revoke execute on function api.share_card(text) from public, anon, authenticated;
revoke execute on function api.wa_match_share_card(text) from public, anon, authenticated;
revoke execute on function api.resolve_short_link(text) from public, anon, authenticated;

grant execute on function api.share_card(text) to anon, authenticated, service_role;
grant execute on function api.wa_match_share_card(text) to service_role;
grant execute on function api.resolve_short_link(text) to anon, authenticated, service_role;
