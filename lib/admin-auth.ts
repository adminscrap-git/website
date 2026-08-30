import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { sbSession } from "@/lib/supabase/server";
import { sbAdmin } from "@/lib/supabase/admin";
import type { AdminProfile } from "@/lib/db-types";

/**
 * Who is signed in, and what they're allowed to do.
 *
 * Being a Supabase auth user grants nothing. Admin access requires a row in
 * `admin_profiles`, which only ever gets created by hand in the Supabase
 * dashboard (see supabase/migrations/0003_first_admin.sql). That means a stray
 * signup — or a leaked anon key — can't walk into the admin panel.
 */
export const currentAdmin = cache(async (): Promise<AdminProfile | null> => {
  const sb = await sbSession();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data } = await sbAdmin()
    .from("admin_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<AdminProfile>();

  return data ?? null;
});

/**
 * Gate for admin pages and actions.
 *
 * Pass "super_admin" for anything that touches money, settings or service area
 * — staff can work bookings all day but shouldn't be able to rewrite the rate
 * card.
 */
export async function requireAdmin(
  minimum: "staff" | "super_admin" = "staff",
): Promise<AdminProfile> {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  if (minimum === "super_admin" && admin.role !== "super_admin") {
    redirect("/admin?denied=1");
  }
  return admin;
}

/**
 * Same check for server actions, which must not redirect — they return an
 * error the calling component can show.
 */
export async function assertAdmin(
  minimum: "staff" | "super_admin" = "staff",
): Promise<{ ok: true; admin: AdminProfile } | { ok: false; error: string }> {
  const admin = await currentAdmin();
  if (!admin) return { ok: false, error: "You're signed out. Reload and sign in again." };
  if (minimum === "super_admin" && admin.role !== "super_admin") {
    return { ok: false, error: "Only a super admin can change that." };
  }
  return { ok: true, admin };
}

export const isSuper = (a: AdminProfile | null) => a?.role === "super_admin";
