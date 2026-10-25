import type { Metadata } from "next";
import { AgentLoginForm } from "@/components/agent/login-form";
import { LogoMark } from "@/components/site/logo";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function AgentLoginPage({ searchParams }: PageProps<"/agent/login">) {
  const next = (await searchParams).next;
  return (
    <div className="mx-auto grid min-h-[80vh] max-w-sm place-items-center px-5">
      <div className="w-full">
        <LogoMark className="h-16 w-16" />
        <h1 className="display mt-5 text-4xl">Squad sign in</h1>
        <p className="mt-2 text-base font-semibold text-ink-2">
          Use the email and password the office gave you.
        </p>
        <AgentLoginForm next={typeof next === "string" ? next : "/agent"} />
      </div>
    </div>
  );
}
