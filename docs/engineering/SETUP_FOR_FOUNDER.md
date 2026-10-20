# Setup for the founder: accounts, keys and approvals

Status: 19 Oct 2026 · For: Gaurav · Engineering owner: Head of Engineering

The agent team builds M0–M1 entirely on fixtures, so **nothing here blocks coding today.** Some items have long lead times (Meta business verification, TRAI DLT, the Play organisation account, the GCP project for live HARERA fetch). Start those this week. The legal memo and HARERA letter are post-launch (FOUNDER_QUESTIONS P8).

## The rules for keys (please read once)

- **Never paste a key, token, password or OTP into a chat with any agent.** Agents only ever see variable *names*.
- Put each value where its table row says, and only there:

| Where | Used for | How it's protected |
|---|---|---|
| `/Users/macbook/code/Real Estate/.env.local` | Local development | Already gitignored. It already holds `GEMINI_API_KEY`; leave it there |
| `apps/mobile/.env.json` | App values, passed via `--dart-define-from-file` | Gitignored by T00 |
| `supabase/functions/.env` | Local edge-function values | Gitignored by T00 |
| Supabase dashboard → Edge Functions → Secrets | Server-side function secrets | Or `supabase secrets set NAME=…` in your own terminal |
| Vercel → Project → Settings → Environment Variables | Web and admin | Set per environment: Preview, Production |
| GitHub → repo → Settings → Secrets and variables → Actions | CI and deploys | Or `gh secret set NAME` in your own terminal |

- `.env.example` (created by T00) lists every name with a one-line description and **no values**.
- Only these are public by design and may ship in a client:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and the app's `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`;
  - `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_TILES_URL`.

  Everything else is server-only. CI fails if a secret-key pattern appears in `apps/`.
- If a value is ever exposed, rotate it first and tell the lead second.

---

## Step 0 · Today, 10 minutes, free

| # | Action | Unblocks | Env names |
|---|---|---|---|
| 0.1 | Approve T00 copying the design canvas from the session scratchpad into `product/design/artboards/`. The scratchpad lives under `/private/tmp` and can vanish | Every UI task | — |
| 0.2 | Confirm that `github.com/gauravmittal1234/plinth` stays private and that Actions are enabled. T00 sets branch protection with `gh` (already authenticated) | CI | — |
| 0.3 | Decide the brand domain. The design assumes **`plinth.in`** (`plinth.in/r/AH2`, `plinth.in/j/AH2-7KQ`). Buy it when the name is final (~₹1,000/yr) | Android App Links, the WhatsApp display name, email sending, Live Record links | `NEXT_PUBLIC_SITE_URL` |
| 0.4 | Optional: install Node 22 LTS (`brew install node@22`). CI uses 22; your Node 20 still works for dev | Parity with CI | — |

---

## Step 1 · Start this week (long lead times, mostly free)

### 1.1 Meta: WhatsApp Business Platform (unblocks live WhatsApp in M2; mock mode until then)

1. **Business Manager:** create a Meta Business account for the company. Start **business verification** (certificate of incorporation, GST, an address proof, a website on your domain). This takes about 1–3 weeks.
2. **Developer app:** at developers.facebook.com, create an app of type *Business* and add the **WhatsApp** product.
   - You immediately get a free **test phone number** and can message up to 5 verified recipients. This is enough for the `dev` environment.
3. **Production number:** a fresh number that is *not* on the WhatsApp or WhatsApp Business app. Register it, then submit the display name ("Plinth") for approval.
4. **Permanent token:** in Business Settings → System users, create a system user with `whatsapp_business_messaging` and `whatsapp_business_management`, and generate a token.
5. **Webhook:** callback `https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/wa-webhook`. The verify token is a random string you choose. Subscribe to `messages`.
6. **Flows:** generate a 2048-bit RSA key pair in your own terminal and upload the **public** key in WhatsApp Manager. The private key and passphrase go into Supabase secrets.
7. **Templates:** once the display name is approved, submit the utility and authentication templates. The lead will hand you the exact bodies from `packages/contracts/catalogues/wa_templates.json`: `login_code`, `band_change_alert`, `filing_alert`, `weekly_digest`, `daily_digest`, `family_removed`, `export_ready`, then the M4–M5 ones.

