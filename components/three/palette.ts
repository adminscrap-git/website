/**
 * The 3D palette, mirroring the CSS tokens in app/globals.css.
 *
 * Duplicated deliberately: three.js can't read CSS custom properties, and
 * plumbing them through would cost more than keeping ten hex values in sync.
 * If these drift from globals.css, globals.css wins.
 */
export const C = {
  paper: "#f7f3ec",
  paper2: "#efe8dc",
  paper3: "#e2d9c8",
  ink: "#0b0b0b",
  ink2: "#57534a",
  cobalt: "#1b3bff",
  cobaltDeep: "#0f23a8",
  cobaltSoft: "#dfe3ff",
  coral: "#ff5c39",
  coralDeep: "#d93d1c",
  coralSoft: "#ffe2da",
  sun: "#ffc53d",
  sunSoft: "#fff0cc",
  chrome: "#cfd3d8",
} as const;

/** Matte toy plastic. One look for every object in the world. */
export const TOY_MATERIAL = { roughness: 0.42, metalness: 0.02 } as const;

/** Brushed metal, for the few parts that shouldn't read as plastic. */
export const METAL_MATERIAL = { roughness: 0.3, metalness: 0.75 } as const;
