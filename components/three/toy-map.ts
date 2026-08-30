/**
 * Which toy stands in for each category.
 *
 * Deliberately NOT a "use client" module. The server renders /pick and needs to
 * resolve this mapping before handing it to the client — and a server component
 * can't call a function that lives in a client module. Keeping the plain data
 * here, separate from the components in toys.tsx, lets both sides import it.
 */

export type ToyName =
  | "laptop"
  | "monitor"
  | "fridge"
  | "tv"
  | "ac"
  | "washing-machine"
  | "pipes"
  | "paper"
  | "bottle"
  | "battery"
  | "chair"
  | "crate";

export const CATEGORY_TOY: Record<string, ToyName> = {
  "e-waste": "laptop",
  appliances: "fridge",
  metal: "pipes",
  paper: "paper",
  plastic: "bottle",
  batteries: "battery",
  furniture: "chair",
};

/** Falls back to the crate for any category the client has since added. */
export function toyForCategory(slug: string): ToyName {
  return CATEGORY_TOY[slug] ?? "crate";
}
