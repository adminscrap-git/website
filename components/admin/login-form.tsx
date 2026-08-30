"use client";

import { useActionState } from "react";
import { signIn } from "@/app/actions/auth";
import { AdminField, FormMessage, SubmitButton, adminInput } from "./ui";
import type { FormState } from "@/app/actions/admin";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<FormState, FormData>(signIn, {});

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={next} />

      <AdminField label="Email">
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className={adminInput}
          placeholder="you@yourcompany.com"
        />
      </AdminField>

      <AdminField label="Password">
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={adminInput}
        />
      </AdminField>

      <SubmitButton pendingLabel="Signing in…" className="w-full py-3">
        Sign in
      </SubmitButton>

      <FormMessage state={state} />
    </form>
  );
}
