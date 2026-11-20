import React, { useEffect, useId, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { FieldDescription } from '@/components/ui/field';

function mapGeoapifyResult(result) {
  const housenumber = result.housenumber || '';
  const streetName = result.street || '';
  const line1 = result.address_line1
    || [housenumber, streetName].filter(Boolean).join(' ').trim()
    || result.name
    || '';

  return {
    street: line1,
    city: result.city || result.town || result.village || result.suburb || '',
    state: result.state_code || result.state || '',
    zip: result.postcode || ''
  };
}

/**
 * Free address autofill via Geoapify Address Autocomplete API.
 * https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/
 */
export default function AddressAutocomplete({ onAddressSelected }) {
  const listId = useId();
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY || '';
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef(null);
  const abortRef = useRef(null);
  const onSelectedRef = useRef(onAddressSelected);

  useEffect(() => {
    onSelectedRef.current = onAddressSelected;
  }, [onAddressSelected]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    if (!apiKey) return undefined;

    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      setError('');
      return undefined;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError('');

      try {
        const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
        url.searchParams.set('text', trimmed);
        url.searchParams.set('format', 'json');
        url.searchParams.set('limit', '6');
        url.searchParams.set('filter', 'countrycode:us');
        url.searchParams.set('lang', 'en');
        url.searchParams.set('apiKey', apiKey);

        const response = await fetch(url.toString(), { signal: controller.signal });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || data?.error || 'Address lookup failed.');
        }

        const results = Array.isArray(data.results) ? data.results : [];
        setSuggestions(results);
        setOpen(results.length > 0);
        setActiveIndex(results.length > 0 ? 0 : -1);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        console.error(err);
        setSuggestions([]);
        setOpen(false);
        setError(err?.message || 'Address lookup failed.');
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [apiKey, query]);

  const selectSuggestion = (result) => {
    const parsed = mapGeoapifyResult(result);
    setQuery(result.formatted || parsed.street || '');
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    onSelectedRef.current?.(parsed);
  };

  if (!apiKey) {
    return (
      <FieldDescription>
        Add <code className="font-mono text-xs">VITE_GEOAPIFY_API_KEY</code> to{' '}
        <code className="font-mono text-xs">.env</code>, then restart the dev server.
      </FieldDescription>
    );
  }

  return (
    <div ref={wrapRef} className="relative flex flex-col gap-2">
      <Input
        id="ship-address-search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
        placeholder="Start typing an address…"
        value={query}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % suggestions.length);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
          } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            selectSuggestion(suggestions[activeIndex]);
          } else if (e.key === 'Escape') {
            setOpen(false);
            setActiveIndex(-1);
          }
        }}
      />

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-lg"
        >
          {suggestions.map((result, index) => (
            <li key={`${result.place_id || result.formatted}-${index}`} role="presentation">
              <button
                id={`${listId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted ${
                  index === activeIndex ? 'bg-muted' : ''
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectSuggestion(result)}
              >
                <span className="font-medium text-foreground">
                  {result.address_line1 || result.formatted}
                </span>
                {(result.address_line2 || result.city) && (
                  <span className="text-xs text-muted-foreground">
                    {result.address_line2
                      || [result.city, result.state_code || result.state, result.postcode]
                        .filter(Boolean)
                        .join(', ')}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {loading && <FieldDescription>Searching addresses…</FieldDescription>}
      {error && (
        <FieldDescription className="text-destructive">{error}</FieldDescription>
      )}
      {!loading && !error && (
        <FieldDescription>
          Free address search powered by Geoapify (US). Pick a suggestion to autofill the form.
        </FieldDescription>
      )}
    </div>
  );
}
