"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveServiceArea } from "@/app/actions/admin";
import type { FormState } from "@/app/actions/admin";
import type { AreaSettings } from "@/lib/db-types";
import { AdminField, FormMessage, SubmitButton, adminInput } from "./ui";

/**
 * The service area, drawn.
 *
 * Drag the pin to the depot, drag the circle edge to set how far the van goes.
 * A number in a box cannot answer "does that reach Gachibowli?", and that is
 * the only question anyone actually has about a radius.
 *
 * Loads the Maps script itself rather than through next/script: the callback
 * has to run before the map can be built, and this keeps the whole lifecycle
 * — load, build, clean up — in one place.
 */
export function AreaMap({
  area,
  mapsKey,
}: {
  area: AreaSettings;
  mapsKey: string | null;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveServiceArea, {});
  const [lat, setLat] = useState(area.depot_lat);
  const [lng, setLng] = useState(area.depot_lng);
  const [radius, setRadius] = useState(area.radius_km);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="depot_lat" value={lat} />
      <input type="hidden" name="depot_lng" value={lng} />
      <input type="hidden" name="radius_km" value={radius} />

      {mapsKey ? (
        <MapCanvas
          mapsKey={mapsKey}
          lat={lat}
          lng={lng}
          radiusKm={radius}
          onMove={(next) => {
            setLat(next.lat);
            setLng(next.lng);
          }}
          onRadius={(km) => setRadius(Math.round(km * 10) / 10)}
        />
      ) : (
        <p className="rounded-[12px] bg-sun-soft px-4 py-3 text-sm font-semibold text-ink">
          Add <span className="readout">NEXT_PUBLIC_GOOGLE_MAPS_KEY</span> to see
          the map. The numbers below still work without it.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminField label="Depot latitude">
          <input
            value={lat}
            onChange={(e) => setLat(Number(e.target.value))}
            type="number"
            step="0.000001"
            className={adminInput}
          />
        </AdminField>
        <AdminField label="Depot longitude">
          <input
            value={lng}
            onChange={(e) => setLng(Number(e.target.value))}
            type="number"
            step="0.000001"
            className={adminInput}
          />
        </AdminField>
        <AdminField label="Radius (km)">
          <input
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            type="number"
            step="0.5"
            min="1"
            max="100"
            className={adminInput}
          />
        </AdminField>
      </div>

      <AdminField label="Area name" hint="Shown to anyone who falls outside it.">
        <input name="label" defaultValue={area.label} className={adminInput} />
      </AdminField>

      <SubmitButton pendingLabel="Saving…">Save service area</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

/* ── the map itself ────────────────────────────────────────────────── */

type Maps = typeof google.maps;

function MapCanvas({
  mapsKey,
  lat,
  lng,
  radiusKm,
  onMove,
  onRadius,
}: {
  mapsKey: string;
  lat: number;
  lng: number;
  radiusKm: number;
  onMove: (p: { lat: number; lng: number }) => void;
  onRadius: (km: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const circle = useRef<google.maps.Circle | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Latest values without re-running the setup effect, which would tear the
  // map down and rebuild it on every drag. Assigned in an effect, not during
  // render.
  const latest = useRef({ lat, lng, radiusKm, onMove, onRadius });
  useEffect(() => {
    latest.current = { lat, lng, radiusKm, onMove, onRadius };
  });

  useEffect(() => {
    let cancelled = false;

    loadMaps(mapsKey)
      .then((maps) => {
        if (cancelled || !host.current) return;

        const centre = { lat: latest.current.lat, lng: latest.current.lng };
        const map = new maps.Map(host.current, {
          center: centre,
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        const marker = new maps.Marker({
          position: centre,
          map,
          draggable: true,
          title: "Depot — drag to move",
        });

        const c = new maps.Circle({
          map,
          center: centre,
          radius: latest.current.radiusKm * 1000,
          editable: true,
          draggable: false,
          strokeColor: "#145a32",
          strokeWeight: 2,
          fillColor: "#145a32",
          fillOpacity: 0.12,
        });
        circle.current = c;

        marker.addListener("dragend", () => {
          const p = marker.getPosition();
          if (!p) return;
          const next = { lat: p.lat(), lng: p.lng() };
          c.setCenter(next);
          latest.current.onMove(next);
        });

        c.addListener("radius_changed", () => {
          latest.current.onRadius(c.getRadius() / 1000);
        });

        // Dragging the circle's own centre handle must move the pin too, or
        // the two silently disagree about where the depot is.
        c.addListener("center_changed", () => {
          const centreNow = c.getCenter();
          if (!centreNow) return;
          marker.setPosition(centreNow);
          latest.current.onMove({ lat: centreNow.lat(), lng: centreNow.lng() });
        });
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [mapsKey]);

  // Keep the drawn circle in step with the number box.
  useEffect(() => {
    circle.current?.setRadius(radiusKm * 1000);
  }, [radiusKm]);

  if (error) {
    return (
      <p className="rounded-[12px] bg-coral-soft px-4 py-3 text-sm font-semibold text-coral-deep">
        Map failed to load: {error}
      </p>
    );
  }

  return (
    <div
      ref={host}
      className="h-[360px] w-full overflow-hidden rounded-toy border-2 border-paper-3 bg-paper-2"
      aria-label="Service area map"
    />
  );
}

/**
 * One script tag, one promise, however many components ask.
 *
 * Google's loader throws if the script is added twice, and React in dev mounts
 * effects twice on purpose — so the promise is cached on the module.
 */
let mapsPromise: Promise<Maps> | null = null;

function loadMaps(key: string): Promise<Maps> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise<Maps>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      key,
    )}&libraries=places&loading=async`;
    script.async = true;
    script.onload = () =>
      window.google?.maps
        ? resolve(window.google.maps)
        : reject(new Error("Maps loaded but unavailable"));
    script.onerror = () =>
      reject(new Error("check the key and its website restrictions"));
    document.head.appendChild(script);
  });

  return mapsPromise;
}

export { loadMaps };
