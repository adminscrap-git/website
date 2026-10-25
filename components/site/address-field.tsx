"use client";

import { useEffect, useRef, useState } from "react";
import { loadMaps } from "@/components/admin/area-map";

/**
 * The pickup address, with Google Places behind it.
 *
 * Progressive, not dependent: it is an ordinary text input that gains
 * autocomplete if a Maps key exists and the script loads. Without a key, with
 * a blocked script, or offline, the customer types their address exactly as
 * they do today and the server geocodes it instead. The one thing that must
 * never happen on a booking form is an address box that will not accept an
 * address.
 *
 * When a suggestion IS picked we keep its coordinates, which does two things:
 * the service-area check is exact rather than a re-parse of free text, and the
 * agent later navigates to the pin the customer chose rather than to whatever
 * Google makes of their typing.
 */
export function AddressField({
  mapsKey,
  defaultValue,
  className,
  id,
  name = "addressLine",
  required,
  placeholder,
  onResolved,
}: {
  mapsKey: string | null;
  defaultValue?: string;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  placeholder?: string;
  onResolved?: (r: {
    lat: number;
    lng: number;
    pincode?: string;
    formatted?: string;
  }) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  // Kept in a ref so the setup effect never re-runs just because the parent
  // passed a new closure — re-running it would tear down the Places widget
  // under the customer mid-typing. Assigned in an effect, not during render.
  const cb = useRef(onResolved);
  useEffect(() => {
    cb.current = onResolved;
  });

  useEffect(() => {
    if (!mapsKey || !input.current) return;
    let cancelled = false;
    let listener: google.maps.MapsEventListener | null = null;

    loadMaps(mapsKey)
      .then((maps) => {
        if (cancelled || !input.current) return;

        const ac = new maps.places.Autocomplete(input.current, {
          componentRestrictions: { country: "in" },
          fields: ["geometry", "address_components", "formatted_address"],
          types: ["geocode"],
        });

        listener = ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const loc = place.geometry?.location;
          if (!loc) return;

          const pin = place.address_components?.find((c) =>
            c.types.includes("postal_code"),
          )?.long_name;

          cb.current?.({
            lat: loc.lat(),
            lng: loc.lng(),
            pincode: pin,
            formatted: place.formatted_address,
          });
        });

        setReady(true);
      })
      .catch(() => {
        // Key missing, restricted, or offline. The plain input still works.
      });

    return () => {
      cancelled = true;
      listener?.remove();
    };
  }, [mapsKey]);

  return (
    <>
      <input
        ref={input}
        id={id}
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className={className}
        // Chrome's own autofill dropdown fights the Places one for the same
        // box, so it is turned off once Places is actually driving the input.
        autoComplete={ready ? "off" : "street-address"}
        onKeyDown={(e) => {
          // Enter on a highlighted suggestion must choose it, not submit a
          // half-filled booking form.
          if (e.key === "Enter" && document.querySelector(".pac-item-selected")) {
            e.preventDefault();
          }
        }}
      />
      {ready && (
        <p className="mt-1.5 text-xs font-semibold text-ink-3">
          Start typing and pick your address for an exact pickup pin.
        </p>
      )}
    </>
  );
}
