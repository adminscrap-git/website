import "server-only";
import { cache } from "react";
import { sbPublic } from "@/lib/supabase/public";
import { normalisePhone } from "@/lib/format";
import { sbAdmin } from "@/lib/supabase/admin";
import type {
  Category,
  CategoryWithItems,
  Item,
  Pincode,
  SettingsMap,
  TimeSlot,
} from "@/lib/db-types";

/**
 * Public reads. Everything here goes through the anon key and is therefore
 * limited by RLS to active catalogue rows — which is exactly the intent.
 *
 * `cache()` dedups within a single render pass. No cross-request caching yet:
 * these are small queries against small tables, and stale rates are worse than
 * a few extra milliseconds. Add `unstable_cache` if the catalogue ever grows
 * enough to show up in a trace.
 */

export const getCatalogue = cache(async (): Promise<CategoryWithItems[]> => {
  const { data, error } = await sbPublic()
    .from("categories")
    .select("*, items(*)")
    .eq("is_active", true)
    .eq("items.is_active", true)
    .order("sort_order", { ascending: true })
    .order("sort_order", { referencedTable: "items", ascending: true })
    .returns<CategoryWithItems[]>();

  if (error) throw new Error(`getCatalogue: ${error.message}`);
  // A category whose items are all deactivated shouldn't show an empty shelf.
  return (data ?? []).filter((c) => c.items.length > 0);
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const { data, error } = await sbPublic()
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .returns<Category[]>();

  if (error) throw new Error(`getCategories: ${error.message}`);
  return data ?? [];
});

export const getSlots = cache(async (): Promise<TimeSlot[]> => {
  const { data, error } = await sbPublic()
    .from("time_slots")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .returns<TimeSlot[]>();

  if (error) throw new Error(`getSlots: ${error.message}`);
  return data ?? [];
});

export const getPincodes = cache(async (): Promise<Pincode[]> => {
  const { data, error } = await sbPublic()
    .from("serviceable_pincodes")
    .select("*")
    .eq("is_active", true)
    .order("pincode")
    .returns<Pincode[]>();

  if (error) throw new Error(`getPincodes: ${error.message}`);
  return data ?? [];
});

/** Look up items by id for the booking action's price snapshot. */
export async function getItemsByIds(
  ids: string[],
): Promise<(Item & { categories: { name: string } | null })[]> {
  if (ids.length === 0) return [];
  const { data, error } = await sbPublic()
    .from("items")
    .select("*, categories(name)")
    .in("id", ids)
    .eq("is_active", true)
    .returns<(Item & { categories: { name: string } | null })[]>();

  if (error) throw new Error(`getItemsByIds: ${error.message}`);
  return data ?? [];
}

// ── settings ────────────────────────────────────────────────────────

/**
 * Defaults matching 0002_seed.sql. Used when a key is missing so a partially
 * seeded database renders instead of throwing.
 */
export const SETTINGS_DEFAULTS: SettingsMap = {
  business: {
    name: "ScrapSquad",
    tagline: "Your scrap. Our squad.",
    city: "Hyderabad",
    phone: "+91 95153 21371",
    whatsapp: "919515321371",
    email: "hello@scrapsquad.example",
    address: "",
    maps_url: "",
  },
  // Hyderabad city centre until the office sets its own depot pin.
  area: {
    depot_lat: 17.385,
    depot_lng: 78.4867,
    radius_km: 15,
    label: "Hyderabad",
  },
  booking: {
    min_pickup_value: 300,
    cancel_cutoff_hours: 2,
    max_days_ahead: 14,
    show_estimate: true,
  },
  wa_confirm:
    "Hi ScrapSquad — confirming my scrap pickup.\n\nBooking: {{code}}\nWhen: {{date}}, {{slot}}\nItems: {{items}}\nAddress: {{address}}\n{{maps}}\n\nTrack or cancel: {{track}}",
  wa_status:
    "Hi {{name}}, this is ScrapSquad about pickup {{code}} on {{date}} ({{slot}}).\n\nStatus: {{status}}\n\nTrack or cancel: {{track}}",
  impact: {
    trees_per_kg_paper: 0.017,
    litres_water_per_kg_paper: 30,
    kwh_per_kg_metal: 9,
    kg_co2_per_kg_ewaste: 1.4,
  },
};

/**
 * Settings live behind RLS deny-all, so this uses the service role. That's
 * fine — it only ever runs on the server, and the values are all non-secret
 * business copy.
 */
export const getSettings = cache(async (): Promise<SettingsMap> => {
  const { data, error } = await sbAdmin()
    .from("settings")
    .select("key, value")
    .returns<{ key: keyof SettingsMap; value: unknown }[]>();

  if (error) throw new Error(`getSettings: ${error.message}`);

  const out = { ...SETTINGS_DEFAULTS };
  for (const row of data ?? []) {
    if (row.key in out) {
      const fallback = SETTINGS_DEFAULTS[row.key];
      // Objects merge so a partially-filled row keeps its defaults;
      // strings (the WhatsApp templates) replace outright.
      out[row.key] =
        typeof fallback === "object" && fallback !== null
          ? ({ ...fallback, ...(row.value as object) } as never)
          : (row.value as never);
    }
  }

  // The admin panel accepts whatever is typed into the WhatsApp field, and a
  // 10-digit number there produces a wa.me link that silently goes nowhere.
  // Normalising here covers every caller at once — several pages build their
  // own wa.me href straight off `business.whatsapp`.
  out.business.whatsapp =
    normalisePhone(out.business.whatsapp) || SETTINGS_DEFAULTS.business.whatsapp;
  return out;
});
