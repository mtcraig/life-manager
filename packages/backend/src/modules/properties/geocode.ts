/**
 * Looks up an address's coordinates via OpenStreetMap Nominatim, a free
 * public geocoding API — the only external network call anywhere in this
 * app (see README's "local-only" note). Sends only the address text, once
 * per create/update (the result is cached on the property row, not
 * re-queried on every render), with a descriptive User-Agent per Nominatim's
 * usage policy. Returns null on any failure (no match, network error,
 * malformed response) so a bad/unresolvable address never blocks saving the
 * property itself — the map just skips a pin for that property.
 */
export async function geocodeAddress(address: string): Promise<{ lat: string; lng: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'life-manager (local personal finance app)' },
    });
    if (!response.ok) return null;

    const results = (await response.json()) as { lat: string; lon: string }[];
    const first = results[0];
    if (!first) return null;

    return { lat: first.lat, lng: first.lon };
  } catch {
    return null;
  }
}
