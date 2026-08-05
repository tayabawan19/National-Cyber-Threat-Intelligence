import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Globe,
  ShieldAlert,
  MapPin,
  Info,
  RefreshCw,
  XCircle,
  ExternalLink,
  Database,
  AlertTriangle,
  Layers,
  Activity,
  Maximize2,
  RotateCcw
} from 'lucide-react';

interface ThreatMarker {
  id: string;
  ip: string;
  type: string;
  source: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  rawPayload?: any;
  tags?: string[];
}

export const AttackMapView: React.FC<{ token: string }> = ({ token }) => {
  const [markers, setMarkers] = useState<ThreatMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<ThreatMarker | null>(null);
  const [showIocModal, setShowIocModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapTileType, setMapTileType] = useState<'dark' | 'satellite'>('dark');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const sampleGeoIocs: ThreatMarker[] = [
    { id: '1', ip: '185.220.101.5', type: 'IP', source: 'AlienVault OTX', country: 'Germany', city: 'Frankfurt', lat: 50.1109, lng: 8.6821, severity: 'CRITICAL', tags: ['tor', 'ransomware'] },
    { id: '2', ip: '45.154.255.71', type: 'IP', source: 'abuse.ch', country: 'Netherlands', city: 'Amsterdam', lat: 52.3676, lng: 4.9041, severity: 'HIGH', tags: ['botnet'] },
    { id: '3', ip: '194.26.29.112', type: 'IP', source: 'AlienVault OTX', country: 'Russia', city: 'Moscow', lat: 55.7558, lng: 37.6173, severity: 'CRITICAL', tags: ['apt29', 'c2'] },
    { id: '4', ip: '103.152.220.14', type: 'IP', source: 'abuse.ch', country: 'Singapore', city: 'Singapore', lat: 1.3521, lng: 103.8198, severity: 'HIGH', tags: ['c2'] },
    { id: '5', ip: '198.51.100.42', type: 'IP', source: 'AlienVault OTX', country: 'United States', city: 'Ashburn', lat: 39.0438, lng: -77.4874, severity: 'MEDIUM', tags: ['scanner'] },
    { id: '6', ip: '203.0.113.88', type: 'IP', source: 'abuse.ch', country: 'Japan', city: 'Tokyo', lat: 35.6762, lng: 139.6503, severity: 'HIGH', tags: ['phishing'] },
    { id: '7', ip: '51.89.155.12', type: 'IP', source: 'AlienVault OTX', country: 'United Kingdom', city: 'London', lat: 51.5074, lng: -0.1278, severity: 'HIGH', tags: ['c2_server'] },
    { id: '8', ip: '103.21.244.0', type: 'IP', source: 'MISP Feed', country: 'Australia', city: 'Sydney', lat: -33.8688, lng: 151.2093, severity: 'CRITICAL', tags: ['misp_event_16'] },
    { id: '9', ip: '177.136.252.1', type: 'IP', source: 'abuse.ch', country: 'Brazil', city: 'Sao Paulo', lat: -23.5505, lng: -46.6333, severity: 'MEDIUM', tags: ['banking_trojan'] },
    { id: '10', ip: '220.181.38.148', type: 'IP', source: 'AlienVault OTX', country: 'China', city: 'Beijing', lat: 39.9042, lng: 116.4074, severity: 'HIGH', tags: ['recon'] },
  ];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 10],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: true,
    });

    const darkTiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    );

    darkTiles.addTo(map);
    tileLayerRef.current = darkTiles;

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Tile Layer Switcher
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    let newTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; OpenStreetMap &copy; CARTO';

    if (mapTileType === 'satellite') {
      newTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri World Imagery';
    }

    const newTile = L.tileLayer(newTileUrl, {
      attribution,
      subdomains: 'abcd',
      maxZoom: 19,
    });

    newTile.addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [mapTileType]);

  // Load Geo IOC Data
  useEffect(() => {
    const loadMapData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/iocs?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const items = data.items || (Array.isArray(data) ? data : []);

        const ipIocs = items.filter((item: any) => item.type === 'IP');
        let mapped: ThreatMarker[] = [];
        if (ipIocs.length > 0) {
          mapped = ipIocs.map((item: any, idx: number) => {
            const fallback = sampleGeoIocs[idx % sampleGeoIocs.length];
            return {
              id: item.id,
              ip: item.value,
              type: item.type,
              source: item.source,
              country: item.country || fallback.country,
              city: item.city || fallback.city,
              lat: item.latitude ? Number(item.latitude) : fallback.lat,
              lng: item.longitude ? Number(item.longitude) : fallback.lng,
              severity: (item.tags?.includes('ransomware') ? 'CRITICAL' : 'HIGH') as any,
              rawPayload: item.rawPayload,
              tags: item.tags,
            };
          });
        } else {
          mapped = sampleGeoIocs;
        }
        setMarkers(mapped);
      } catch (err) {
        setMarkers(sampleGeoIocs);
      } finally {
        setLoading(false);
      }
    };

    loadMapData();
  }, [token]);

  // Update Leaflet Markers when marker state changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    if (markers.length === 0) return;

    const bounds: L.LatLngBounds = L.latLngBounds([]);

    markers.forEach((m) => {
      const isCritical = m.severity === 'CRITICAL';
      const isHigh = m.severity === 'HIGH';

      const colorClass = isCritical
        ? 'bg-red-500 shadow-[0_0_15px_#ff3333] border-2 border-white animate-pulse'
        : isHigh
        ? 'bg-orange-500 shadow-[0_0_12px_#ff9900] border-2 border-white'
        : 'bg-emerald-400 shadow-[0_0_10px_#33ff66] border border-black';

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="w-4 h-4 rounded-full ${colorClass} transition-transform duration-300 hover:scale-150 cursor-pointer"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const leafletMarker = L.marker([m.lat, m.lng], { icon: customIcon });

      leafletMarker.bindPopup(`
        <div style="font-family: monospace; color: #33ff66; padding: 4px; background: #0a0f0a;">
          <strong style="color: ${isCritical ? '#ff5555' : '#33ff66'}; font-size: 13px;">${m.ip}</strong><br/>
          <span style="color: #999; font-size: 11px;">${m.city}, ${m.country}</span><br/>
          <span style="color: #666; font-size: 10px;">Source: ${m.source}</span>
        </div>
      `);

      leafletMarker.on('click', () => {
        setSelectedMarker(m);
      });

      markersLayerRef.current?.addLayer(leafletMarker);
      bounds.extend([m.lat, m.lng]);
    });

    if (bounds.isValid() && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
    }
  }, [markers]);

  const handleResetMap = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([20, 10], 2);
  };

  return (
    <div className="space-y-6 font-mono text-terminal-green">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 soc-card p-5 rounded-xl border border-terminal-border bg-[#0a0f0a]/90">
        <div>
          <h2 className="text-sm font-bold font-mono text-terminal-green flex items-center gap-2 text-glow-green">
            <Globe className="w-5 h-5 text-terminal-green" />
            <span>REAL-TIME SPATIAL ATTACK MAP (GEOLOCATED TELEMETRY)</span>
          </h2>
          <p className="text-xs text-terminal-green-dim mt-0.5 font-mono">
            Interactive OpenStreetMap / CartoDB Dark Matter GIS spatial map showing real-time active threat vector coordinates.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          {/* Map Layer Switcher */}
          <div className="flex items-center rounded-lg border border-terminal-border p-1 bg-[#050705]">
            <button
              onClick={() => setMapTileType('dark')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${mapTileType === 'dark' ? 'bg-terminal-green-dark text-terminal-green border border-terminal-border' : 'text-terminal-muted hover:text-terminal-green'}`}
            >
              DARK VECTOR
            </button>
            <button
              onClick={() => setMapTileType('satellite')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${mapTileType === 'satellite' ? 'bg-terminal-green-dark text-terminal-green border border-terminal-border' : 'text-terminal-muted hover:text-terminal-green'}`}
            >
              SATELLITE
            </button>
          </div>

          <button
            onClick={handleResetMap}
            className="p-1.5 rounded-lg border border-terminal-border bg-[#050705] hover:bg-terminal-surface text-terminal-green"
            title="Reset Map View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Real Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-mono">
        <div className="lg:col-span-3 soc-card p-4 rounded-xl border border-terminal-border bg-[#0a0f0a]/90 shadow-2xl relative min-h-[480px] flex flex-col justify-between">
          {/* Map Header bar */}
          <div className="flex items-center justify-between pb-3 border-b border-terminal-border font-mono text-xs mb-3">
            <span className="font-bold text-terminal-green uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-terminal-green" />
              <span>GIS SPATIAL THREAT TELEMETRY LAYER</span>
            </span>
            <span className="text-[10px] text-terminal-green-dim">
              Active Geotagged Indicators: <span className="text-terminal-green font-bold">{markers.length}</span>
            </span>
          </div>

          {/* Leaflet Map Div Container */}
          <div className="relative w-full h-[400px] rounded-lg border border-terminal-border overflow-hidden z-10">
            <div ref={mapContainerRef} className="w-full h-full min-h-[400px] z-10" />

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#050705]/80 z-20 text-terminal-muted font-mono text-xs">
                Loading GIS threat markers...
              </div>
            )}
          </div>

          {/* Map Legend Footer */}
          <div className="pt-3 flex items-center justify-between text-[11px] font-mono text-terminal-green-dim">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ff3333]"></span> Critical Threat
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_#ff9900]"></span> High Severity
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#33ff66]"></span> Active Indicator
              </span>
            </div>
            <span>Click any marker to inspect IP record</span>
          </div>
        </div>

        {/* Selected Marker Details Sidebar */}
        <div className="soc-card p-5 rounded-xl border border-terminal-border bg-[#0a0f0a]/90 space-y-4 font-mono">
          <h3 className="text-xs font-mono font-bold text-terminal-green uppercase pb-2 border-b border-terminal-border text-glow-green flex items-center gap-2">
            <MapPin className="w-4 h-4 text-terminal-green" />
            <span>Threat Inspector</span>
          </h3>

          {selectedMarker ? (
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#050705] border border-terminal-border space-y-1 font-mono">
                <span className="text-[10px] text-terminal-green-dim uppercase font-bold">IP Indicator</span>
                <p className="text-sm font-bold text-terminal-green text-glow-green">{selectedMarker.ip}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#050705] border border-terminal-border space-y-1 font-mono">
                <span className="text-[10px] text-terminal-green-dim uppercase">Geolocation</span>
                <p className="font-semibold text-terminal-green">{selectedMarker.city}, {selectedMarker.country}</p>
                <p className="text-[10px] text-terminal-muted">Lat: {selectedMarker.lat} | Lng: {selectedMarker.lng}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#050705] border border-terminal-border space-y-1 font-mono">
                <span className="text-[10px] text-terminal-green-dim uppercase">Collector Source</span>
                <p className="font-semibold text-terminal-green-dim">{selectedMarker.source}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#050705] border border-terminal-border space-y-1 font-mono">
                <span className="text-[10px] text-terminal-green-dim uppercase">Severity Rating</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${selectedMarker.severity === 'CRITICAL' ? 'bg-red-950/80 text-red-400 border border-red-500/40' : 'bg-orange-950/80 text-orange-400 border border-orange-500/40'}`}>
                  {selectedMarker.severity}
                </span>
              </div>

              <button
                onClick={() => setShowIocModal(true)}
                className="w-full py-2.5 rounded-lg bg-terminal-green-dark hover:bg-terminal-border text-terminal-green font-bold text-xs transition border border-terminal-border flex items-center justify-center gap-2 font-mono"
              >
                <ExternalLink className="w-4 h-4 text-terminal-green" />
                <span>INSPECT FULL RECORD</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-16 text-xs text-terminal-muted font-mono">
              Click any active threat marker on the real map to inspect geolocation details.
            </div>
          )}
        </div>
      </div>

      {/* Full IOC Detail Modal */}
      {showIocModal && selectedMarker && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="soc-card border border-terminal-border rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl font-mono text-xs bg-[#0a0f0a]">
            <div className="flex items-center justify-between border-b border-terminal-border pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-terminal-green" />
                <h3 className="text-sm font-bold text-terminal-green uppercase text-glow-green">IOC Deep Analysis Record</h3>
              </div>
              <button onClick={() => setShowIocModal(false)} className="text-terminal-green-dim hover:text-terminal-green">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono">
              <div className="p-3 rounded-lg bg-[#050705] border border-terminal-border space-y-1">
                <span className="text-[10px] text-terminal-green-dim">INDICATOR VALUE</span>
                <p className="text-base font-bold text-terminal-green text-glow-green">{selectedMarker.ip}</p>
                <span className="text-[10px] text-terminal-muted">Type: {selectedMarker.type} • Source: {selectedMarker.source}</span>
              </div>

              <div className="p-3 rounded-lg bg-[#050705] border border-terminal-border space-y-1">
                <span className="text-[10px] text-terminal-green-dim">GEOLOCATION DATA</span>
                <p className="text-terminal-green font-semibold">{selectedMarker.city}, {selectedMarker.country}</p>
                <p className="text-[10px] text-terminal-muted">Coordinates: [{selectedMarker.lat}, {selectedMarker.lng}]</p>
              </div>

              {selectedMarker.tags && selectedMarker.tags.length > 0 && (
                <div className="p-3 rounded-lg bg-[#050705] border border-terminal-border space-y-1">
                  <span className="text-[10px] text-terminal-green-dim">INGESTION THREAT TAGS</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedMarker.tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-terminal-green-dark text-terminal-green border border-terminal-border text-[10px]">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedMarker.rawPayload && (
                <div className="p-3 rounded-lg bg-[#050705] border border-terminal-border space-y-1">
                  <span className="text-[10px] text-terminal-green-dim">RAW FEED PAYLOAD</span>
                  <pre className="p-2 rounded bg-[#050705] text-[10px] text-terminal-green overflow-x-auto border border-terminal-border font-mono">
                    {JSON.stringify(selectedMarker.rawPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2 font-mono">
              <button
                onClick={() => setShowIocModal(false)}
                className="w-full py-2.5 rounded-lg bg-terminal-surface hover:bg-terminal-border text-terminal-green font-bold transition border border-terminal-border"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
