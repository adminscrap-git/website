"use server";

import { revalidatePath } from "next/cache";
import { sbAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { sbSession } from "@/lib/supabase/server";
import { assertAssigned } from "@/lib/agent-auth";
import { formatDate, formatSlot, rupees } from "@/lib/format";
import { enqueue } from "@/lib/notify";
import { site } from "@/lib/site";
import type { Booking, BookingFull, BookingStatus, PhotoKind } from "@/lib/db-types";

/**
 * What a pickup agent can do from their phone.
 *
 * Every one of these takes a booking id from the client, so every one of them
 * re-proves the job belongs to this agent. `assertAssigned` is not a
 * convenience — without it any signed-in agent could post payment figures onto
 * someone else's pickup by editing an id.
 */

export type FormState = { error?: string; ok?: string };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Only ever forward, and only within what the field actually controls. */
const AGENT_ALLOWED: BookingStatus[] = ["en_route", "arrived", "picked_up", "completed"];

export async function setJobStatus(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const bookingId = str(fd, "booking_id");
  const to = str(fd, "status") as BookingStatus;

  const gate = await assertAssigned(bookingId);
  if (!gate.ok) return { error: gate.error };
  if (!AGENT_ALLOWED.includes(to)) {
    return { error: "That isn't a status you can set." };
  }

  const db = sbAdmin();
  const { data: booking } = await db
    .from("bookings")
    .select("*, slot:time_slots(*)")
    .eq("id", bookingId)
    .maybeSingle<BookingFull>();
  if (!booking) return { error: "That booking no longer exists." };
  if (booking.status === "cancelled") {
    return { error: "This booking was cancelled. Call the office." };
  }

  const now = new Date().toISOString();
  const patch: Partial<Booking> = { status: to, updated_at: now };
  if (to === "arrived") patch.arrived_at = now;

  const { error } = await db.from("bookings").update(patch).eq("id", bookingId);
  if (error) return { error: error.message };

  await db.from("booking_events").insert({
    booking_id: bookingId,
    from_status: booking.status,
    to_status: to,
    actor: "agent",
    note: gate.agent.full_name,
  });

  const base = {
    name: booking.name,
    code: booking.code,
    date: formatDate(booking.pickup_date),
    slot: booking.slot ? formatSlot(booking.slot) : "TBC",
    agentName: gate.agent.full_name,
    agentPhone: gate.agent.phone ?? site.phone,
    track: `${site.url}/b/${booking.token}`,
  };

  if (to === "en_route") {
    await enqueue({
      bookingId,
      templateKey: "agent_en_route_customer",
      audience: "customer",
      recipient: booking.phone,
      vars: base,
    });
  }

  // The gate message. This one is asking for something rather than telling —
  // in a gated community the van does not move until the resident clears it
  // with security, so it goes out the moment the agent arrives.
  if (to === "arrived") {
    await enqueue({
      bookingId,
      templateKey: "agent_at_gate_customer",
      audience: "customer",
      recipient: booking.phone,
      vars: base,
    });
  }

  if (to === "completed") {
    await enqueue({
      bookingId,
      templateKey: "pickup_complete_customer",
      audience: "customer",
      recipient: booking.phone,
      vars: {
        ...base,
        weight: booking.collected_weight ? `${booking.collected_weight} kg` : "—",
        amount: booking.paid_amount ? rupees(booking.paid_amount) : "—",
        method: booking.payment_method ?? "—",
      },
    });
  }

  revalidatePath(`/agent/j/${bookingId}`);
  revalidatePath("/agent");
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: "Updated." };
}

/**
 * The settlement figures, recorded at the door.
 *
 * Saved separately from the status so an agent can correct a mistyped weight
 * without walking the booking backwards through the workflow.
 */
export async function recordSettlement(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const bookingId = str(fd, "booking_id");
  const gate = await assertAssigned(bookingId);
  if (!gate.ok) return { error: gate.error };

  const weight = Number(fd.get("collected_weight") ?? 0);
  const amount = Number(fd.get("paid_amount") ?? 0);
  const method = str(fd, "payment_method");

  if (!Number.isFinite(weight) || weight < 0) return { error: "Enter a valid weight." };
  if (!Number.isFinite(amount) || amount < 0) return { error: "Enter a valid amount." };
  if (amount > 0 && !method) return { error: "Say how it was paid." };

  const { error } = await sbAdmin()
    .from("bookings")
    .update({
      collected_weight: weight || null,
      paid_amount: amount || null,
      payment_method: method || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);
  if (error) return { error: error.message };

  revalidatePath(`/agent/j/${bookingId}`);
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: "Saved." };
}

