"use client";

import { RoundedBox } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { C, METAL_MATERIAL, TOY_MATERIAL } from "./palette";
import type { ToyName } from "./toy-map";

/**
 * The scrap objects, built entirely from primitives.
 *
 * No GLB files, no Blender, no asset pipeline, nothing to download at runtime.
 * Each toy is thirty-odd lines of boxes and cylinders, which is both cheaper to
 * ship than a model and far easier to restyle when the palette changes.
 *
 * All toys are authored to roughly fit a 2-unit cube and sit on y=0, so any of
 * them can be dropped into any scene without per-object camera fiddling.
 */

type ToyProps = ThreeElements["group"] & { tint?: string };

// ── e-waste ─────────────────────────────────────────────────────────

export function Laptop({ tint = C.cobalt, ...p }: ToyProps) {
  return (
    <group {...p}>
      {/* base */}
      <RoundedBox args={[1.6, 0.12, 1.1]} radius={0.05} smoothness={3} position={[0, 0.06, 0]}>
        <meshStandardMaterial color={tint} {...TOY_MATERIAL} />
      </RoundedBox>
      {/* keyboard well */}
      <mesh position={[0, 0.125, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.3, 0.7]} />
        <meshStandardMaterial color={C.ink} roughness={0.8} />
      </mesh>
      {/* lid, hinged open */}
      <group position={[0, 0.12, -0.55]} rotation={[-1.15, 0, 0]}>
        <RoundedBox args={[1.6, 1.05, 0.08]} radius={0.04} smoothness={3} position={[0, 0.52, 0]}>
          <meshStandardMaterial color={tint} {...TOY_MATERIAL} />
        </RoundedBox>
        <mesh position={[0, 0.52, 0.05]}>
          <planeGeometry args={[1.4, 0.85]} />
          <meshStandardMaterial color={C.paper} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

export function Monitor({ tint = C.ink, ...p }: ToyProps) {
  return (
    <group {...p}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.45, 0.5, 0.1, 24]} />
        <meshStandardMaterial color={tint} {...TOY_MATERIAL} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.16, 0.7, 0.14]} />
        <meshStandardMaterial color={tint} {...TOY_MATERIAL} />
      </mesh>
      <RoundedBox args={[1.9, 1.15, 0.12]} radius={0.06} smoothness={3} position={[0, 1.32, 0]}>
        <meshStandardMaterial color={tint} {...TOY_MATERIAL} />
      </RoundedBox>
      <mesh position={[0, 1.32, 0.07]}>
        <planeGeometry args={[1.72, 0.97]} />
        <meshStandardMaterial color={C.cobaltSoft} roughness={0.25} />
      </mesh>
    </group>
  );
}

// ── appliances ──────────────────────────────────────────────────────

export function Fridge({ tint = C.paper2, ...p }: ToyProps) {
  return (
    <group {...p}>
      <RoundedBox args={[1.15, 2, 1]} radius={0.12} smoothness={4} position={[0, 1, 0]}>
        <meshStandardMaterial color={tint} {...TOY_MATERIAL} />
      </RoundedBox>
      {/* door seam — a thin dark slab rather than a texture */}
      <mesh position={[0, 1.28, 0.505]}>
        <planeGeometry args={[1.15, 0.03]} />
        <meshStandardMaterial color={C.ink2} roughness={0.9} />
      </mesh>
      {/* handles */}
      {[1.75, 0.95].map((y) => (
        <mesh key={y} position={[0.42, y, 0.53]}>
          <capsuleGeometry args={[0.045, 0.34, 4, 12]} />
          <meshStandardMaterial color={C.chrome} {...METAL_MATERIAL} />
        </mesh>
      ))}
      {/* feet */}
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, 0.03, 0.35]}>
          <cylinderGeometry args={[0.07, 0.07, 0.06, 12]} />
          <meshStandardMaterial color={C.ink} {...TOY_MATERIAL} />
        </mesh>
      ))}
    </group>
  );
}

export function TV({ tint = C.coral, ...p }: ToyProps) {
  return (
    <group {...p}>
      <RoundedBox args={[1.7, 1.35, 1.05]} radius={0.14} smoothness={4} position={[0, 0.85, 0]}>
        <meshStandardMaterial color={tint} {...TOY_MATERIAL} />
      </RoundedBox>
      {/* screen, inset */}
      <RoundedBox args={[1.3, 0.98, 0.06]} radius={0.08} smoothness={3} position={[0, 0.9, 0.53]}>
        <meshStandardMaterial color={C.cobaltSoft} roughness={0.2} />
      </RoundedBox>
      {/* dials */}
      {[0.62, 0.4].map((y) => (
        <mesh key={y} position={[0.72, y + 0.3, 0.53]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.05, 16]} />
          <meshStandardMaterial color={C.sun} {...TOY_MATERIAL} />
        </mesh>
      ))}
      {/* legs */}
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.1, 0]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]}>
          <cylinderGeometry args={[0.055, 0.04, 0.34, 10]} />
          <meshStandardMaterial color={C.ink} {...TOY_MATERIAL} />
        </mesh>
      ))}
      {/* antenna */}
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x * 0.35, 1.75, 0]} rotation={[0, 0, x * 0.5]}>
          <cylinderGeometry args={[0.018, 0.018, 0.9, 8]} />
          <meshStandardMaterial color={C.chrome} {...METAL_MATERIAL} />
        </mesh>
      ))}
    </group>
  );
}