| Where | Env names |
|---|---|
| Supabase secrets (dev, later prod) | `WA_PHONE_NUMBER_ID`, `WA_BUSINESS_ACCOUNT_ID`, `WA_APP_ID`, `WA_APP_SECRET`, `WA_ACCESS_TOKEN`, `WA_VERIFY_TOKEN`, `WA_FLOWS_PRIVATE_KEY`, `WA_FLOWS_PRIVATE_KEY_PASSPHRASE`, `META_MODE` (`mock` until you say go) |
| Web (for `/j/` links) | `NEXT_PUBLIC_WA_BUSINESS_NUMBER` (the public E.164 number) |

**Cost:** verification is free. Meta bills per delivered template, about ₹0.115 for utility or authentication; session replies inside 24 h are free.

### 1.2 Google Play Console (unblocks internal testing in M2 and production in M6)

1. Create an **organisation** developer account ($25 one-time). It needs a **D-U-N-S number** for the company, which is free from Dun & Bradstreet but can take up to about 30 days, so request it now.
   - Why organisation rather than personal: new personal accounts must run a closed test with at least 12 testers for 14 days before going to production.
2. Create the app with package **`in.plinth.app`**. Enable Play App Signing.
3. **Upload key:** generate it in your own terminal (`keytool -genkey -v -keystore plinth-upload.jks …`), keep it in your password manager, and never commit it.
4. **CI upload:** in Google Cloud, create a service account, grant it *Release manager* in Play Console, and download its JSON key. **Turn it into a GitHub secret** and then delete the local file.
5. App Links: copy the SHA-256 fingerprints of the upload key and of the Play signing key.

| Where | Env names |
|---|---|
| GitHub secrets | `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `PLAY_SERVICE_ACCOUNT_JSON` |
| Vercel env (for `/.well-known/assetlinks.json`) | `ANDROID_SHA256_CERT_FINGERPRINTS` |

### 1.3 TRAI DLT + SMS provider (SMS fallback for login codes; until then WhatsApp codes or test numbers)

1. Register the company as a **Principal Entity** on one operator's DLT portal (Jio, Airtel, Vi or BSNL). You need PAN, GST, incorporation documents and an authorisation letter. There is a one-time fee (about ₹5–6k on most portals; check the portal's page), and approval takes about 1–2 weeks.
2. Register the **sender header** `PLINTH` and one **OTP content template** (the lead supplies the text).
3. Open an **MSG91** account, link the DLT entity, header and template IDs, and create an OTP flow.

| Where | Env names |
|---|---|
| Supabase secrets | `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`, `DLT_ENTITY_ID`, `DLT_TEMPLATE_ID`, `SMS_SENDER_ID` (`PLINTH`) |

**Cost:** about ₹0.18–0.25 per SMS.

### 1.4 Live HARERA data (no legal gate)

- **Founder decision, 20 Oct 2026:** the legal memo and the HARERA permission letter are post-launch work and do not gate live data (FOUNDER_QUESTIONS P8).
- Live fetch needs the GCP project (4.3) for an Indian IP. You set `HARERA_LIVE_FETCH_APPROVED=yes` in the Cloud Run job's environment when the job is ready; it stays a kill switch you can turn off at any time.
- Optional, low-risk, helpful: while browsing normally, **save up to 10 real HARERA pages by hand** for parser development: one registered-projects list, one Form A-H, one QPR, one corrigendum response and one judgments page. Drop them in `pipelines/tests/fixtures/harera/real/`.
- **Before public beta (PRD §12.2):** media-liability and cyber insurance, a grievance officer, and the company details for the About page. Agents leave these as labelled placeholders.

---

## Step 2 · When M0 lands (about week 2): the dev environment, all free tiers

### 2.1 Supabase: project `plinth-dev` (unblocks hosted dev, live-mode checks, M2 auth)

1. Create the org "Plinth" and the project **`plinth-dev`**, region **South Asia (Mumbai) ap-south-1**, free plan.
   - Free projects pause after about 7 days without traffic. The nightly synthetic check keeps it awake.
2. Save the database password in your password manager.
3. From Project Settings → API, copy the project URL, the publishable key (`sb_publishable_…`) and the secret key (`sb_secret_…`).
4. In your own terminal:
   ```bash
   supabase login
   cd "/Users/macbook/code/Real Estate"
   supabase link --project-ref <ref>
   ```
5. Create an access token (Account → Access tokens) **for CI**, and store it as a GitHub secret.
6. After T41 merges, in the dashboard:
   - Auth → enable the Phone provider;
   - add the **test phone numbers** listed in `packages/fixtures/canonical/people.json` (fictional numbers, fixed codes);
   - Auth Hooks → Send SMS → `auth-sms-hook` with a generated hook secret;
   - Custom Access Token → `ops.custom_access_token_hook`.
7. The `deploy-dev` workflow sets `plinth.env = 'fixture'` on this database, so `plinth-dev` stays the frozen §5b world (18 Oct 2026).

| Where | Env names |
|---|---|
| `.env.local` (and Vercel Preview) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` |
| Server only: Supabase secrets / Vercel server env / GitHub | `SUPABASE_SECRET_KEY`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN` (CI), `SEND_SMS_HOOK_SECRET`, `PLINTH_DISPATCH_SECRET` (also stored in Vault), `REVALIDATE_SECRET` |
| Pipelines | `PIPELINE_DB_URL` (the `pipeline_writer` role; you set its password via the SQL editor) |
| App (`apps/mobile/.env.json`) | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` |

