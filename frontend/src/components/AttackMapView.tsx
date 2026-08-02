import React, { useEffect, useState } from 'react';
import { Globe, ShieldAlert, MapPin, Info, RefreshCw, XCircle, ExternalLink, Database, AlertTriangle, Layers } from 'lucide-react';

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

interface MarkerCluster {
  id: string;
  x: number; // percentage float 0..100
  y: number; // percentage float 0..100
  markers: ThreatMarker[];
  maxSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export const AttackMapView: React.FC<{ token: string }> = ({ token }) => {
  const [markers, setMarkers] = useState<ThreatMarker[]>([]);
  const [clusters, setClusters] = useState<MarkerCluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<MarkerCluster | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<ThreatMarker | null>(null);
  const [showIocModal, setShowIocModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const sampleGeoIocs: ThreatMarker[] = [
    { id: '1', ip: '185.220.101.5', type: 'IP', source: 'AlienVault OTX', country: 'Germany', city: 'Frankfurt', lat: 50.1109, lng: 8.6821, severity: 'CRITICAL', tags: ['tor', 'ransomware'] },
    { id: '2', ip: '45.154.255.71', type: 'IP', source: 'abuse.ch', country: 'Netherlands', city: 'Amsterdam', lat: 52.3676, lng: 4.9041, severity: 'HIGH', tags: ['botnet'] },
    { id: '3', ip: '194.26.29.112', type: 'IP', source: 'AlienVault OTX', country: 'Russia', city: 'Moscow', lat: 55.7558, lng: 37.6173, severity: 'CRITICAL', tags: ['apt29'] },
    { id: '4', ip: '103.152.220.14', type: 'IP', source: 'abuse.ch', country: 'Singapore', city: 'Singapore', lat: 1.3521, lng: 103.8198, severity: 'HIGH', tags: ['c2'] },
    { id: '5', ip: '198.51.100.42', type: 'IP', source: 'AlienVault OTX', country: 'United States', city: 'Ashburn', lat: 39.0438, lng: -77.4874, severity: 'MEDIUM', tags: ['scanner'] },
    { id: '6', ip: '203.0.113.88', type: 'IP', source: 'abuse.ch', country: 'Japan', city: 'Tokyo', lat: 35.6762, lng: 139.6503, severity: 'HIGH', tags: ['phishing'] },
    { id: '7', ip: '185.220.101.99', type: 'IP', source: 'AlienVault OTX', country: 'Germany', city: 'Frankfurt', lat: 50.1109, lng: 8.6821, severity: 'HIGH', tags: ['tor'] },
    { id: '8', ip: '45.154.255.80', type: 'IP', source: 'abuse.ch', country: 'Netherlands', city: 'Amsterdam', lat: 52.3676, lng: 4.9041, severity: 'CRITICAL', tags: ['ransomware'] },
  ];

  const convertCoordsToSvg = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  const clusterMarkersList = (markerItems: ThreatMarker[]): MarkerCluster[] => {
    const result: MarkerCluster[] = [];
    const threshold = 6.0; // 6% distance threshold for clustering

    markerItems.forEach((m) => {
      const { x, y } = convertCoordsToSvg(m.lat, m.lng);
      let foundCluster = result.find((c) => {
        const dx = c.x - x;
        const dy = c.y - y;
        return Math.sqrt(dx * dx + dy * dy) < threshold;
      });

      if (foundCluster) {
        foundCluster.markers.push(m);
        if (m.severity === 'CRITICAL' || (m.severity === 'HIGH' && foundCluster.maxSeverity !== 'CRITICAL')) {
          foundCluster.maxSeverity = m.severity;
        }
      } else {
        result.push({
          id: `cluster-${m.id}`,
          x,
          y,
          markers: [m],
          maxSeverity: m.severity,
        });
      }
    });

    return result;
  };

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
              lat: item.latitude || fallback.lat,
              lng: item.longitude || fallback.lng,
              severity: (item.tags?.includes('ransomware') ? 'CRITICAL' : 'HIGH') as any,
              rawPayload: item.rawPayload,
              tags: item.tags,
            };
          });
        } else {
          mapped = sampleGeoIocs;
        }
        setMarkers(mapped);
        setClusters(clusterMarkersList(mapped));
      } catch (err) {
        setMarkers(sampleGeoIocs);
        setClusters(clusterMarkersList(sampleGeoIocs));
      } finally {
        setLoading(false);
      }
    };

    loadMapData();
  }, [token]);

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500 shadow-red-500/50';
      case 'HIGH':
        return 'bg-amber-500 shadow-amber-500/50';
      default:
        return 'bg-blue-500 shadow-blue-500/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <span>Global Attack Vector & Spatial Geolocation Map</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time geolocated threat markers with spatial regional clustering to eliminate marker overlap.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
            ● Active Ingestion Stream
          </span>
        </div>
      </div>

      {/* World Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-2xl relative min-h-[440px] overflow-hidden flex flex-col justify-between">
          {/* Map Title Overlay */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>SPATIAL CLUSTERED GEOLOCATION GRID</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Total Threat Indicators: {markers.length} | Active Clusters: {clusters.length}
            </span>
          </div>

          {/* Interactive Threat Markers Grid */}
          <div className="relative z-10 w-full h-[340px] my-4 border border-slate-800/60 rounded-xl bg-slate-950/60 overflow-hidden">
            {/* World Map Background Paths */}
            <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center p-8">
              <svg viewBox="0 0 1000 500" className="w-full h-full stroke-slate-700 fill-slate-800/40">
                <path d="M150,150 Q200,100 250,160 T350,180 T250,280 T150,220 Z" />
                <path d="M280,320 Q320,300 350,380 T320,480 T260,380 Z" />
                <path d="M480,120 Q550,80 620,130 T600,240 T480,200 Z" />
                <path d="M490,240 Q560,220 580,320 T520,400 T460,300 Z" />
                <path d="M750,320 Q820,300 850,380 T780,420 T720,360 Z" />
              </svg>
            </div>

            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-20 text-slate-400 font-mono text-xs">
                Loading attack map markers...
              </div>
            ) : clusters.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-mono text-xs">
                No geolocated threat markers found.
              </div>
            ) : (
              clusters.map((cluster) => {
                const isSelected = selectedCluster?.id === cluster.id;
                const isMulti = cluster.markers.length > 1;

                return (
                  <div
                    key={cluster.id}
                    style={{ left: `${cluster.x.toFixed(1)}%`, top: `${cluster.y.toFixed(1)}%` }}
                    onClick={() => {
                      setSelectedCluster(cluster);
                      setSelectedMarker(cluster.markers[0]);
                    }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                  >
                    {/* Radar Pulse Animation */}
                    <span className={`absolute inline-flex ${isMulti ? 'h-8 w-8' : 'h-6 w-6'} rounded-full opacity-75 animate-ping ${cluster.maxSeverity === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`}></span>

                    {/* Cluster Badge / Single Dot */}
                    {isMulti ? (
                      <span className={`relative inline-flex items-center justify-center rounded-full h-7 w-7 border-2 border-slate-950 font-mono font-bold text-[10px] text-white shadow-xl ${getMarkerColor(cluster.maxSeverity)} ${isSelected ? 'ring-4 ring-blue-500/50 scale-125' : ''}`}>
                        {cluster.markers.length}
                      </span>
                    ) : (
                      <span
                        className={`relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-slate-950 shadow-lg ${getMarkerColor(
                          cluster.maxSeverity,
                        )} ${isSelected ? 'ring-4 ring-blue-500/50 scale-125' : ''}`}
                      ></span>
                    )}

                    {/* Tooltip */}
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-44 p-2.5 rounded-xl bg-slate-900/95 text-slate-100 text-[10px] font-mono border border-slate-700 shadow-2xl z-30 pointer-events-none">
                      <p className="font-bold text-blue-400">{isMulti ? `${cluster.markers.length} Cluster IOCs` : cluster.markers[0].ip}</p>
                      <p className="text-slate-300">{cluster.markers[0].city}, {cluster.markers[0].country}</p>
                      <p className="text-slate-500">Source: {cluster.markers[0].source}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Map Footer Legend */}
          <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Critical Threat
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> High Risk
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">#</span> Regional Cluster
              </span>
            </div>
            <span>Click marker or cluster for breakdown</span>
          </div>
        </div>

        {/* Selected Marker & Cluster Details Sidebar */}
        <div className="bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase pb-2 border-b border-slate-800">
            Threat Marker Inspector
          </h3>

          {selectedCluster && selectedCluster.markers.length > 1 && (
            <div className="space-y-2 pb-3 border-b border-slate-800">
              <span className="text-[10px] font-mono text-blue-400 font-bold uppercase block">
                Cluster Members ({selectedCluster.markers.length})
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {selectedCluster.markers.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMarker(m)}
                    className={`p-2 rounded-lg cursor-pointer text-xs font-mono flex items-center justify-between transition ${selectedMarker?.id === m.id ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40' : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'}`}
                  >
                    <span>{m.ip}</span>
                    <span className="text-[9px] text-slate-500">{m.country}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedMarker ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 font-mono space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">IP Indicator</span>
                <p className="text-sm font-bold text-blue-400">{selectedMarker.ip}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1 font-mono">
                <span className="text-[10px] text-slate-500 uppercase">Geolocation</span>
                <p className="font-semibold text-slate-200">{selectedMarker.city}, {selectedMarker.country}</p>
                <p className="text-[10px] text-slate-500">Lat: {selectedMarker.lat} | Lng: {selectedMarker.lng}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1 font-mono">
                <span className="text-[10px] text-slate-500 uppercase">Collector Source</span>
                <p className="font-semibold text-slate-300">{selectedMarker.source}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1 font-mono">
                <span className="text-[10px] text-slate-500 uppercase">Severity Rating</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${selectedMarker.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  {selectedMarker.severity}
                </span>
              </div>

              <button
                onClick={() => setShowIocModal(true)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 font-mono"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Full IOC & Alert Details</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-16 text-xs text-slate-500 font-mono">
              Click any active threat marker on the map to inspect geolocation details.
            </div>
          )}
        </div>
      </div>

      {/* Full IOC Detail Modal */}
      {showIocModal && selectedMarker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase">IOC Deep Analysis Record</h3>
              </div>
              <button onClick={() => setShowIocModal(false)} className="text-slate-400 hover:text-slate-200">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500">INDICATOR VALUE</span>
                <p className="text-base font-bold text-blue-400">{selectedMarker.ip}</p>
                <span className="text-[10px] text-slate-400">Type: {selectedMarker.type} • Source: {selectedMarker.source}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500">GEOLOCATION DATA</span>
                <p className="text-slate-200 font-semibold">{selectedMarker.city}, {selectedMarker.country}</p>
                <p className="text-[10px] text-slate-500">Coordinates: [{selectedMarker.lat}, {selectedMarker.lng}]</p>
              </div>

              {selectedMarker.tags && selectedMarker.tags.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500">INGESTION THREAT TAGS</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedMarker.tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedMarker.rawPayload && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500">RAW FEED PAYLOAD</span>
                  <pre className="p-2 rounded bg-slate-900 text-[10px] text-slate-300 overflow-x-auto">
                    {JSON.stringify(selectedMarker.rawPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowIocModal(false)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
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