/**
 * Photo upload.
 *
 * Goes to the private `proofs` bucket through the service role rather than
 * straight from the phone: a browser upload would need an anon insert policy
 * on the bucket, and that policy cannot express "only onto your own job".
 *
 * The file is validated here rather than trusted from the client — a phone
 * can be told to send anything.
 */
export async function uploadProof(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const bookingId = str(fd, "booking_id");
  const gate = await assertAssigned(bookingId);
  if (!gate.ok) return { error: gate.error };

  const kind = (str(fd, "kind") || "scrap") as PhotoKind;
  if (!["scrap", "payment_proof", "other"].includes(kind)) {
    return { error: "Unknown photo type." };
  }

  const files = fd.getAll("photo").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "Choose at least one photo." };

  const db = sbAdmin();
  const MAX = 8 * 1024 * 1024;
  let saved = 0;

  for (const file of files) {
    if (file.size > MAX) return { error: `${file.name} is over 8 MB.` };
    if (!file.type.startsWith("image/")) return { error: "Only images, please." };

    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
    const path = `${bookingId}/${kind}-${Date.now()}-${saved}.${ext}`;

    const { error: upErr } = await db.storage
      .from("proofs")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) return { error: `Upload failed: ${upErr.message}` };

    const { error: rowErr } = await db.from("booking_photos").insert({
      booking_id: bookingId,
      kind,
      storage_path: path,
      uploaded_by: gate.agent.user_id,
    });
    if (rowErr) {
      // Don't leave an orphan object nobody can find or bill for.
      await db.storage.from("proofs").remove([path]);
      return { error: `Could not record the photo: ${rowErr.message}` };
    }
    saved++;
  }

  revalidatePath(`/agent/j/${bookingId}`);
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: saved === 1 ? "Photo added." : `${saved} photos added.` };
}

export async function deleteProof(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const bookingId = str(fd, "booking_id");
  const photoId = str(fd, "photo_id");
  const gate = await assertAssigned(bookingId);
  if (!gate.ok) return { error: gate.error };

  const db = sbAdmin();
  const { data: photo } = await db
    .from("booking_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("booking_id", bookingId)
    .maybeSingle<{ storage_path: string }>();
  if (!photo) return { error: "That photo is already gone." };

  await db.storage.from("proofs").remove([photo.storage_path]);
  await db.from("booking_photos").delete().eq("id", photoId);

  revalidatePath(`/agent/j/${bookingId}`);
  return { ok: "Removed." };
}

/* ── session ───────────────────────────────────────────────────────── */

/**
 * Agent sign in.
 *
 * Mirrors the admin flow in app/actions/auth.ts, including the part that
 * matters most: authenticating is not authorisation. An admin's credentials
 * are valid Supabase credentials, so without this second check they would sign
 * in here successfully and land on an agent dashboard with no jobs. Signing
 * them straight back out and saying so is clearer than a silent empty screen.
 */
export async function agentSignIn(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const email = str(fd, "email");
  const password = String(fd.get("password") ?? "");
  const next = str(fd, "next") || "/agent";

  if (!email || !password) return { error: "Enter your email and password." };

  const sb = await sbSession();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  // Deliberately vague: don't confirm which half was wrong.
  if (error || !data.user) return { error: "That email and password don't match." };

  const { data: profile } = await sbAdmin()
    .from("agent_profiles")
    .select("user_id, is_active")
    .eq("user_id", data.user.id)
    .maybeSingle<{ user_id: string; is_active: boolean }>();

  if (!profile) {
    await sb.auth.signOut();
    return { error: "That account isn't set up as a pickup agent." };
  }
  if (!profile.is_active) {
    await sb.auth.signOut();
    return { error: "This account has been deactivated. Call the office." };
  }

  redirect(next.startsWith("/agent") ? next : "/agent");
}

export async function agentSignOut(): Promise<void> {
  const sb = await sbSession();
  await sb.auth.signOut();
  redirect("/agent/login");
}
