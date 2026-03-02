"use client";

import { useEffect, useRef, useState } from "react";

type GoogleLike = {
  maps?: {
    places?: {
      Autocomplete: new (
        input: HTMLInputElement,
        options?: Record<string, unknown>,
      ) => {
        addListener: (
          eventName: string,
          callback: () => void,
        ) => {
          remove: () => void;
        };
        getPlace: () => {
          formatted_address?: string;
          name?: string;
          geometry?: {
            location?: {
              lat: () => number;
              lng: () => number;
            };
          };
        };
      };
    };
  };
};

interface PlaceSelection {
  latitude: number;
  longitude: number;
  label: string;
}

interface GooglePlaceAutocompleteProps {
  apiKey?: string;
  value: string;
  onValueChange: (value: string) => void;
  onPlaceSelected: (selection: PlaceSelection) => void;
  placeholder?: string;
}

const SCRIPT_ID = "google-maps-places-script";

function getGoogle(): GoogleLike | undefined {
  return (window as Window & { google?: GoogleLike }).google;
}

function hasPlacesApi(): boolean {
  const google = getGoogle();
  return Boolean(google?.maps?.places?.Autocomplete);
}

function loadGooglePlacesScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (hasPlacesApi()) {
      resolve();
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Maps Places script")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps Places script"));

    document.head.appendChild(script);
  });
}

export function GooglePlaceAutocomplete({
  apiKey,
  value,
  onValueChange,
  onPlaceSelected,
  placeholder = "Search birth place",
}: GooglePlaceAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function initScript() {
      if (!apiKey) {
        return;
      }

      try {
        await loadGooglePlacesScript(apiKey);
        if (active) {
          setScriptReady(true);
        }
      } catch {
        if (active) {
          setScriptReady(false);
        }
      }
    }

    void initScript();

    return () => {
      active = false;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!scriptReady || !inputRef.current) {
      return;
    }

    const google = getGoogle();
    if (!google?.maps?.places?.Autocomplete) {
      return;
    }

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ["geometry", "formatted_address", "name"],
      types: ["(cities)"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const geometry = place.geometry?.location;

      if (!geometry) {
        return;
      }

      const label = place.formatted_address ?? place.name ?? "";
      onValueChange(label);
      onPlaceSelected({
        latitude: Number(geometry.lat().toFixed(6)),
        longitude: Number(geometry.lng().toFixed(6)),
        label,
      });
    });

    return () => {
      listener.remove();
    };
  }, [onPlaceSelected, onValueChange, scriptReady]);

  return (
    <input
      className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
      ref={inputRef}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      placeholder={placeholder}
      autoComplete="off"
    />
  );
}