export function AC({ tint = C.paper, ...p }: ToyProps) {
  return (
    <group {...p}>
      <RoundedBox args={[2.2, 0.72, 0.62]} radius={0.22} smoothness={4} position={[0, 0.36, 0]}>
        <meshStandardMaterial color={tint} {...TOY_MATERIAL} />
      </RoundedBox>
      {/* louvre slats */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.22 - i * 0.09, 0.3]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[1.85, 0.05, 0.12]} />
          <meshStandardMaterial color={C.ink2} roughness={0.75} />
        </mesh>
      ))}
      <mesh position={[0.82, 0.55, 0.315]}>
        <circleGeometry args={[0.05, 16]} />
        <meshStandardMaterial color={C.cobalt} roughness={0.3} />
      </mesh>
    </group>
  );
}

export function WashingMachine({ tint = C.paper2, ...p }: ToyProps) {
  return (
    <group {...p}>
      <RoundedBox args={[1.25, 1.5, 1.15]} radius={0.13} smoothness={4} position={[0, 0.75, 0]}>
        <meshStandardMaterial color={tint} {...TOY_MATERIAL} />
      </RoundedBox>
      {/* door ring + glass */}
      <mesh position={[0, 0.68, 0.58]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.36, 0.07, 12, 28]} />
        <meshStandardMaterial color={C.ink} {...TOY_MATERIAL} />
      </mesh>
      <mesh position={[0, 0.68, 0.6]}>
        <circleGeometry args={[0.34, 28]} />
        <meshStandardMaterial color={C.cobalt} roughness={0.18} />
      </mesh>
      {/* control panel */}
      <mesh position={[0, 1.32, 0.585]}>
        <planeGeometry args={[1.0, 0.2]} />
        <meshStandardMaterial color={C.ink2} roughness={0.8} />
      </mesh>
      <mesh position={[0.36, 1.32, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
        <meshStandardMaterial color={C.sun} {...TOY_MATERIAL} />
      </mesh>
    </group>
  );
}

// ── metal ───────────────────────────────────────────────────────────

export function PipeStack({ tint = C.chrome, ...p }: ToyProps) {
  const row = [-0.46, 0, 0.46];
  return (
    <group {...p}>
      {row.map((x) => (
        <mesh key={`b${x}`} position={[x, 0.23, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.23, 0.23, 1.8, 20, 1, true]} />
          <meshStandardMaterial color={tint} {...METAL_MATERIAL} side={2} />
        </mesh>
      ))}
      {[-0.23, 0.23].map((x) => (
        <mesh key={`t${x}`} position={[x, 0.63, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.23, 0.23, 1.8, 20, 1, true]} />
          <meshStandardMaterial color={C.cobalt} {...METAL_MATERIAL} side={2} />
        </mesh>
      ))}
      <mesh position={[0, 1.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.23, 0.23, 1.8, 20, 1, true]} />
        <meshStandardMaterial color={C.coral} {...METAL_MATERIAL} side={2} />
      </mesh>
    </group>
  );
}

// ── paper ───────────────────────────────────────────────────────────

export function PaperStack({ tint = C.paper2, ...p }: ToyProps) {
  const sheets = [0, 1, 2, 3, 4];
  return (
    <group {...p}>
      {sheets.map((i) => (
        <RoundedBox
          key={i}
          args={[1.5, 0.14, 1.05]}
          radius={0.02}
          smoothness={2}
          position={[0, 0.08 + i * 0.15, 0]}
          rotation={[0, (i % 2 === 0 ? 1 : -1) * (0.06 + i * 0.02), 0]}
        >
          <meshStandardMaterial
            color={i === 2 ? C.sun : i === 4 ? C.coral : tint}
            roughness={0.85}
          />
        </RoundedBox>
      ))}
      {/* twine */}
      <mesh position={[0, 0.42, 0]}>
        <torusGeometry args={[0.56, 0.028, 8, 24]} />
        <meshStandardMaterial color={C.ink} roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── plastic ─────────────────────────────────────────────────────────

export function Bottle({ tint = C.cobaltSoft, ...p }: ToyProps) {
  return (
    <group {...p}>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.34, 0.38, 1.1, 20]} />
        <meshStandardMaterial color={tint} roughness={0.25} metalness={0.05} />
      </mesh>
      <mesh position={[0, 1.22, 0]}>
        <cylinderGeometry args={[0.14, 0.34, 0.32, 20]} />
        <meshStandardMaterial color={tint} roughness={0.25} metalness={0.05} />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.18, 20]} />
        <meshStandardMaterial color={C.coral} {...TOY_MATERIAL} />
      </mesh>
      {/* label */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.35, 0.385, 0.42, 20, 1, true]} />
        <meshStandardMaterial color={C.sun} roughness={0.8} side={2} />
      </mesh>
    </group>
  );
}

