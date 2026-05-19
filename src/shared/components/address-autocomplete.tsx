'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const INPUT_CLASS =
  'h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80';

export type AddressValue = {
  street: string;
  postal_code: string;
  lat: number | null;
  lng: number | null;
  mapbox_id: string | null;
  raw_text: string;
  country_code: string;
  city_name: string;
  // Authoritative `cities.id` when the user picked a city from the
  // País/Ciudad selects. Optional & additive: absent/null on every
  // existing consumer and the Mapbox-only path → submit falls back to
  // resolving the city by slug (no regression).
  city_id?: string | null;
};

export type AddressAutocompleteProps = {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  countryCodes: string[];
  language?: string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  id?: string;
};

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';
const MIN_CHARS = 3;
const DEBOUNCE_MS = 120;

type Suggestion = {
  mapbox_id: string;
  name: string;
  place_formatted?: string;
  full_address?: string;
};

type FeatureContext = {
  address?: { name?: string };
  street?: { name?: string };
  postcode?: { name?: string };
  place?: { name?: string };
  locality?: { name?: string };
  district?: { name?: string };
  region?: { name?: string };
  country?: { country_code?: string; name?: string };
};

type Feature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    full_address?: string;
    place_formatted?: string;
    name?: string;
    address?: string;
    mapbox_id?: string;
    context?: FeatureContext;
  };
};

function newSessionToken(): string {
  // crypto.randomUUID may not exist on older browsers; fallback to a random hex.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

async function fetchSuggestions(
  query: string,
  sessionToken: string,
  countryCodes: string[],
  language: string | undefined,
): Promise<Suggestion[]> {
  if (!TOKEN || query.trim().length < MIN_CHARS) return [];
  const params = new URLSearchParams({
    q: query.trim(),
    access_token: TOKEN,
    session_token: sessionToken,
    limit: '5',
    types: 'address,street,place',
  });
  if (countryCodes.length > 0) params.set('country', countryCodes.join(',').toLowerCase());
  if (language) params.set('language', language);
  try {
    const res = await fetch(`https://api.mapbox.com/search/searchbox/v1/suggest?${params}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { suggestions?: Suggestion[] };
    return data.suggestions ?? [];
  } catch {
    return [];
  }
}

async function retrieveFeature(mapboxId: string, sessionToken: string): Promise<Feature | null> {
  if (!TOKEN) return null;
  const params = new URLSearchParams({ access_token: TOKEN, session_token: sessionToken });
  try {
    const res = await fetch(
      `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}?${params}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: Feature[] };
    return data.features?.[0] ?? null;
  } catch {
    return null;
  }
}

async function forwardGeocode(
  query: string,
  countryCodes: string[],
  language: string | undefined,
): Promise<Feature | null> {
  if (!TOKEN || query.trim().length < MIN_CHARS) return null;
  const params = new URLSearchParams({
    q: query.trim(),
    access_token: TOKEN,
    limit: '1',
    types: 'address,street,place',
  });
  if (countryCodes.length > 0) params.set('country', countryCodes.join(',').toLowerCase());
  if (language) params.set('language', language);
  try {
    const res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: Feature[] };
    return data.features?.[0] ?? null;
  } catch {
    return null;
  }
}

function parseFeature(feature: Feature, fallbackText: string): AddressValue {
  const ctx = feature.properties?.context ?? {};
  const [lng, lat] = feature.geometry?.coordinates ?? [null, null];
  const street =
    ctx.address?.name ??
    ctx.street?.name ??
    feature.properties?.address ??
    feature.properties?.name ??
    fallbackText;
  // City fallback chain — Mapbox returns it under different keys depending on
  // whether it's a metropolitan area, town, or smaller locality.
  const cityName =
    ctx.place?.name ??
    ctx.locality?.name ??
    ctx.district?.name ??
    ctx.region?.name ??
    '';
  return {
    street,
    postal_code: ctx.postcode?.name ?? '',
    lat: typeof lat === 'number' ? lat : null,
    lng: typeof lng === 'number' ? lng : null,
    mapbox_id: feature.properties?.mapbox_id ?? null,
    raw_text: feature.properties?.full_address ?? fallbackText,
    country_code: (ctx.country?.country_code ?? '').toLowerCase(),
    city_name: cityName,
    city_id: null,
  };
}

