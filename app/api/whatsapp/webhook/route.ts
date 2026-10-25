import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { sbAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Meta's webhook.
 *
 * Two jobs: prove the endpoint is ours (GET, once, when you save the URL in
 * the Meta console), and record what happened to each message (POST, forever).
 *
 * Delivery receipts matter more than they look. Without them "sent" only means
 * Meta accepted it — a wrong number or a blocked business still reads as
 * success in the outbox. With them, `failed` is the truth.
 */

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    return new NextResponse("WHATSAPP_VERIFY_TOKEN is not set", { status: 500 });
  }
  if (
    params.get("hub.mode") === "subscribe" &&
    params.get("hub.verify_token") === verifyToken
  ) {
    // Meta expects the challenge echoed back as bare text.
    return new NextResponse(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * Anyone can POST to a public URL, so the payload is only trusted if it is
 * signed with the app secret. Without this check a stranger could mark every
 * message delivered, or worse, failed.
 */
function verifySignature(raw: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  // No secret configured means we cannot verify, so we do not trust it.
  if (!secret || !header?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const given = header.slice("sha256=".length);
  if (expected.length !== given.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}

export async function POST(req: NextRequest) {
  const raw = await req.text();

  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Bad signature", { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad JSON", { status: 400 });
  }

  const statuses = (body as WebhookBody)?.entry
    ?.flatMap((e) => e.changes ?? [])
    .flatMap((c) => c.value?.statuses ?? []) ?? [];

  const db = sbAdmin();

  for (const s of statuses) {
    if (!s.id) continue;
    // delivered/read both mean it arrived; only `failed` is new information
    // worth overwriting a `sent` row with.
    if (s.status === "failed") {
      await db
        .from("notifications")
        .update({
          status: "failed",
          error: s.errors?.[0]?.title ?? "Delivery failed",
        })
        .eq("provider_id", s.id);
    }
  }

  // Always 200, even on nothing-to-do. Meta retries aggressively on any other
  // code and will eventually disable a webhook that keeps erroring.
  return NextResponse.json({ ok: true });
}

type WebhookBody = {
  entry?: {
    changes?: {
      value?: {
        statuses?: {
          id?: string;
          status?: string;
          errors?: { title?: string }[];
        }[];
      };
    }[];
  }[];
};
