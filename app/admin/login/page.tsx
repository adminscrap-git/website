import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage(props: PageProps<"/admin/login">) {
  const { next } = await props.searchParams;

  return (
    <div className="grid min-h-[80vh] place-items-center px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="display text-3xl">
          MINT<span className="text-coral">.</span>
        </p>
        <h1 className="display mt-6 text-4xl">Admin</h1>
        <p className="mt-2 text-base font-semibold text-ink-2">
          Signing in only proves who you are. Access comes from an admin profile.
        </p>

        <LoginForm next={typeof next === "string" ? next : "/admin"} />
      </div>
    </div>
  );
}
