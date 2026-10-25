# Integration setup

Everything in here is a thing only you can do — it needs your company details,
your card, and your logins. **All the code is already written and deployed.**
Each section below ends with values to paste in; nothing else changes.

Values go in **two places**:

1. `.env.local` in the project folder (local work)
2. Vercel → your project → **Settings** → **Environment Variables** (live
   site), then **Deployments** → **⋯** on the newest → **Redeploy**

---

## 0. Run the database migration — do this first

Nothing in the field-ops feature works until this runs. It creates the agent
accounts table, the photo table, the message outbox, and the service-area
setting.

1. Go to **https://supabase.com/dashboard**
2. Click your project (`tuclehdnpysbiojplbsg`)
3. Left sidebar → **SQL Editor**
4. Click **+ New query**
5. Open `supabase/migrations/0007_field_ops.sql`, copy the whole file, paste it
6. Click **Run** (bottom right, or Ctrl+Enter)

Expect `Success. No rows returned`.

> If it errors with **"unsafe use of new value of enum type"**, run only the
> four `alter type ...` lines at the top first, click **Run**, then run the
> rest of the file.

**Verify:** sidebar → **Table Editor**. You should now see `agent_profiles`,
`booking_photos` and `notifications`.

---

## 1. Google Maps

Powers address autocomplete on the booking form, the agent's Navigate button,
and the service-area circle in the admin.

### 1a. Create the project

1. **https://console.cloud.google.com/**
2. Sign in with the account that should own the billing
3. Top bar, next to the "Google Cloud" logo → click the **project dropdown**
4. **NEW PROJECT** (top right of the dialog)
5. Name it `ScrapSquad` → **CREATE** → **SELECT PROJECT**

### 1b. Turn on billing

Google requires a card even though the free tier covers this easily — **$200
of free usage every month**.

1. ☰ menu (top left) → **Billing**
2. **LINK A BILLING ACCOUNT** → **CREATE BILLING ACCOUNT**
3. Country **India**, accept terms → **CONTINUE**
4. Card details → **SUBMIT AND ENABLE BILLING**

### 1c. Enable three APIs

Paste each name into the search bar at the very top of the console, open the
result, click the blue **ENABLE**:

| API | Used for |
|---|---|
| **Maps JavaScript API** | The admin service-area map |
| **Places API (New)** | Address autocomplete on the booking form |
| **Geocoding API** | Turning a typed address into coordinates server-side |

### 1d. Create the key

1. ☰ → **APIs & Services** → **Credentials**
2. **+ CREATE CREDENTIALS** → **API key**
3. Copy the key (`AIzaSy...`)
4. Click **EDIT API KEY**

### 1e. Restrict the key — do not skip

An unrestricted Maps key is visible in your page source and billable by anyone
who finds it.

1. **Application restrictions** → **Websites**
2. **ADD**, one at a time:
   - `https://website-ten-sepia-86.vercel.app/*`
   - `http://localhost:3000/*`
   - your custom domain later, as `https://yourdomain.com/*`
3. **API restrictions** → **Restrict key**
4. Tick exactly: **Maps JavaScript API**, **Places API (New)**,
   **Geocoding API**
5. **SAVE**

### 1f. Budget alert (recommended)

☰ → **Billing** → **Budgets & alerts** → **CREATE BUDGET** → name `Maps`,
**NEXT** → target `500` INR → **NEXT** → **FINISH**.

### 1g. Paste it in

```
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSy...
```

`NEXT_PUBLIC_` is correct — the browser loads the map. That is safe **only
because of step 1e**.

### 1h. Set your depot

Once the key is live: **/admin** → **Service area** → drag the pin to your
depot, drag the circle edge to set how far you collect → **Save service area**.

Until you do, it defaults to a 15 km circle around Hyderabad city centre.

---

## 2. WhatsApp — Meta Cloud API

**The integration is finished.** `lib/whatsapp-meta.ts` sends approved
templates, `/api/whatsapp/webhook` records delivery receipts, and Vercel Cron
retries anything that fails every 5 minutes. It all switches on the moment the
credentials below exist. Until then every message is still written and queued
against its booking with a one-tap send link.

### 2a. Business portfolio

1. **https://business.facebook.com/** → **Create account**
2. Enter business name, your name, business email → **Submit**

### 2b. Create the app

1. **https://developers.facebook.com/apps/**
2. **Create App** (green, top right)
3. Use case → choose **Other** → **Next**
4. App type → **Business** → **Next**
5. App name `ScrapSquad`, contact email, link the portfolio from 2a →
   **Create app**

