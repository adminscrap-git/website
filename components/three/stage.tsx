"use client";

import { Suspense, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { C } from "./palette";
import { cn } from "@/lib/cn";

/**
 * Every 3D scene on the site goes through here.
 *
 * The audience is mid-range Android on 4G, so WebGL is opt-in per device, not
 * assumed. `useRenderMode` decides once on mount; anything that fails the check
 * gets the flat composition instead — same palette, same silhouettes, zero GPU.
 */

export type RenderMode = "3d" | "flat";

function canRender3D(): boolean {
  if (typeof window === "undefined") return false;

  // Someone who asked for less motion should not get a spinning fridge.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;

  // Cheap proxy for "this phone will not hold 50fps".
  const cores = navigator.hardwareConcurrency;
  if (typeof cores === "number" && cores < 4) return false;

  // Data Saver on, or a metered connection — 3D is a luxury, skip it.
  const conn = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && /2g/.test(conn.effectiveType)) return false;

  // Finally: does WebGL actually exist here?
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}

/**
 * Capability is an external fact about the device, so it's read as an external
 * store rather than synced into state with an effect. Two things fall out of
 * that: the server snapshot is always `false`, so SSR emits the flat scene and
 * hydration matches; and toggling "reduce motion" in the OS re-decides live,
 * without a reload.
 */
let capable: boolean | null = null;

function capabilitySnapshot(): boolean {
  capable ??= canRender3D();
  return capable;
}

function capabilityServerSnapshot(): boolean {
  return false;
}

function subscribeToCapability(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = () => {
    capable = null;
    onChange();
  };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}

export function useRenderMode(): RenderMode {
  const can = useSyncExternalStore(
    subscribeToCapability,
    capabilitySnapshot,
    capabilityServerSnapshot,
  );
  return can ? "3d" : "flat";
}

/** Warm studio light with no network requests. */
function Rig() {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 7, 5]} intensity={1.9} />
      <directionalLight position={[-5, 2, -4]} intensity={0.55} color={C.cobalt} />
      {/*
        A procedural environment: three glowing planes instead of a downloaded
        HDR. Metals get something to reflect, and nothing hits the network.
        `frames={1}` renders the cubemap once and never again.
      */}
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={2.4} position={[0, 5, 2]} scale={10} color={C.paper} />
        <Lightformer intensity={1.1} position={[-5, 1, -2]} scale={7} color={C.cobaltSoft} />
        <Lightformer intensity={1.3} position={[5, 0, 3]} scale={6} color={C.coralSoft} />
      </Environment>
    </>
  );
}

export function ToyStage({
  children,
  className,
  camera = [0, 1.7, 5.4],
  fov = 38,
  /** Set when nothing in the scene animates — renders on demand instead of 60fps. */
  still = false,
  shadowScale = 11,
  fallback,
}: {
  children: React.ReactNode;
  className?: string;
  camera?: [number, number, number];
  fov?: number;
  still?: boolean;
  shadowScale?: number;
  fallback?: React.ReactNode;
}) {
  const mode = useRenderMode();

  // The flat scene is also what SSR emits, so the first paint is never empty
  // and there's no layout shift when the decision lands.
  if (mode !== "3d") {
    return (
      <div className={cn("relative", className)} aria-hidden>
        {fallback ?? <FlatScene />}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        frameloop={still ? "demand" : "always"}
        camera={{ position: camera, fov }}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
        style={{ background: "transparent" }}
      >
        <Rig />
        <Suspense fallback={null}>{children}</Suspense>
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.3}
          scale={shadowScale}
          blur={2.8}
          far={5}
          resolution={256}
          color={C.ink2}
          frames={still ? 1 : Infinity}
        />
      </Canvas>
    </div>
  );
}

/**
 * The no-WebGL composition. Flat rounded shapes in the same palette — it reads
 * as a deliberate illustration rather than a broken canvas, which is the point.
 */
export function FlatScene({
  variant = "hero",
  className,
}: {
  variant?: "hero" | "single" | "row";
  className?: string;
}) {
  if (variant === "single") {
    return (
      <div className={cn("grid h-full w-full place-items-center", className)}>
        <div className="relative h-28 w-28">
          <div className="absolute inset-x-1 bottom-2 top-0 rounded-[22px] bg-cobalt" />
          <div className="absolute left-1/2 top-5 h-11 w-14 -translate-x-1/2 rounded-[10px] bg-paper" />
          <div className="absolute inset-x-4 bottom-0 h-2 rounded-full bg-ink/15 blur-[2px]" />
        </div>
      </div>
    );
  }

  if (variant === "row") {
    return (
      <div className={cn("flex h-full w-full items-end justify-center gap-4", className)}>
        {[
          { h: "h-16 w-12", c: "bg-coral", r: "rounded-[14px]" },
          { h: "h-24 w-16", c: "bg-cobalt", r: "rounded-[18px]" },
          { h: "h-14 w-20", c: "bg-sun", r: "rounded-[16px]" },
        ].map((s, i) => (
          <div key={i} className={cn(s.h, s.c, s.r)} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("relative grid h-full w-full place-items-center", className)}>
      <div className="relative h-[min(62vw,320px)] w-[min(62vw,320px)]">
        {/* fridge */}
        <div className="absolute bottom-[14%] left-[6%] h-[62%] w-[30%] rounded-[26px] bg-paper-2 ring-2 ring-ink/10" />
        <div className="absolute bottom-[46%] left-[6%] h-[3px] w-[30%] bg-ink/15" />
        {/* tv */}
        <div className="absolute bottom-[14%] left-[42%] h-[42%] w-[46%] rounded-[26px] bg-coral" />
        <div className="absolute bottom-[22%] left-[48%] h-[26%] w-[34%] rounded-[16px] bg-cobalt-soft" />
        {/* paper stack */}
        <div className="absolute bottom-[2%] left-[26%] h-[10%] w-[40%] rounded-[10px] bg-sun" />
        <div className="absolute bottom-[7%] left-[30%] h-[8%] w-[34%] rotate-[-3deg] rounded-[10px] bg-paper-3" />
        {/* ground */}
        <div className="absolute inset-x-[10%] bottom-0 h-3 rounded-full bg-ink/12 blur-[3px]" />
      </div>
    </div>
  );
}
