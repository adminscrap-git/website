"use client";

import { Float } from "@react-three/drei";
import { ToyStage } from "./stage";
import { useDropIn, useSlowSpin } from "./motion";
import { Crate, TOYS } from "./toys";
import type { ToyName } from "./toy-map";
import { C } from "./palette";

/**
 * The crate, filling up.
 *
 * This is the only WebGL canvas on /rates. Item cards stay flat and fast —
 * people scanning forty rates want type, not geometry — and the 3D is spent
 * entirely on the one moment that should feel good: something landing in the
 * crate with a bounce.
 */

/** Slots inside the crate, filled in order. Beyond six we stop drawing. */
const SLOTS: [number, number, number][] = [
  [-0.33, 0.18, -0.33],
  [0.33, 0.2, -0.3],
  [-0.3, 0.22, 0.34],
  [0.34, 0.24, 0.32],
  [0, 0.72, -0.05],
  [-0.3, 0.78, 0.3],
];

const TILT: [number, number, number][] = [
  [0.1, 0.5, -0.12],
  [-0.08, -0.7, 0.14],
  [0.14, 1.2, 0.1],
  [-0.12, 2.1, -0.16],
  [0.06, -1.6, 0.2],
  [0.16, 0.9, -0.2],
];

function Landed({
  toy,
  index,
}: {
  toy: ToyName;
  index: number;
}) {
  // Each new arrival springs down from above; earlier ones have already settled.
  const ref = useDropIn(0, 3.2, { stiffness: 120, damping: 12 });
  const Toy = TOYS[toy];
  const slot = SLOTS[index];
  const tilt = TILT[index];

  return (
    <group ref={ref}>
      <group position={slot} rotation={tilt} scale={0.3}>
        <Toy />
      </group>
    </group>
  );
}

function Scene({ toys }: { toys: ToyName[] }) {
  const spin = useSlowSpin(0.18);
  const visible = toys.slice(-SLOTS.length);

  return (
    <group ref={spin} position={[0, -0.45, 0]}>
      <Float speed={1.3} rotationIntensity={0.08} floatIntensity={0.18}>
        <Crate tint={C.cobalt} />
        {visible.map((toy, i) => (
          // Key by slot AND toy so a changed slot re-mounts and re-drops.
          <Landed key={`${i}-${toy}`} toy={toy} index={i} />
        ))}
      </Float>
    </group>
  );
}

export function CrateScene({
  toys,
  className,
}: {
  toys: ToyName[];
  className?: string;
}) {
  return (
    <ToyStage
      className={className}
      camera={[2.6, 2.5, 3.4]}
      fov={34}
      shadowScale={5}
      fallback={<FlatCrate count={toys.length} />}
    >
      <Scene toys={toys} />
    </ToyStage>
  );
}

/** No-WebGL crate: the same silhouette, stacked flat. */
function FlatCrate({ count }: { count: number }) {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="relative h-24 w-28">
        <div className="absolute inset-x-0 bottom-0 h-20 rounded-b-[12px] rounded-t-[6px] bg-cobalt" />
        <div className="absolute inset-x-[-6px] top-3 h-3 rounded-[6px] bg-cobalt-deep" />
        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
          <div
            key={i}
            className="absolute h-6 w-8 rounded-[7px]"
            style={{
              background: [C.coral, C.sun, C.paper2][i % 3],
              left: 8 + i * 22,
              top: -6 - i * 4,
              transform: `rotate(${i % 2 ? 8 : -6}deg)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
