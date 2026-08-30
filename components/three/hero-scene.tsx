"use client";

import { Float } from "@react-three/drei";
import { ToyStage, FlatScene } from "./stage";
import { useDropIn, usePointerLean } from "./motion";
import { Bottle, Fridge, Laptop, PaperStack, TV } from "./toys";
import { C } from "./palette";

/**
 * The home diorama. Five objects drop in on a stagger, bounce once, then drift.
 *
 * Everything is authored around the origin so the camera never has to be
 * re-aimed when a toy is swapped out.
 */

function Drop({
  delay,
  children,
}: {
  delay: number;
  children: React.ReactNode;
}) {
  const ref = useDropIn(delay);
  return <group ref={ref}>{children}</group>;
}

function Diorama() {
  const lean = usePointerLean(0.1);

  return (
    <group ref={lean}>
      <Drop delay={0}>
        <Float speed={1.1} rotationIntensity={0.14} floatIntensity={0.3}>
          <Fridge position={[-2.35, 0, -0.6]} rotation={[0, 0.38, 0]} tint={C.paper2} />
        </Float>
      </Drop>

      <Drop delay={0.12}>
        <Float speed={1.4} rotationIntensity={0.18} floatIntensity={0.36}>
          <TV position={[0.05, 0, 0.5]} rotation={[0, -0.2, 0]} tint={C.coral} />
        </Float>
      </Drop>

      <Drop delay={0.24}>
        <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
          <PaperStack position={[2.5, 0, 0.1]} rotation={[0, -0.5, 0]} />
        </Float>
      </Drop>

      <Drop delay={0.36}>
        <Float speed={2} rotationIntensity={0.55} floatIntensity={0.9}>
          <Laptop position={[2.15, 1.9, 1.5]} rotation={[0.15, -0.9, -0.12]} scale={0.62} />
        </Float>
      </Drop>

      <Drop delay={0.46}>
        <Float speed={2.3} rotationIntensity={0.7} floatIntensity={1}>
          <Bottle position={[-1.85, 2.1, 1.4]} rotation={[0.3, 0, 0.35]} scale={0.5} />
        </Float>
      </Drop>
    </group>
  );
}

export function HeroScene({ className }: { className?: string }) {
  return (
    <ToyStage
      className={className}
      camera={[0, 2.3, 7.4]}
      fov={36}
      shadowScale={14}
      fallback={<FlatScene variant="hero" />}
    >
      <Diorama />
    </ToyStage>
  );
}
