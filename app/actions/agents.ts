"use server";

import { revalidatePath } from "next/cache";
import { sbAdmin } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/admin-auth";
import { isValidPhone, normalisePhone, formatDate, formatSlot } from "@/lib/format";
import { enqueue, adminRecipient } from "@/lib/notify";
import { site } from "@/lib/site";
import type { AgentProfile, BookingFull } from "@/lib/db-types";

/**
 * Pickup agent accounts, managed from the back office.
 *
 * Creating one makes a real Supabase auth user. That is done with the service
 * role through the Admin API rather than the public signup flow, because
 * signup would email a confirmation link to an address the agent may not own —
 * these are work accounts handed out verbally, not self-service registrations.
 *
 * Only a super admin may touch them: an account with a password is a way into
 * customer addresses and phone numbers, and staff shouldn't be able to mint
 * one.
 */

export type FormState = { error?: string; ok?: string };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function createAgent(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return { error: gate.error };

  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const fullName = str(fd, "full_name");
  const phone = str(fd, "phone");

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Enter a valid email address for the agent to sign in with." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (fullName.length < 2) return { error: "Enter the agent's full name." };
  if (phone && !isValidPhone(phone)) {
    return { error: "Enter a 10-digit Indian mobile number, or leave it blank." };
  }

  const db = sbAdmin();

  // `email_confirm: true` because nobody is going to click a link — the admin
  // standing next to the agent is the verification.
  const { data: created, error: authErr } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authErr || !created?.user) {
    const msg = authErr?.message ?? "Could not create that account.";
    return {
      error: /already|exists|registered/i.test(msg)
        ? "An account with that email already exists."
        : msg,
    };
  }

  const { error: profileErr } = await db.from("agent_profiles").insert({
    user_id: created.user.id,
    email,
    full_name: fullName,
    phone: phone ? normalisePhone(phone) : null,
  });

  if (profileErr) {
    // Roll the auth user back. A user with no profile can sign in and land on
    // a dead end forever, and nothing else would ever clean it up.
    await db.auth.admin.deleteUser(created.user.id);
    return { error: `Could not save the agent: ${profileErr.message}` };
  }

  revalidatePath("/admin/agents");
  return { ok: `${fullName} can now sign in at ${site.url}/agent.` };
}

