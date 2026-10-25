"use server";

import { revalidatePath } from "next/cache";
import { sbAdmin } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/admin-auth";
import { isValidPincode } from "@/lib/format";
import type { BookingStatus, Unit } from "@/lib/db-types";

/**
 * Admin mutations.
 *
 * All FormData-shaped so the forms work as plain HTML — a dropped connection
 * or a browser with JS off still lets someone mark a pickup complete. Every one
 * of them re-checks the caller's role: `proxy.ts` only proves you're signed in,
 * and a staff account must not be able to POST its way into the rate card.
 */

/**
 * What an action hands back to its form.
 *
 * `values` exists because React resets a `<form action={…}>` once the action
 * returns — so after a rejected sign in the email box is empty, the browser's
 * own `required` check silently blocks the next submit, and the button looks
 * dead. Echoing the typed values back as defaults is the fix. Never echo a
 * password.
 */
export type FormState = {
  error?: string;
  ok?: string;
  values?: Record<string, string>;
};

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => Number(fd.get(k) ?? 0);
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

// ── bookings ────────────────────────────────────────────────────────

export async function setBookingStatus(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const gate = await assertAdmin();
  if (!gate.ok) return { error: gate.error };

  const id = str(fd, "id");
  const to = str(fd, "status") as BookingStatus;
  const note = str(fd, "note") || null;

  const db = sbAdmin();
  const { data: current } = await db
    .from("bookings")
    .select("status")
    .eq("id", id)
    .maybeSingle<{ status: BookingStatus }>();

  if (!current) return { error: "That booking no longer exists." };
  if (current.status === to) return { ok: "No change." };

  const cancelling = to === "cancelled";
  if (cancelling && !note)
    return { error: "Give a reason before cancelling — the customer sees it." };

  const { error } = await db
    .from("bookings")
    .update({
      status: to,
      ...(cancelling
        ? {
            cancelled_at: new Date().toISOString(),
            cancelled_by: "admin" as const,
            cancel_reason: note,
          }
        : {}),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await db.from("booking_events").insert({
    booking_id: id,
    from_status: current.status,
    to_status: to,
    actor: "admin",
    note,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
  return { ok: `Marked ${to.replace("_", " ")}.` };
}

export async function saveAdminNotes(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const gate = await assertAdmin();
  if (!gate.ok) return { error: gate.error };

  const id = str(fd, "id");
  const { error } = await sbAdmin()
    .from("bookings")
    .update({ admin_notes: str(fd, "admin_notes") || null })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/admin/bookings/${id}`);
  return { ok: "Note saved." };
}

// ── categories ──────────────────────────────────────────────────────

export async function saveCategory(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return { error: gate.error };

  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "A category needs a name." };

  const row = {
    name,
    slug: str(fd, "slug") || slugify(name),
    description: str(fd, "description") || null,
    photo_url: str(fd, "photo_url") || null,
    sort_order: num(fd, "sort_order"),
    is_active: bool(fd, "is_active"),
  };

  const db = sbAdmin();
  const { error } = id
    ? await db.from("categories").update(row).eq("id", id)
    : await db.from("categories").insert(row);

  if (error) return { error: error.message };
  revalidateCatalogue();
  return { ok: id ? "Category updated." : "Category added." };
}

export async function deleteCategory(fd: FormData): Promise<void> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return;
  // Items cascade with the category; bookings keep their snapshots.
  await sbAdmin().from("categories").delete().eq("id", str(fd, "id"));
  revalidateCatalogue();
}

// ── items ───────────────────────────────────────────────────────────

export async function saveItem(_prev: FormState, fd: FormData): Promise<FormState> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return { error: gate.error };

  const id = str(fd, "id");
  const name = str(fd, "name");
  const categoryId = str(fd, "category_id");
  if (!name) return { error: "An item needs a name." };
  if (!categoryId) return { error: "Pick a category." };

  const priceMin = num(fd, "price_min");
  const priceMax = num(fd, "price_max");
  if (priceMin < 0 || priceMax < 0) return { error: "Prices can't be negative." };
  if (priceMax < priceMin)
    return { error: "The high price has to be at least the low one." };

  const row = {
    category_id: categoryId,
    name,
    slug: str(fd, "slug") || slugify(name),
    note: str(fd, "note") || null,
    photo_url: str(fd, "photo_url") || null,
    unit: (str(fd, "unit") || "kg") as Unit,
    price_min: priceMin,
    price_max: priceMax,
    sort_order: num(fd, "sort_order"),
    is_active: bool(fd, "is_active"),
  };

  const db = sbAdmin();
  const { error } = id
    ? await db.from("items").update(row).eq("id", id)
    : await db.from("items").insert(row);

  if (error) return { error: error.message };
  revalidateCatalogue();
  return {
    ok: id
      ? "Item updated. Past bookings keep the price they were quoted."
      : "Item added.",
  };
}

export async function deleteItem(fd: FormData): Promise<void> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return;
  // booking_items.item_id is ON DELETE SET NULL — history survives this.
  await sbAdmin().from("items").delete().eq("id", str(fd, "id"));
  revalidateCatalogue();
}

export async function toggleItem(fd: FormData): Promise<void> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return;
  await sbAdmin()
    .from("items")
    .update({ is_active: bool(fd, "next") })
    .eq("id", str(fd, "id"));
  revalidateCatalogue();
}

// ── slots ───────────────────────────────────────────────────────────

export async function saveSlot(_prev: FormState, fd: FormData): Promise<FormState> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return { error: gate.error };

  const id = str(fd, "id");
  const label = str(fd, "label");
  const start = str(fd, "start_time");
  const end = str(fd, "end_time");
  if (!label) return { error: "A window needs a label." };
  if (!start || !end) return { error: "Set a start and end time." };
  if (end <= start) return { error: "The window has to end after it starts." };

  const capacity = num(fd, "capacity");
  if (capacity < 1) return { error: "Capacity has to be at least 1." };

  const row = {
    label,
    start_time: start,
    end_time: end,
    capacity,
    sort_order: num(fd, "sort_order"),
    is_active: bool(fd, "is_active"),
  };

  const db = sbAdmin();
  const { error } = id
    ? await db.from("time_slots").update(row).eq("id", id)
    : await db.from("time_slots").insert(row);

  if (error) return { error: error.message };
  revalidatePath("/admin/slots");
  revalidatePath("/book");
  return { ok: id ? "Window updated." : "Window added." };
}

export async function deleteSlot(fd: FormData): Promise<void> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return;
  // bookings.slot_id is ON DELETE RESTRICT, so this fails loudly for a window
  // that has bookings against it. Deactivate those instead of deleting.
  await sbAdmin().from("time_slots").delete().eq("id", str(fd, "id"));
  revalidatePath("/admin/slots");
  revalidatePath("/book");
}

// ── service area ────────────────────────────────────────────────────

export async function addPincode(_prev: FormState, fd: FormData): Promise<FormState> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return { error: gate.error };

  const pincode = str(fd, "pincode");
  if (!isValidPincode(pincode)) return { error: "That isn't a valid 6-digit pincode." };

  const { error } = await sbAdmin()
    .from("serviceable_pincodes")
    .insert({ pincode, area_name: str(fd, "area_name") || null });

  if (error)
    return {
      error: error.code === "23505" ? "That pincode is already on the list." : error.message,
    };

  revalidatePath("/admin/pincodes");
  revalidatePath("/book");
  return { ok: `Now collecting from ${pincode}.` };
}

export async function togglePincode(fd: FormData): Promise<void> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return;
  await sbAdmin()
    .from("serviceable_pincodes")
    .update({ is_active: bool(fd, "next") })
    .eq("id", str(fd, "id"));
  revalidatePath("/admin/pincodes");
  revalidatePath("/book");
}

export async function deletePincode(fd: FormData): Promise<void> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return;
  await sbAdmin().from("serviceable_pincodes").delete().eq("id", str(fd, "id"));
  revalidatePath("/admin/pincodes");
  revalidatePath("/book");
}

// ── settings ────────────────────────────────────────────────────────

export async function saveBusinessSettings(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return { error: gate.error };

  const whatsapp = str(fd, "whatsapp").replace(/\D/g, "");
  if (whatsapp && !/^\d{10,14}$/.test(whatsapp))
    return { error: "WhatsApp number should be digits with the country code, e.g. 919876543210." };

  const value = {
    name: str(fd, "name"),
    tagline: str(fd, "tagline"),
    city: str(fd, "city"),
    phone: str(fd, "phone"),
    whatsapp,
    email: str(fd, "email"),
    address: str(fd, "address"),
    maps_url: str(fd, "maps_url"),
  };

  const { error } = await sbAdmin()
    .from("settings")
    .upsert({ key: "business", value }, { onConflict: "key" });

  if (error) return { error: error.message };
  revalidateAll();
  return { ok: "Business details saved." };
}

export async function saveBookingSettings(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return { error: gate.error };

  const maxDays = num(fd, "max_days_ahead");
  if (maxDays < 1 || maxDays > 90)
    return { error: "Booking window should be between 1 and 90 days." };

  const value = {
    min_pickup_value: Math.max(0, num(fd, "min_pickup_value")),
    cancel_cutoff_hours: Math.max(0, num(fd, "cancel_cutoff_hours")),
    max_days_ahead: maxDays,
    show_estimate: bool(fd, "show_estimate"),
  };

  const { error } = await sbAdmin()
    .from("settings")
    .upsert({ key: "booking", value }, { onConflict: "key" });

  if (error) return { error: error.message };
  revalidateAll();
  return { ok: "Booking rules saved." };
}

export async function saveTemplates(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return { error: gate.error };

  const db = sbAdmin();
  const { error } = await db.from("settings").upsert(
    [
      { key: "wa_confirm", value: str(fd, "wa_confirm") },
      { key: "wa_status", value: str(fd, "wa_status") },
    ],
    { onConflict: "key" },
  );

  if (error) return { error: error.message };
  revalidateAll();
  return { ok: "Message templates saved." };
}

// ── service area ────────────────────────────────────────────────────

/**
 * The depot pin and how far the van goes.
 *
 * Bounds are enforced here, not just in the number inputs: this is a settings
 * row that decides whether a customer can book at all, and a radius of 0 or a
 * latitude of 900 would quietly refuse everybody.
 */
export async function saveServiceArea(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return { error: gate.error };

  const lat = num(fd, "depot_lat");
  const lng = num(fd, "depot_lng");
  const radius = num(fd, "radius_km");
  const label = str(fd, "label") || "our service area";

  if (!Number.isFinite(lat) || lat < -90 || lat > 90)
    return { error: "Latitude must be between -90 and 90." };
  if (!Number.isFinite(lng) || lng < -180 || lng > 180)
    return { error: "Longitude must be between -180 and 180." };
  if (!Number.isFinite(radius) || radius < 1 || radius > 100)
    return { error: "Radius must be between 1 and 100 km." };

  // Upsert, not update: the `area` row does not exist on a database seeded
  // before 0007, and an update matching nothing fails silently.
  const { error } = await sbAdmin()
    .from("settings")
    .upsert(
      {
        key: "area",
        value: { depot_lat: lat, depot_lng: lng, radius_km: radius, label },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

  if (error) return { error: error.message };

  revalidatePath("/admin/pincodes");
  revalidatePath("/book");
  return { ok: `Saving within ${radius} km of that pin.` };
}

// ── revalidation ────────────────────────────────────────────────────

function revalidateCatalogue() {
  revalidatePath("/admin/catalogue");
  revalidatePath("/rates");
  revalidatePath("/");
}

function revalidateAll() {
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

// ── photos ──────────────────────────────────────────────────────────

const MAX_PHOTO = 3 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Uploads one catalogue photo and returns its public URL.
 *
 * Validated here as well as on the bucket: the bucket rules are the backstop,
 * but a 4MB upload that fails at the storage layer gives the admin a cryptic
 * error instead of a useful one.
 */
export async function uploadPhoto(
  fd: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const gate = await assertAdmin("super_admin");
  if (!gate.ok) return { ok: false, error: gate.error };

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Pick an image first." };
  if (file.size > MAX_PHOTO)
    return { ok: false, error: "That image is over 3MB. Compress it and try again." };
  if (!PHOTO_TYPES.includes(file.type))
    return { ok: false, error: "Use a JPEG, PNG, WebP or AVIF." };

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  // Random name: two admins uploading "photo.jpg" must not collide, and the
  // original filename is not worth preserving.
  const path = `${str(fd, "prefix") || "item"}/${crypto.randomUUID()}.${ext}`;

  const db = sbAdmin();
  const { error } = await db.storage
    .from("catalogue")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { ok: false, error: error.message };

  const { data } = db.storage.from("catalogue").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
