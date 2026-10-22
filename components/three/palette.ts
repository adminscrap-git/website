/**
 * The 3D palette, mirroring the CSS tokens in app/globals.css.
 *
 * Duplicated deliberately: three.js can't read CSS custom properties, and
 * plumbing them through would cost more than keeping ten hex values in sync.
 * If these drift from globals.css, globals.css wins.
 */
export const C = {
  paper: "#ffffff",
  paper2: "#f1f8f4",
  paper3: "#dbeae1",
  ink: "#0b0b0b",
  ink2: "#4a5a52",
  cobalt: "#047857",
  cobaltDeep: "#065f46",
  cobaltSoft: "#d1fae5",
  coral: "#10b981",
  coralDeep: "#047857",
  coralSoft: "#d1fae5",
  sun: "#ffc53d",
  sunSoft: "#fff0cc",
  chrome: "#cfd3d8",
} as const;

/** Matte toy plastic. One look for every object in the world. */
export const TOY_MATERIAL = { roughness: 0.42, metalness: 0.02 } as const;

/** Brushed metal, for the few parts that shouldn't read as plastic. */
export const METAL_MATERIAL = { roughness: 0.3, metalness: 0.75 } as const;
