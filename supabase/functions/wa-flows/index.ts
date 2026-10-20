// wa-flows: POST /functions/v1/wa-flows (API_CONTRACTS §5.3) · auth: Meta's signature (T44 skeleton).
//
// In:  { encrypted_flow_data, encrypted_aes_key, initial_vector } (base64), X-Hub-Signature-256
// Out: 200 text/plain base64 AES-GCM of { screen?, data } under the flipped IV
//      421 (empty) when the request cannot be decrypted: Meta re-fetches our public key
//      403 forbidden bad signature · 503 flag_off (wa_inbound) · 422 invalid_input bad envelope
// Env: WA_APP_SECRET, WA_FLOWS_PRIVATE_KEY (unencrypted PEM, PKCS#8 or PKCS#1).
// Deploy without JWT verification (config.toml [functions.wa-flows] verify_jwt = false).
// Logic and tests: logic.ts, crypto.ts, logic.test.ts. Flows land in M4 (dev_receipt) and M5
// (visit_booking, agent_onboarding).

import { makeWaFlows } from "./logic.ts";

Deno.serve(makeWaFlows());