export function AddressAutocomplete({
  value,
  onChange,
  countryCodes,
  language,
  placeholder,
  disabled,
  hasError,
  id,
}: AddressAutocompleteProps) {
  const inputId = useId();
  const sessionTokenRef = useRef<string>('');
  if (!sessionTokenRef.current) sessionTokenRef.current = newSessionToken();

  const [text, setText] = useState(value.raw_text || value.street || '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSuggestRef = useRef(false);

  // Debounced suggestion fetching.
  useEffect(() => {
    if (skipNextSuggestRef.current) {
      skipNextSuggestRef.current = false;
      return;
    }
    if (text.trim().length < MIN_CHARS) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    setOpen(true);
    const handle = setTimeout(async () => {
      const result = await fetchSuggestions(
        text,
        sessionTokenRef.current,
        countryCodes,
        language,
      );
      setSuggestions(result);
      setSearching(false);
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [text, countryCodes, language]);

  const handleSelect = async (sug: Suggestion) => {
    setResolving(true);
    skipNextSuggestRef.current = true;
    try {
      const feature = await retrieveFeature(sug.mapbox_id, sessionTokenRef.current);
      const fallback = sug.full_address ?? `${sug.name}, ${sug.place_formatted ?? ''}`.trim();
      const next = feature ? parseFeature(feature, fallback) : { ...value, raw_text: fallback, street: sug.name };
      setText(next.raw_text);
      onChange(next);
      // New session_token after retrieve (Mapbox billing convention).
      sessionTokenRef.current = newSessionToken();
    } finally {
      setResolving(false);
      setOpen(false);
      setSuggestions([]);
    }
  };

  const handleBlurFallback = async () => {
    // Only run if user didn't already select a suggestion (which would have populated country_code).
    if (value.country_code) return;
    const trimmed = text.trim();
    if (trimmed.length < MIN_CHARS) return;
    setResolving(true);
    try {
      const feature = await forwardGeocode(trimmed, countryCodes, language);
      if (feature) {
        const next = parseFeature(feature, trimmed);
        setText(next.raw_text);
        onChange(next);
      }
    } finally {
      setResolving(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id ?? inputId}
        type="text"
        autoComplete="off"
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={hasError ? 'true' : undefined}
        aria-busy={resolving ? 'true' : undefined}
        className={cn(INPUT_CLASS, resolving && 'pr-10')}
        onChange={(e) => {
          setText(e.target.value);
          // Clear derived fields when user edits manually so stale country/city don't persist.
          onChange({
            ...value,
            raw_text: e.target.value,
            street: e.target.value,
            country_code: '',
            city_name: '',
            city_id: null,
          });
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => {
          // Delay to allow click on a suggestion (which itself fires blur).
          if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
          blurTimeoutRef.current = setTimeout(() => {
            setOpen(false);
            void handleBlurFallback();
          }, 150);
        }}
      />
      {resolving && (
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
          …
        </span>
      )}
      {open && (searching || suggestions.length > 0) && (
        <ul
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-lg border bg-popover p-1 text-sm shadow-md"
          role="listbox"
        >
          {searching && suggestions.length === 0 && (
            <li className="text-muted-foreground flex items-center gap-2 px-2 py-1.5 text-xs">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              Buscando…
            </li>
          )}
          {suggestions.map((sug) => (
            <li key={sug.mapbox_id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="hover:bg-accent hover:text-accent-foreground flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left"
                onMouseDown={(e) => {
                  // Prevent input blur firing before click handler.
                  e.preventDefault();
                }}
                onClick={() => void handleSelect(sug)}
              >
                <span className="font-medium">{sug.name}</span>
                {sug.place_formatted && (
                  <span className="text-muted-foreground text-xs">{sug.place_formatted}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const emptyAddress: AddressValue = {
  street: '',
  postal_code: '',
  lat: null,
  lng: null,
  mapbox_id: null,
  raw_text: '',
  country_code: '',
  city_name: '',
  city_id: null,
};