### 2.2 Vercel (unblocks preview URLs per PR)

1. Use a Hobby account for dev and preview. **Switch to Pro ($20/month) before public launch**, because Hobby is non-commercial.
2. Import the repo **twice**:
   - `plinth-web`, root `apps/web`;
   - `plinth-admin`, root `apps/admin`.
3. Settings → Functions → region **Mumbai (bom1)**. Node.js **22**.
4. Add env vars per environment:
   - Preview = dev Supabase with `PLINTH_DATA=supabase`;
   - a "fixtures" preview branch may use `PLINTH_DATA=fixtures`.

| Env names |
|---|
| `PLINTH_DATA`, `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_SECRET`, `ANDROID_SHA256_CERT_FINGERPRINTS`, `NEXT_PUBLIC_TILES_URL`, plus the Supabase and Sentry names above |

### 2.3 Firebase (unblocks push notifications and crash reports; the app runs without them)

1. Create the Firebase project "plinth" and add an Android app `in.plinth.app`.
2. Download `google-services.json`. It is gitignored: place it at `apps/mobile/android/app/google-services.json` locally, and add a base64 copy as a GitHub secret.
3. Enable Cloud Messaging and Crashlytics.
4. For server push, create a service-account key with the *Firebase Cloud Messaging API Admin* role and store the JSON as one Supabase secret.

| Where | Env names |
|---|---|
| GitHub | `GOOGLE_SERVICES_JSON_BASE64` |
| Supabase secrets | `FCM_SERVICE_ACCOUNT` (the same name pet_app uses) |

### 2.4 Gemini (already have a key; unblocks live AI in dev; CI always uses recorded responses)

- Your `GEMINI_API_KEY` in `.env.local` works for dev. Add it as a Supabase secret (dev) and as a GitHub secret (nightly live evals only).
- Set a **daily quota / budget alert** in Google AI Studio or the Cloud console.
- **Important:** free-tier Gemini API data may be used by Google to improve its products, so **use it with fictional data only.** Before staging or any real user data, either:
  - enable billing on the key's Google Cloud project (paid-tier terms), or
  - move to **Vertex AI, asia-south1**, with a service account.

  Tell the lead which.

