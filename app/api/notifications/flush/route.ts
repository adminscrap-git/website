import { NextResponse, type NextRequest } from "next/server";
import { flush, hasProvider } from "@/lib/notify";

export const dynamic = "force-dynamic";

/**
 * Retry sweep for anything the after-response flush missed — a provider
 * outage, a cold start that was killed, a row queued before credentials
 * existed.
 *
 * Guarded by CRON_SECRET. Vercel sends it as a Bearer token on scheduled
 * runs; without the guard this would be a public button for draining the
 * outbox at whatever rate a stranger liked.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (!hasProvider()) {
    return NextResponse.json({ skipped: "no WhatsApp provider configured" });
  }

  const result = await flush(50);
  return NextResponse.json(result);
}