// ── batteries ───────────────────────────────────────────────────────

export function Battery({ tint = C.ink, ...p }: ToyProps) {
  return (
    <group {...p}>
      <RoundedBox args={[1.35, 1.0, 0.85]} radius={0.07} smoothness={3} position={[0, 0.5, 0]}>
        <meshStandardMaterial color={tint} {...TOY_MATERIAL} />
      </RoundedBox>
      <RoundedBox args={[1.2, 0.12, 0.72]} radius={0.04} smoothness={3} position={[0, 1.02, 0]}>
        <meshStandardMaterial color={C.coral} {...TOY_MATERIAL} />
      </RoundedBox>
      {/* terminals */}
      {[
        [-0.38, C.coral],
        [0.38, C.cobalt],
      ].map(([x, col]) => (
        <mesh key={String(x)} position={[x as number, 1.15, 0]}>
          <cylinderGeometry args={[0.11, 0.13, 0.16, 14]} />
          <meshStandardMaterial color={col as string} {...METAL_MATERIAL} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0.43]}>
        <planeGeometry args={[0.8, 0.36]} />
        <meshStandardMaterial color={C.sun} roughness={0.8} />
      </mesh>
    </group>
  );
}

// ── furniture ───────────────────────────────────────────────────────

export function Chair({ tint = C.coral, ...p }: ToyProps) {
  const legs: [number, number][] = [
    [-0.42, -0.42],
    [0.42, -0.42],
    [-0.42, 0.42],
    [0.42, 0.42],
  ];
  return (
    <group {...p}>
      <RoundedBox args={[1.15, 0.14, 1.15]} radius={0.05} smoothness={3} position={[0, 0.72, 0]}>
        <meshStandardMaterial color={tint} {...TOY_MATERIAL} />
      </RoundedBox>
      <RoundedBox
        args={[1.15, 0.95, 0.13]}
        radius={0.06}
        smoothness={3}
        position={[0, 1.24, -0.51]}
        rotation={[0.12, 0, 0]}
      >
        <meshStandardMaterial color={tint} {...TOY_MATERIAL} />
      </RoundedBox>
      {legs.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.36, z]}>
          <cylinderGeometry args={[0.055, 0.045, 0.72, 10]} />
          <meshStandardMaterial color={C.ink} {...TOY_MATERIAL} />
        </mesh>
      ))}
    </group>
  );
}

// ── the crate everything lands in ───────────────────────────────────

export function Crate({ tint = C.cobalt, ...p }: ToyProps) {
  const walls: { pos: [number, number, number]; args: [number, number, number] }[] = [
    { pos: [0, 0.5, -0.72], args: [1.5, 1, 0.09] },
    { pos: [0, 0.5, 0.72], args: [1.5, 1, 0.09] },
    { pos: [-0.72, 0.5, 0], args: [0.09, 1, 1.5] },
    { pos: [0.72, 0.5, 0], args: [0.09, 1, 1.5] },
  ];
  return (
    <group {...p}>
      <RoundedBox args={[1.5, 0.1, 1.5]} radius={0.03} smoothness={2} position={[0, 0.05, 0]}>
        <meshStandardMaterial color={tint} {...TOY_MATERIAL} />
      </RoundedBox>
      {walls.map((w, i) => (
        <RoundedBox key={i} args={w.args} radius={0.03} smoothness={2} position={w.pos}>
          <meshStandardMaterial color={tint} {...TOY_MATERIAL} />
        </RoundedBox>
      ))}
      {/* rim */}
      <RoundedBox args={[1.62, 0.1, 1.62]} radius={0.04} smoothness={3} position={[0, 1.02, 0]}>
        <meshStandardMaterial color={C.cobaltDeep} {...TOY_MATERIAL} />
      </RoundedBox>
    </group>
  );
}

// ── registry ────────────────────────────────────────────────────────
//
// The name → component map has to live in this client module because it holds
// actual components. The name → *category* map lives in ./toy-map, which stays
// server-importable. See that file for why.

export type { ToyName } from "./toy-map";
export { CATEGORY_TOY, toyForCategory } from "./toy-map";

export const TOYS: Record<ToyName, (p: ToyProps) => React.ReactElement> = {
  laptop: Laptop,
  monitor: Monitor,
  fridge: Fridge,
  tv: TV,
  ac: AC,
  "washing-machine": WashingMachine,
  pipes: PipeStack,
  paper: PaperStack,
  bottle: Bottle,
  battery: Battery,
  chair: Chair,
  crate: Crate,
};