| Env names |
|---|
| `GEMINI_API_KEY`, `AI_MODE` (`recorded` \| `live`), `AI_DAILY_BUDGET_INR` |

### 2.5 Sentry and PostHog (optional from M2; everything is a no-op without them)

- **Sentry**, free Developer plan: projects `plinth-web`, `plinth-admin`, `plinth-edge`, `plinth-pipelines`. Android uses Crashlytics.
- **PostHog**, free tier: create one project. It stays off until the privacy notice has the analytics-consent wording.

| Env names |
|---|
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN_ADMIN`, `SENTRY_DSN_EDGE`, `SENTRY_DSN_PIPELINES`, `SENTRY_AUTH_TOKEN` (CI source maps), `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `POSTHOG_KEY` (app) |

---

## Step 3 · Before M4 (about week 12): email

**Resend** (free tier, 3k emails a month) with the domain verified: SPF, DKIM and DMARC records on `plinth.in`.
- Also set it as Supabase Auth custom SMTP, because developer sign-in uses email codes and the built-in sender is heavily rate-limited.
- It unblocks the developer workspace's "Email each new record", data-export emails, and admin email codes.

| Env names |
|---|
| `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `Plinth <no-reply@plinth.in>`). The SMTP host/user/password go in the Supabase dashboard only |

---

## Step 4 · Before M6 / launch (about week 19)

| # | Action | Unblocks | Env names | Cost |
|---|---|---|---|---|
| 4.1 | Supabase **`plinth-prod`** (Pro plan, Mumbai) and optionally `plinth-staging`. Same auth hooks; real data only after the memo | Production | Same names, per environment | $25/month + compute |
| 4.2 | Vercel **Pro**, with the production domain on `plinth-web` and `admin.plinth.in` on `plinth-admin` | Commercial hosting | — | $20/month per seat |
| 4.3 | Google Cloud project, region **asia-south1**: Cloud Run Jobs, Cloud Scheduler, Artifact Registry. Connect GitHub with **Workload Identity Federation** (no JSON keys) | Live HARERA fetch from an Indian IP | `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_WIF_PROVIDER`, `GCP_SERVICE_ACCOUNT` | Tens of dollars a month |
| 4.4 | Map tiles: download a Protomaps PMTiles extract for the Gurugram bounding box (no account) and upload it to the Supabase Storage bucket `tiles` | The map basemap on web and app | `NEXT_PUBLIC_TILES_URL`, `TILES_URL` (app) | Free |
| 4.5 | Payment partner (e.g. Razorpay, business KYC), only if Pro (₹999) goes on sale | `pro_paywall` | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Per transaction |
| 4.6 | WhatsApp templates approved; production number live; then you switch `META_MODE=live` in prod | Real alerts | — | Per message |
| 4.7 | Company facts for the About page (legal name, CIN, GSTIN, address, founder photo, holdings declarations, grievance officer, insurer) | WebAbout placeholders | — | — |
| 4.8 | Apple Developer account. **Not needed until R2 (iOS).** | — | — | $99/year |

---

## Checklist (tick as you go)

- [ ] 0.1 Artboards copy approved · [ ] 0.3 Domain decided
- [ ] 1.1 Meta Business verification started · [ ] Developer app + test number · [ ] Production number + display name · [ ] Templates submitted
- [ ] 1.2 D-U-N-S requested · [ ] Play organisation account · [ ] Upload key made · [ ] CI service account in GitHub secrets
- [ ] 1.3 DLT Principal Entity · [ ] Header `PLINTH` · [ ] OTP template · [ ] MSG91 linked
- [ ] 1.4 (optional) ≤ 10 real HARERA pages saved · legal memo and HARERA letter: post-launch
- [ ] 2.1 `plinth-dev` Supabase + secrets · [ ] 2.2 Vercel ×2 · [ ] 2.3 Firebase · [ ] 2.4 Gemini budget alert · [ ] 2.5 Sentry/PostHog
- [ ] 3 Resend + DNS
- [ ] 4.x Production accounts, insurance, company facts