export async function updateAgent(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return { error: gate.error };

  const userId = str(fd, "user_id");
  const fullName = str(fd, "full_name");
  const phone = str(fd, "phone");
  if (!userId) return { error: "Missing agent." };
  if (fullName.length < 2) return { error: "Enter the agent's full name." };
  if (phone && !isValidPhone(phone)) {
    return { error: "Enter a 10-digit Indian mobile number, or leave it blank." };
  }

  const { error } = await sbAdmin()
    .from("agent_profiles")
    .update({
      full_name: fullName,
      phone: phone ? normalisePhone(phone) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin/agents");
  return { ok: "Saved." };
}

/**
 * Turns an agent on or off.
 *
 * Preferred over deletion: `currentAgent()` checks `is_active` on every
 * request, so this locks someone out immediately, while their name stays
 * attached to the jobs they actually did.
 */
export async function setAgentActive(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return { error: gate.error };

  const userId = str(fd, "user_id");
  const active = str(fd, "active") === "true";
  if (!userId) return { error: "Missing agent." };

  const db = sbAdmin();
  const { error } = await db
    .from("agent_profiles")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) return { error: error.message };

  // Open jobs would otherwise sit with someone who can no longer sign in.
  if (!active) {
    await db
      .from("bookings")
      .update({ assigned_agent_id: null, assigned_at: null })
      .eq("assigned_agent_id", userId)
      .in("status", ["assigned", "en_route", "arrived"]);
  }

  revalidatePath("/admin/agents");
  revalidatePath("/admin/bookings");
  return { ok: active ? "Agent reactivated." : "Agent deactivated and unassigned." };
}

export async function resetAgentPassword(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return { error: gate.error };

  const userId = str(fd, "user_id");
  const password = String(fd.get("password") ?? "");
  if (!userId) return { error: "Missing agent." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const { error } = await sbAdmin().auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };
  return { ok: "Password changed. Tell the agent their new one." };
}

/**
 * Permanent removal. Deliberately separate from deactivation and rarely the
 * right choice — `on delete set null` means the bookings survive, but they
 * lose all record of who collected them.
 */
export async function deleteAgent(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return { error: gate.error };

  const userId = str(fd, "user_id");
  if (!userId) return { error: "Missing agent." };

  const db = sbAdmin();
  await db.from("agent_profiles").delete().eq("user_id", userId);
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/agents");
  return { ok: "Agent removed." };
}

/* ── assignment ────────────────────────────────────────────────────── */

/**
 * Puts a booking on an agent's phone, and tells both of them.
 *
 * Passing a blank agent id unassigns, which is why this is one action rather
 * than two — the notification and status bookkeeping are identical in reverse.
 */
export async function assignAgent(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const gate = await assertAdmin();
  if (!gate.ok) return { error: gate.error };

  const bookingId = str(fd, "booking_id");
  const agentId = str(fd, "agent_id");
  if (!bookingId) return { error: "Missing booking." };

  const db = sbAdmin();
  const { data: booking } = await db
    .from("bookings")
    .select("*, slot:time_slots(*)")
    .eq("id", bookingId)
    .maybeSingle<BookingFull>();
  if (!booking) return { error: "That booking no longer exists." };

  if (!agentId) {
    await db
      .from("bookings")
      .update({
        assigned_agent_id: null,
        assigned_at: null,
        status: booking.status === "assigned" ? "confirmed" : booking.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);
    revalidatePath(`/admin/bookings/${bookingId}`);
    return { ok: "Unassigned." };
  }

  const { data: agent } = await db
    .from("agent_profiles")
    .select("*")
    .eq("user_id", agentId)
    .eq("is_active", true)
    .maybeSingle<AgentProfile>();
  if (!agent) return { error: "That agent is not available." };

  const { error } = await db
    .from("bookings")
    .update({
      assigned_agent_id: agentId,
      assigned_at: new Date().toISOString(),
      // Only advances a booking that hasn't already moved past assignment —
      // reassigning a job someone is already driving to must not rewind it.
      status: ["pending", "confirmed"].includes(booking.status)
        ? "assigned"
        : booking.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);
  if (error) return { error: error.message };

  await db.from("booking_events").insert({
    booking_id: bookingId,
    from_status: booking.status,
    to_status: "assigned",
    actor: "admin",
    note: `Assigned to ${agent.full_name}`,
  });

  const when = `${formatDate(booking.pickup_date)}, ${booking.slot ? formatSlot(booking.slot) : "TBC"}`;

  await enqueue({
    bookingId,
    templateKey: "agent_assigned_customer",
    audience: "customer",
    recipient: booking.phone,
    vars: {
      name: booking.name,
      code: booking.code,
      date: formatDate(booking.pickup_date),
      slot: booking.slot ? formatSlot(booking.slot) : "TBC",
      agentName: agent.full_name,
      agentPhone: agent.phone ?? site.phone,
      track: `${site.url}/b/${booking.token}`,
    },
  });

  if (agent.phone) {
    await enqueue({
      bookingId,
      templateKey: "job_assigned_agent",
      audience: "agent",
      recipient: agent.phone,
      vars: {
        code: booking.code,
        date: formatDate(booking.pickup_date),
        slot: booking.slot ? formatSlot(booking.slot) : "TBC",
        name: booking.name,
        phone: booking.phone,
        address: [booking.address_line, booking.landmark, booking.pincode]
          .filter(Boolean)
          .join(", "),
        agentUrl: `${site.url}/agent/j/${bookingId}`,
        when,
      },
    });
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  return { ok: `Assigned to ${agent.full_name}.` };
}

/** Used by the booking page's assign dropdown. */
export async function listActiveAgents(): Promise<AgentProfile[]> {
  const { data } = await sbAdmin()
    .from("agent_profiles")
    .select("*")
    .eq("is_active", true)
    .order("full_name")
    .returns<AgentProfile[]>();
  return data ?? [];
}

export { adminRecipient };
