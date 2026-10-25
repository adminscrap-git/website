# Integration setup

Everything here is a thing only you can do — it needs your company details,
your card, and your logins. Work top to bottom; each section says what you get
back and where to put it.

Values you collect go in **two places**:

1. `.env.local` in the project folder (for local work)
2. Vercel → your project → **Settings** → **Environment Variables** (for the
   live site), then **Deployments** → **⋯** on the newest → **Redeploy**

---

## 0. Apply the database migration (do this first)

Nothing in the new field-ops feature works until this runs. It creates the
agent accounts table, the photo table and the message outbox.

1. Go to **https://supabase.com/dashboard**
2. Click your project (`tuclehdnpysbiojplbsg`)
3. Left sidebar → **SQL Editor**
4. Click **+ New query** (top left of the editor panel)
5. Open `supabase/migrations/0007_field_ops.sql` from this repo, copy the whole
   file, paste it into the editor
6. Click **Run** (bottom right, or Ctrl+Enter)

You should see `Success. No rows returned`.

> If it errors with **"unsafe use of new value of enum type"**, run just the
> four `alter type ...` lines at the top on their own first, click **Run**,
> then run the rest of the file.

**Check it worked:** sidebar → **Table Editor**. You should now see
`agent_profiles`, `booking_photos` and `notifications` in the table list.

---

## 1. Google Maps

Used for: the address picker on the booking form, the agent's "Navigate"
button, and the service-area radius on the admin map.

### 1a. Create the project

1. Go to **https://console.cloud.google.com/**
2. Sign in with the Google account that should own the billing
3. Top bar, next to the "Google Cloud" logo, click the **project dropdown**
   (it says "Select a project")
4. In the dialog, click **NEW PROJECT** (top right)
5. **Project name:** `ScrapSquad` → click **CREATE**
6. Wait for the notification, then click **SELECT PROJECT**

### 1b. Turn on billing

Google requires a card even though the free tier is generous. You get **$200
of free usage every month**, which is far more than this site will use.

1. Left sidebar (the ☰ hamburger, top left) → **Billing**
2. Click **LINK A BILLING ACCOUNT** → **CREATE BILLING ACCOUNT**
3. Enter country **India**, accept terms, click **CONTINUE**
4. Enter your card details → **SUBMIT AND ENABLE BILLING**

### 1c. Enable the three APIs

For each of these, search its name in the top search bar, open it, and click
the blue **ENABLE** button:

| API | What it does here |
|---|---|
| **Maps JavaScript API** | Draws the map on the admin service-area page |
| **Places API (New)** | Address autocomplete on the booking form |
| **Geocoding API** | Turns an address into coordinates to test the radius |

Fastest route for each: paste the API name into the search bar at the very top
of the console, click the result under *Marketplace*, click **ENABLE**.

### 1d. Create the key

1. Left sidebar → **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** (top) → **API key**
3. A box shows your key — click the **copy** icon. It looks like
   `AIzaSy...`
4. Click **EDIT API KEY** in that same box (or click the key's name in the list)

### 1e. Restrict the key — do not skip this

An unrestricted Maps key found in your page source can be used by anyone and
billed to you.

1. Under **Application restrictions**, choose **Websites**
2. Click **ADD** and add each of these, one at a time:
   - `https://website-ten-sepia-86.vercel.app/*`
   - `http://localhost:3000/*`
   - your custom domain when you have one, as `https://yourdomain.com/*`
3. Under **API restrictions**, choose **Restrict key**
4. In the dropdown tick exactly: **Maps JavaScript API**, **Places API (New)**,
   **Geocoding API**
5. Click **SAVE** (bottom)

### 1f. Set a budget alert (recommended)

1. Left sidebar → **Billing** → **Budgets & alerts**
2. **CREATE BUDGET** → name it `Maps`, **NEXT**
3. Set **Target amount** to something like `500` INR → **NEXT** → **FINISH**

You will be emailed if usage ever approaches it.

### 1g. Give me the key

Add to `.env.local` and to Vercel:

```
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSy...your key...
```

It is `NEXT_PUBLIC_` because the browser has to load the map — that is normal
and safe **only because of step 1e**. The website restriction is what stops
anyone else using it.

---

## 2. WhatsApp

**Nothing is blocked on this.** Messages are already written and queued
against each booking, and the office can send each one in a single tap from
the booking page. This section is for when you want them to send themselves.

### What Meta requires, whichever route you pick

You cannot send automated WhatsApp messages from a normal number. Every route
below needs the same three things, and the waiting is Meta's, not ours:

1. A **Meta Business account** that passes business verification — they ask for
   a registration certificate, a utility bill or a bank statement in the
   business's name
2. A **phone number** that is **not currently registered on WhatsApp**
   (if `95153 21371` is on WhatsApp today, you must either delete that WhatsApp
   account first or use a different number)
3. **Pre-approved templates.** Meta approves the exact wording of any message
   you send first. Our six are in `lib/notify.ts` under `DEFAULT_TEMPLATES` —
   they will need submitting as-is.

### Option A — an Indian BSP (fastest)

AiSensy, Interakt, Wati or Gupshup. Around ₹999–2,500/month. They walk you
through verification, submit the templates for you, and give you an API key.
Usually live in 1–3 days.

Using **AiSensy** as the example:

1. Go to **https://www.aisensy.com/** → **Sign Up** (top right)
2. Finish signup, then on the dashboard click **Connect WhatsApp Business**
3. Follow their embedded Meta signup — it asks for your business details and
   the phone number from point 2 above
4. Once approved, left sidebar → **Manage** → **API Key** → **Generate**
5. Left sidebar → **Templates** → create one per entry in `DEFAULT_TEMPLATES`

Then send me:
- the API key
- your sender phone number
- the **exact template names** you registered

### Option B — Meta Cloud API direct

No monthly fee, roughly ₹0.11–0.80 per conversation, but you do all the
paperwork and wait on approvals yourself.

1. **https://business.facebook.com/** → create a Business portfolio
2. **https://developers.facebook.com/** → **My Apps** → **Create App** →
   choose **Business** → name it `ScrapSquad`
3. On the app dashboard find **WhatsApp** → **Set up**
4. **API Setup** → add your phone number → verify by OTP
5. **https://business.facebook.com/settings/security-centre** → **Start
   Verification** → upload your business documents *(this is the slow part —
   allow 1–3 weeks)*
6. App dashboard → **WhatsApp** → **Message Templates** → **Create template**,
   once per entry in `DEFAULT_TEMPLATES`
7. **System Users** → create one → **Generate token** → tick
   `whatsapp_business_messaging` → copy the **permanent** token

Then send me:
- the permanent access token
- the **Phone Number ID** (shown on the API Setup page)
- the **WhatsApp Business Account ID**

### When you have the credentials

Wiring them up is one function. `getDriver()` in `lib/notify.ts` returns `null`
today; it will return the provider's send call instead, and everything already
queued sends itself. No other file changes.

---

## 3. What I still need from you

| Thing | Why |
|---|---|
| Migration 0007 run (section 0) | Nothing in field ops works until then |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Address picker, agent navigation, radius map |
| Real contact email | `hello@scrapsquad.example` is live and cannot receive mail |
| Depot address or coordinates | The centre point the service radius measures from |
| WhatsApp credentials | Only when you want automatic sending |
