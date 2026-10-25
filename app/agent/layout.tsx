import type { Metadata } from "next";
import Link from "next/link";
import { currentAgent } from "@/lib/agent-auth";
import { agentSignOut } from "@/app/actions/field";
import { LogoMark } from "@/components/site/logo";

export const metadata: Metadata = {
  title: { default: "Squad", template: "%s · ScrapSquad" },
  // Never indexable. It lists customer addresses and phone numbers.
  robots: { index: false, follow: false },
};

/**
 * The field app.
 *
 * Built for one hand on a phone in a car park, not for a desk: a single
 * column, large tap targets, and no table anywhere. It deliberately does not
 * reuse the admin shell — that layout is desktop-shaped and carries nav to
 * rates, settings and the full booking list, none of which an agent should be
 * one mis-click from.
 */
export default async function AgentLayout({ children }: LayoutProps<"/agent">) {
  const agent = await currentAgent();

  // The login page renders inside this layout too, before there's an agent.
  if (!agent) return <div className="flex-1">{children}</div>;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-paper-2">
      <header className="sticky top-0 z-40 border-b-2 border-paper-3 bg-paper">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
          <Link href="/agent" className="flex items-center gap-2 text-cobalt">
            <LogoMark className="h-8 w-8" />
            <span className="display text-lg leading-none">Squad</span>
          </Link>

          <div className="ml-auto text-right">
            <p className="text-sm font-bold leading-tight">{agent.full_name}</p>
            <form action={agentSignOut}>
              <button className="readout text-[10px] uppercase tracking-[0.12em] text-ink-3 underline underline-offset-2">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-5 pb-24">{children}</main>
    </div>
  );
}
