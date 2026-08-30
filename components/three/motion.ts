"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

/**
 * A twelve-line spring integrator.
 *
 * `maath/easing` ships with drei and would be less code, but it's critically
 * damped — it eases in and stops dead. The whole art direction rests on things
 * overshooting and settling, so this runs a real second-order spring instead.
 * Tune with `stiffness` (how hard it pulls) and `damping` (how fast it gives
 * up); damping below 2·√stiffness is what produces the bounce.
 */
export function useDropIn(
  delay = 0,
  from = 7,
  { stiffness = 90, damping = 11 } = {},
) {
  const ref = useRef<Group>(null);
  const s = useRef({ y: from, v: 0, t: 0, settled: false });

  useFrame((_, delta) => {
    const st = s.current;
    if (st.settled || !ref.current) return;

    st.t += delta;
    if (st.t < delay) {
      ref.current.position.y = from;
      return;
    }

    // Clamp: a backgrounded tab hands back a huge delta and the spring explodes.
    const dt = Math.min(delta, 1 / 30);
    const accel = -stiffness * st.y - damping * st.v;
    st.v += accel * dt;
    st.y += st.v * dt;

    if (Math.abs(st.y) < 0.001 && Math.abs(st.v) < 0.01) {
      st.y = 0;
      st.settled = true;
    }
    ref.current.position.y = st.y;
  });

  return ref;
}

/**
 * Camera-adjacent parallax: the whole scene leans toward the pointer.
 * Smoothed by hand so it trails the cursor rather than snapping to it.
 */
export function usePointerLean(strength = 0.12) {
  const ref = useRef<Group>(null);
  const cur = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 1 / 30);
    const targetY = state.pointer.x * strength * 2;
    const targetX = -state.pointer.y * strength;
    // Exponential smoothing — frame-rate independent, one line, no library.
    const k = 1 - Math.exp(-6 * dt);
    cur.current.x += (targetX - cur.current.x) * k;
    cur.current.y += (targetY - cur.current.y) * k;
    ref.current.rotation.x = cur.current.x;
    ref.current.rotation.y = cur.current.y;
  });

  return ref;
}

/** Idle spin, for objects that should never quite hold still. */
export function useSlowSpin(speed = 0.25) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += Math.min(delta, 1 / 30) * speed;
  });
  return ref;
}
