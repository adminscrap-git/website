/**
 * Setup doctor.
 *
 *   npm run doctor
 *
 * Walks the setup steps in order and stops at the first thing that isn't done,
 * saying exactly what to do next. Read-only — it never writes to your database.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// tsx doesn't load .env.local on its own the way Next does.
loadEnvLocal();

const ok = (m: string) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const bad = (m: string) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);
const step = (n: number, m: string) => console.log(`\n\x1b[1m${n}. ${m}\x1b[0m`);

function stop(what: string, ...how: string[]): never {
  bad(what);
  console.log("\n\x1b[33m  What to do:\x1b[0m");
  for (const line of how) console.log(`    ${line}`);
  console.log("");
  process.exit(1);
}

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {
    stop(
      ".env.local not found",
      "cp .env.example .env.local",
      "then fill in your Supabase values (step 3 of the README).",
    );
  }
}

console.log("\n\x1b[1mMINT setup doctor\x1b[0m");

// ── 1. environment ──────────────────────────────────────────────────
step(1, "Environment");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || url.includes("xxxxxxxxxxxx")) {
  stop(
    "NEXT_PUBLIC_SUPABASE_URL is still the placeholder",
    "Supabase dashboard → Project Settings → API → Project URL",
    "Paste it into .env.local",
  );
}
ok(`Project URL: ${url}`);

if (!anon) {
  stop(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY is empty",
    "Project Settings → API → anon / publishable key",
  );
}
ok("Anon key set");

if (!service) {
  stop(
    "SUPABASE_SERVICE_ROLE_KEY is empty",
    "Project Settings → API → service_role / secret key",
    "This one is server-only. Never prefix it with NEXT_PUBLIC_.",
  );
}
if (service === anon) {
  stop(
    "SUPABASE_SERVICE_ROLE_KEY is the same as the anon key",
    "They're different keys. The service_role one is hidden behind a",
    "'Reveal' button on the same dashboard page.",
  );
}
ok("Service role key set");

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
if (!site) {
  stop("NEXT_PUBLIC_SITE_URL is empty", "Use http://localhost:3000 for local dev.");
}
ok(`Site URL: ${site}`);

// ── 2. connection ───────────────────────────────────────────────────
step(2, "Connection");

const db = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

{
  const { error } = await db.from("settings").select("key").limit(1);
  if (error) {
    if (/relation .* does not exist|Could not find the table/i.test(error.message)) {
      stop(
        "Connected, but the tables don't exist yet",
        "Supabase dashboard → SQL Editor. Run, in order:",
        "  supabase/migrations/0001_init.sql",
        "  supabase/migrations/0002_seed.sql",
        "  supabase/migrations/0004_storage.sql",
      );
    }
    if (/Invalid API key|JWT/i.test(error.message)) {
      stop(
        `Supabase rejected the key: ${error.message}`,
        "Re-copy SUPABASE_SERVICE_ROLE_KEY from Project Settings → API.",
      );
    }
    stop(`Couldn't reach Supabase: ${error.message}`, "Check the project URL and that the project isn't paused.");
  }
}
ok("Reached the database with the service role key");

// ── 3. schema + seed ────────────────────────────────────────────────
step(3, "Schema and seed data");

async function count(table: string): Promise<number> {
  const { count: n, error } = await db
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    stop(
      `Table "${table}" is missing or unreadable: ${error.message}`,
      "Re-run supabase/migrations/0001_init.sql in the SQL Editor.",
    );
  }
  return n ?? 0;
}

const categories = await count("categories");
const items = await count("items");
const slots = await count("time_slots");
const pincodes = await count("serviceable_pincodes");
const bookings = await count("bookings");

if (categories === 0 || items === 0) {
  stop(
    "No catalogue — the site will render empty",
    "Run supabase/migrations/0002_seed.sql in the SQL Editor,",
    "or add categories and items from /admin/catalogue once you can sign in.",
  );
}
ok(`${categories} categories, ${items} items`);

if (slots === 0) {
  stop(
    "No pickup windows — nobody can book",
    "Run supabase/migrations/0002_seed.sql, or add windows at /admin/slots.",
  );
}
ok(`${slots} pickup windows`);

if (pincodes === 0) {
  bad("No serviceable pincodes — every booking will be refused as out of area");
  console.log("    Add them at /admin/pincodes, or run 0002_seed.sql.");
} else {
  ok(`${pincodes} serviceable pincodes`);
}

ok(`${bookings} bookings so far`);

// ── 4. storage ──────────────────────────────────────────────────────
step(4, "Photo storage");

{
  const { data, error } = await db.storage.listBuckets();
  if (error) {
    bad(`Couldn't list buckets: ${error.message}`);
  } else if (!data?.some((b) => b.id === "catalogue")) {
    bad("The 'catalogue' bucket is missing — photo uploads will fail");
    console.log("    Run supabase/migrations/0004_storage.sql in the SQL Editor.");
    console.log("    Everything else works without it.");
  } else {
    ok("'catalogue' bucket ready");
  }
}

// ── 5. admin access ─────────────────────────────────────────────────
step(5, "Admin access");

{
  const { count: admins, error } = await db
    .from("admin_profiles")
    .select("*", { count: "exact", head: true });

  if (error) {
    stop(`Couldn't read admin_profiles: ${error.message}`, "Re-run 0001_init.sql.");
  }

  if ((admins ?? 0) === 0) {
    const { data: users } = await db.auth.admin.listUsers();
    const emails = users?.users?.map((u) => u.email).filter(Boolean) ?? [];

    stop(
      "No admin profile exists — you won't be able to sign in to /admin",
      emails.length === 0
        ? "First: Supabase → Authentication → Users → Add user."
        : `You have auth users (${emails.slice(0, 3).join(", ")}) but no admin profile.`,
      emails.length === 0 ? "  Set an email + password and TICK 'Auto Confirm User'." : "",
      "Then open supabase/migrations/0003_first_admin.sql, put your email on",
      "the marked line, and run it in the SQL Editor.",
    );
  }

  const { data: rows } = await db
    .from("admin_profiles")
    .select("email, role")
    .returns<{ email: string | null; role: string }[]>();

  for (const r of rows ?? []) ok(`${r.email ?? "(no email)"} — ${r.role}`);
}

console.log("\n\x1b[32m\x1b[1mAll set.\x1b[0m Run \x1b[1mnpm run dev\x1b[0m then open:");
console.log("  Site   http://localhost:3000");
console.log("  Admin  http://localhost:3000/admin\n");
