import { requireAdmin } from "@/lib/admin-auth";
import { getSettings } from "@/lib/queries";
import { Panel } from "@/components/admin/ui";
import {
  BookingRulesForm,
  BusinessForm,
  TemplatesForm,
} from "@/components/admin/ops-forms";

export default async function SettingsPage() {
  await requireAdmin("super_admin");
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="display text-4xl">Settings</h1>
        <p className="mt-1.5 max-w-2xl text-base font-semibold text-ink-2">
          Everything here takes effect on the live site as soon as you save. No
          deploy needed.
        </p>
      </header>

      <div className="mt-8 space-y-3">
        <Panel
          title="Business details"
          description="Used across the site, in metadata, and in every WhatsApp link."
        >
          <BusinessForm value={settings.business} />
        </Panel>

        <Panel
          title="Booking rules"
          description="The numbers behind the booking form and the cancellation window."
        >
          <BookingRulesForm value={settings.booking} />
        </Panel>

        <Panel
          title="WhatsApp templates"
          description="Placeholders are filled in before the message opens."
        >
          <TemplatesForm
            confirm={settings.wa_confirm}
            status={settings.wa_status}
          />
        </Panel>

        <Panel
          title="Admin accounts"
          description="Managed in Supabase, on purpose."
        >
          <div className="space-y-3 text-sm font-semibold text-ink-2">
            <p>
              Admin access needs a row in <code className="font-mono">admin_profiles</code>
              . Signing up alone grants nothing, so a stray account — or a leaked
              anon key — can&apos;t reach this panel.
            </p>
            <p>
              To add someone: Supabase → Authentication → Users → Add user (tick
              &ldquo;Auto Confirm&rdquo;), then run the insert in{" "}
              <code className="font-mono">
                supabase/migrations/0003_first_admin.sql
              </code>{" "}
              with their email and the role you want.
            </p>
            <p>
              <strong className="text-ink">Staff</strong> can work bookings.{" "}
              <strong className="text-ink">Super admin</strong> additionally gets
              the catalogue, windows, service area and this page.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
