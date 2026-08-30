import type {
  AdminProfile,
  AdminRole,
  Actor,
  Booking,
  BookingEvent,
  BookingItem,
  BookingStatus,
  Category,
  Item,
  Pincode,
  TimeSlot,
  Unit,
} from "@/lib/db-types";

/**
 * The schema type supabase-js needs to type `.insert()` and `.update()`.
 *
 * Composed from the domain types rather than generated, which keeps it to one
 * screen. `Insert`/`Update` are `Partial<Row>`: the database enforces which
 * columns are required, and what this actually needs to catch is a misspelled
 * column name or the wrong type in one — which `Partial<Row>` does catch.
 *
 * If the schema outgrows this, replace the whole file with
 * `supabase gen types typescript --project-id <id>`.
 */
type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type SettingsRow = {
  key: string;
  value: unknown;
  updated_at: string;
};

type WaitlistRow = {
  id: string;
  pincode: string;
  phone: string;
  name: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      categories: Table<Category>;
      items: Table<Item>;
      time_slots: Table<TimeSlot>;
      serviceable_pincodes: Table<Pincode>;
      waitlist: Table<WaitlistRow>;
      bookings: Table<Booking>;
      booking_items: Table<BookingItem>;
      booking_events: Table<BookingEvent>;
      admin_profiles: Table<AdminProfile>;
      settings: Table<SettingsRow>;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      unit_kind: Unit;
      booking_status: BookingStatus;
      actor_kind: Actor;
      admin_role: AdminRole;
    };
    CompositeTypes: Record<never, never>;
  };
};