### 2c. Add WhatsApp

1. On the app dashboard, scroll to **WhatsApp** → **Set up**
2. Left sidebar → **WhatsApp** → **API Setup**
3. Under **From**, click **Add phone number**
4. Enter your business number → verify by SMS/call

> **Important:** the number must **not** currently be registered on WhatsApp.
> If `95153 21371` is on WhatsApp today, either delete that WhatsApp account
> first (WhatsApp app → Settings → Account → Delete my account) or use a
> different number for sending.

Copy the **Phone number ID** shown on this page.

### 2d. Business verification

This is the slow part — allow **1–3 weeks**. Start it now, continue the rest
meanwhile.

1. **https://business.facebook.com/settings/security-centre**
2. **Start Verification**
3. Upload a business registration certificate, utility bill or bank statement
   in the business's exact name

### 2e. Register the seven templates

Left sidebar → **WhatsApp** → **Message Templates** → **Create template**.

For each one: **Category** = `Utility`, **Language** = `English`, name it
exactly as in the table, and paste the body.

The bodies are in `lib/notify.ts` under `DEFAULT_TEMPLATES` — but Meta uses
numbered placeholders, so use **these** versions. The number order is what
`lib/whatsapp-meta.ts` sends; changing it silently sends the wrong values.

| Template name | Placeholders in order |
|---|---|
| `booking_confirmed_customer` | name, code, date, slot, items, track-link |
| `booking_new_admin` | code, name, phone, date, slot, address, items, estimate |
| `agent_assigned_customer` | name, agent name, code, date, slot, agent phone, track-link |
| `agent_en_route_customer` | name, agent name, code, track-link |
| `agent_at_gate_customer` | name, agent name, code, agent phone |
| `pickup_complete_customer` | name, code, weight, amount, method, track-link |
| `job_assigned_agent` | code, date, slot, name, phone, address |

Example body for `agent_at_gate_customer`:

```
Hi {{1}}, {{2}} from ScrapSquad is at your gate for pickup {{3}}.

Please approve entry with your security desk, or call {{4}}. We'll wait.
```

Meta asks for a sample value per placeholder — any realistic value is fine.

### 2f. Permanent access token

The token on the API Setup page expires in 24 hours. You need a permanent one.

1. **https://business.facebook.com/settings/system-users**
2. **Add** → name `scrapsquad-api`, role **Admin** → **Create**
3. **Assign assets** → **Apps** → pick your app → enable **Full control** →
   **Save changes**
4. **Generate new token** → pick your app → **Token expiration: Never**
5. Tick **whatsapp_business_messaging** and **whatsapp_business_management**
6. **Generate token** → **copy it now**, it is shown only once

### 2g. Webhook

1. App dashboard → **WhatsApp** → **Configuration**
2. **Edit** next to Callback URL
3. **Callback URL:**
   `https://website-ten-sepia-86.vercel.app/api/whatsapp/webhook`
4. **Verify token:** invent any random string, e.g. `squad-hook-9f2a7c`, and
   keep it — it goes in `WHATSAPP_VERIFY_TOKEN`
5. **Verify and save**
6. Under **Webhook fields**, click **Manage** → tick **messages** → **Done**

> It must say "verified". If it fails, the env vars are not deployed yet —
> set them and redeploy first, then verify.

### 2h. App secret

App dashboard → **App settings** → **Basic** → **App secret** → **Show** →
copy.

### 2i. Paste it all in

```
WHATSAPP_TOKEN=EAA...            (2f)
WHATSAPP_PHONE_NUMBER_ID=1234... (2c)
WHATSAPP_TEMPLATE_LANG=en
WHATSAPP_VERIFY_TOKEN=squad-hook-9f2a7c   (whatever you invented in 2g)
WHATSAPP_APP_SECRET=abc123...    (2h)
CRON_SECRET=any-long-random-string
```

Redeploy. Messages start sending themselves; the admin booking page shows
`sent` instead of `queued`.

---

## 3. Checklist

| | Needed for | Blocking? |
|---|---|---|
| Migration 0007 (section 0) | All field ops | **Yes — nothing works without it** |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Autocomplete, radius map | No — falls back to pincodes |
| Depot pin set (1h) | Accurate service area | No — defaults to Hyderabad 15 km |
| WhatsApp credentials (2) | Automatic sending | No — queues for one-tap manual send |
| `CRON_SECRET` | Retry sweep | Only with WhatsApp |
| Real contact email | `hello@scrapsquad.example` cannot receive mail | No |
| First agent account | Testing the agent app | After migration |
