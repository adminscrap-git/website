"use server";

import { redirect } from "next/navigation";
import { sbSession } from "@/lib/supabase/server";
import { sbAdmin } from "@/lib/supabase/admin";
import type { FormState } from "./admin";

/**
 * Admin sign in/out.
 *
 * Server actions can write cookies, so the whole session dance happens here —
 * no browser Supabase client, no anon key doing auth work in the page.
 */
export async function signIn(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const next = String(fd.get("next") ?? "/admin");

  // Every early return carries the email back, or the form clears it and the
  // next submit is swallowed by the browser's own required check.
  const keep = { email };

  if (!email || !password)
    return { error: "Enter your email and password.", values: keep };

  const sb = await sbSession();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  // Deliberately vague: don't confirm which half was wrong.
  if (error || !data.user)
    return { error: "That email and password don't match.", values: keep };

  // Authenticating isn't authorisation. Without an admin_profiles row this
  // account gets nothing, so sign it straight back out and say so.
  const { data: profile } = await sbAdmin()
    .from("admin_profiles")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!profile) {
    await sb.auth.signOut();
    return { error: "That account doesn't have admin access.", values: keep };
  }

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function signOut(): Promise<void> {
  const sb = await sbSession();
  await sb.auth.signOut();
  redirect("/admin/login");
}
