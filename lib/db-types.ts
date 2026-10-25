/**
 * Domain types mirroring supabase/migrations/0001_init.sql.
 *
 * Deliberately hand-written rather than generated: the generated `Database`
 * shape is ~300 lines of Row/Insert/Update/Relationships boilerplate for the
 * same safety we get from `.returns<T>()` at the query site. If the schema
 * grows past what one person can hold in their head, switch to
 * `supabase gen types typescript` and delete this file.
 */

export type Unit = "kg" | "piece" | "unit" | "set";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "en_route"
  | "arrived"
  | "picked_up"
  | "completed"
  | "cancelled";

export type Actor = "customer" | "admin" | "system" | "agent";
export type AdminRole = "super_admin" | "staff";

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Item = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  note: string | null;
  photo_url: string | null;
  unit: Unit;
  price_min: number;
  price_max: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

/** A category with its items nested, as returned by the catalogue query. */
export type CategoryWithItems = Category & { items: Item[] };

export type TimeSlot = {
  id: string;
  label: string;
  /** "09:00:00" */
  start_time: string;
  end_time: string;
  capacity: number;
  sort_order: number;
  is_active: boolean;
};

export type Pincode = {
  id: string;
  pincode: string;
  area_name: string | null;
  is_active: boolean;
  created_at: string;
};

export type Booking = {
  id: string;
  code: string;
  token: string;
  name: string;
  phone: string;
  email: string | null;
  address_line: string;
  landmark: string | null;
  pincode: string;
  maps_url: string | null;
  pickup_date: string;
  slot_id: string;
  status: BookingStatus;
  free_text_items: string | null;
  estimate_min: number;
  estimate_max: number;
  customer_notes: string | null;
  admin_notes: string | null;
  cancelled_at: string | null;
  cancelled_by: Actor | null;
  cancel_reason: string | null;

  // ── field ops (0007) ──
  assigned_agent_id: string | null;
  assigned_at: string | null;
  arrived_at: string | null;
  gate_approved_at: string | null;
  /** What the scale actually said, in kg. Null until the agent records it. */
  collected_weight: number | null;
  paid_amount: number | null;
  payment_method: string | null;

  created_at: string;
  updated_at: string;
};

export type BookingItem = {
  id: string;
  booking_id: string;
  item_id: string | null;
  name_snapshot: string;
  category_name_snapshot: string | null;
  unit_snapshot: Unit;
  price_min_snapshot: number;
  price_max_snapshot: number;
  qty: number;
};

export type BookingEvent = {
  id: string;
  booking_id: string;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  actor: Actor;
  note: string | null;
  created_at: string;
};

/** What /b/[token] and the admin detail view both need. */
export type BookingFull = Booking & {
  slot: TimeSlot | null;
  booking_items: BookingItem[];
};

export type AdminProfile = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: AdminRole;
  created_at: string;
};

// ── field ops ───────────────────────────────────────────────────────

/**
 * A pickup agent. Separate from AdminProfile on purpose — see the note in
 * 0007_field_ops.sql. Holding one of these grants /agent and nothing else.
 */
export type AgentProfile = {
  user_id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PhotoKind = "scrap" | "payment_proof" | "other";

export type BookingPhoto = {
  id: string;
  booking_id: string;
  kind: PhotoKind;
  storage_path: string;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type NotificationChannel = "whatsapp" | "sms" | "email";
export type NotificationStatus = "queued" | "sent" | "failed" | "skipped";
export type Audience = "customer" | "admin" | "agent";

export type Notification = {
  id: string;
  booking_id: string | null;
  template_key: string;
  audience: Audience;
  channel: NotificationChannel;
  recipient: string;
  body: string;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  provider: string | null;
  provider_id: string | null;
  error: string | null;
  attempts: number;
  created_at: string;
  sent_at: string | null;
};

export const PHOTO_LABEL: Record<PhotoKind, string> = {
  scrap: "Scrap collected",
  payment_proof: "Payment proof",
  other: "Other",
};

// ── settings ────────────────────────────────────────────────────────

export type BusinessSettings = {
  name: string;
  tagline: string;
  city: string;
  phone: string;
  /** Digits only with country code — wa.me format. */
  whatsapp: string;
  email: string;
  address: string;
  maps_url: string;
};

export type BookingSettings = {
  min_pickup_value: number;
  cancel_cutoff_hours: number;
  max_days_ahead: number;
  show_estimate: boolean;
};

export type ImpactSettings = {
  trees_per_kg_paper: number;
  litres_water_per_kg_paper: number;
  kwh_per_kg_metal: number;
  kg_co2_per_kg_ewaste: number;
};

export type SettingsMap = {
  business: BusinessSettings;
  booking: BookingSettings;
  wa_confirm: string;
  wa_status: string;
  impact: ImpactSettings;
};

export const STATUS_FLOW: BookingStatus[] = [
  "pending",
  "confirmed",
  "assigned",
  "en_route",
  "arrived",
  "picked_up",
  "completed",
];

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  assigned: "Agent assigned",
  en_route: "On the way",
  arrived: "At your gate",
  picked_up: "Picked up",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** The subset an agent can set from the field, in the order they happen. */
export const AGENT_STATUS_FLOW: BookingStatus[] = [
  "en_route",
  "arrived",
  "picked_up",
  "completed",
];

/** Short label for the unit, as it reads next to a price. */
export const UNIT_LABEL: Record<Unit, string> = {
  kg: "per kg",
  piece: "per piece",
  unit: "per unit",
  set: "per set",
};

/** How a quantity of this unit reads on its own. */
export const UNIT_SHORT: Record<Unit, string> = {
  kg: "kg",
  piece: "pcs",
  unit: "units",
  set: "sets",
};
