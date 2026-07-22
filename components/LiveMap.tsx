import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Popup, Polyline, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: [number, number] = [6.5244, 3.3792];

interface RiderLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

interface LiveMapProps {
  orderId: string;
}

export default function LiveMap({ orderId }: LiveMapProps) {
  const [riderLoc, setRiderLoc] = useState<RiderLocation | null>(null);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);

  const fetchLocation = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/location`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.location) setRiderLoc(data.location);
      if (data.pickup) setPickupCoords(getApproxCoords(data.pickup));
      if (data.delivery) setDeliveryCoords(getApproxCoords(data.delivery));
    } catch {}
  };

  useEffect(() => {
    fetchLocation();
    const interval = setInterval(fetchLocation, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  const center: [number, number] = riderLoc
    ? [riderLoc.latitude, riderLoc.longitude]
    : pickupCoords ?? DEFAULT_CENTER;

  const allPoints = useMemo(() => {
    const pts: [number, number][] = [];
    if (pickupCoords) pts.push(pickupCoords);
    if (deliveryCoords) pts.push(deliveryCoords);
    if (riderLoc) pts.push([riderLoc.latitude, riderLoc.longitude]);
    return pts;
  }, [pickupCoords, deliveryCoords, riderLoc]);

  const isLive = riderLoc && (Date.now() - new Date(riderLoc.updated_at).getTime() < 30000);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">Live Tracking</h3>
          {riderLoc && (
            <p className="text-purple-200 text-xs">
              Updated {new Date(riderLoc.updated_at).toLocaleTimeString()}
            </p>
          )}
        </div>
        {isLive && (
          <span className="flex items-center gap-1.5 text-xs text-white font-medium bg-white/20 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-dot" />
            GPS Active
          </span>
        )}
      </div>
      <div className="h-[380px] relative">
        {typeof window !== 'undefined' && (
          <MapContainer center={center} zoom={13} className="h-full w-full z-0" scrollWheelZoom={false} zoomControl={false}>
            <TileLayer
              attribution='&copy; OSM'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {pickupCoords && (
              <CircleMarker center={pickupCoords} radius={9} pathOptions={{ fillColor: '#10B981', fillOpacity: 0.9, color: '#fff', weight: 2.5 }}>
                <Popup>
                  <div className="text-center text-sm">
                    <p className="font-semibold text-emerald-600">Pickup Point</p>
                  </div>
                </Popup>
              </CircleMarker>
            )}

            {deliveryCoords && (
              <CircleMarker center={deliveryCoords} radius={9} pathOptions={{ fillColor: '#EF4444', fillOpacity: 0.9, color: '#fff', weight: 2.5 }}>
                <Popup>
                  <div className="text-center text-sm">
                    <p className="font-semibold text-red-500">Delivery Point</p>
                  </div>
                </Popup>
              </CircleMarker>
            )}

            {riderLoc && (
              <CircleMarker
                center={[riderLoc.latitude, riderLoc.longitude]}
                radius={10}
                pathOptions={{ fillColor: '#6366F1', fillOpacity: 1, color: '#fff', weight: 3 }}
              >
                <Popup>
                  <div className="text-center text-sm">
                    <p className="font-semibold text-indigo-600">Rider is here</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {new Date(riderLoc.updated_at).toLocaleTimeString()}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            )}

            {pickupCoords && deliveryCoords && (
              <Polyline
                positions={[pickupCoords, deliveryCoords]}
                pathOptions={{ color: '#D1D5DB', weight: 2, dashArray: '8 6' }}
              />
            )}
          </MapContainer>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-lg shadow-md px-3 py-2 z-[1000] flex gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
            <span className="text-gray-600">Pickup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm" />
            <span className="text-gray-600">Delivery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-sm" />
            <span className="text-gray-600">Rider</span>
          </div>
        </div>

        {/* Fit bounds button */}
        <button
          onClick={() => {
            const mapEl = document.querySelector('.leaflet-container') as any;
            if (mapEl && mapEl._leaflet_map && allPoints.length > 0) {
              const map = mapEl._leaflet_map;
              const lats = allPoints.map((p) => p[0]);
              const lngs = allPoints.map((p) => p[1]);
              const bounds: any = [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]];
              map.fitBounds(bounds, { padding: [40, 40] });
            }
          }}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg shadow-md p-2 z-[1000] hover:bg-white transition-colors"
          title="Fit all markers"
        >
          <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getApproxCoords(address: string): [number, number] {
  const base: [number, number] = [6.5244, 3.3792];
  const h = hashCode(address);
  const latOffset = ((h % 800) / 10000) * (h % 2 === 0 ? 1 : -1);
  const lngOffset = (((h * 13) % 800) / 10000) * (h % 3 === 0 ? 1 : -1);
  return [base[0] + latOffset, base[1] + lngOffset];
}
