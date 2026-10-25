/**
 * The 3D palette, mirroring the CSS tokens in app/globals.css.
 *
 * Duplicated deliberately: three.js can't read CSS custom properties, and
 * plumbing them through would cost more than keeping ten hex values in sync.
 * If these drift from globals.css, globals.css wins.
 */
export const C = {
  paper: "#fdf6ec",
  paper2: "#f6ebd8",
  paper3: "#e7d9bf",
  ink: "#14130f",
  ink2: "#5a5343",
  cobalt: "#145a32",
  cobaltDeep: "#0d3d21",
  cobaltSoft: "#dceae0",
  coral: "#f5a623",
  coralDeep: "#8a5a12",
  coralSoft: "#fce9c6",
  sun: "#e8b53d",
  sunSoft: "#fbefd3",
  chrome: "#cfd3d8",
} as const;

/** Matte toy plastic. One look for every object in the world. */
export const TOY_MATERIAL = { roughness: 0.42, metalness: 0.02 } as const;

/** Brushed metal, for the few parts that shouldn't read as plastic. */
export const METAL_MATERIAL = { roughness: 0.3, metalness: 0.75 } as const;
