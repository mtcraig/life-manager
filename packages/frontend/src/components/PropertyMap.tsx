import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { PropertyDto } from '@life-manager/shared';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

// Vite serves leaflet's default marker images from a path that breaks once bundled —
// point the default icon at the bundler-resolved URLs instead of leaflet's own lookup.
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const DEFAULT_CENTER: [number, number] = [54.5, -3];
const DEFAULT_ZOOM = 5;

function FitToMarkers({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    const only = positions[0];
    if (positions.length === 1 && only) {
      map.setView(only, 14);
    } else if (positions.length > 1) {
      map.fitBounds(positions, { padding: [32, 32] });
    }
  }, [map, positions]);
  return null;
}

export function PropertyMap({ properties }: { properties: PropertyDto[] }) {
  const pins = properties
    .filter((p): p is PropertyDto & { lat: string; lng: string } => p.lat !== null && p.lng !== null)
    .map((p) => ({ property: p, position: [Number(p.lat), Number(p.lng)] as [number, number] }))
    .filter(({ position }) => Number.isFinite(position[0]) && Number.isFinite(position[1]));

  const skipped = properties.length - pins.length;

  if (pins.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No properties have a resolved map location yet — add an address to see it here.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <div className="h-64 overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
        <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitToMarkers positions={pins.map((p) => p.position)} />
          {pins.map(({ property, position }) => (
            <Marker key={property.id} position={position}>
              <Popup>
                <span className="font-medium">{property.name}</span>
                {property.address && <div className="text-xs">{property.address}</div>}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      {skipped > 0 && (
        <p className="text-xs text-slate-500">
          {skipped} propert{skipped === 1 ? 'y' : 'ies'} without a resolved location not shown.
        </p>
      )}
    </div>
  );
}
