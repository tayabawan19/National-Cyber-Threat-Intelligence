import React, { useState, useEffect } from 'react';
import { Shield, ExternalLink, Activity, Layers, Filter, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';

interface Technique {
  id: string;
  techniqueId: string;
  name: string;
  tactic: string;
  description?: string;
  url?: string;
  observedCount: number;
}

interface AttackMatrixViewProps {
  token: string;
  onSelectTechniqueFilter?: (techniqueId: string) => void;
}

export const AttackMatrixView: React.FC<AttackMatrixViewProps> = ({ token }) => {
  const [matrixData, setMatrixData] = useState<Record<string, Technique[]>>({});
  const [meta, setMeta] = useState<{ totalTechniquesSeeded: number; totalObservedAlerts: number; tacticOrder: string[] }>({
    totalTechniquesSeeded: 0,
    totalObservedAlerts: 0,
    tacticOrder: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);
  const [showObservedOnly, setShowObservedOnly] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const fetchMatrixData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/attack-techniques/matrix`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data && data.tactics) {
        setMatrixData(data.tactics);
        setMeta(data.meta || {});
      }
    } catch (err) {
      console.error('Failed to fetch ATT&CK Matrix data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrixData();
  }, [token]);

  const getHeatIntensityClass = (count: number) => {
    if (count === 0) return 'bg-[#061008]/80 border-terminal-border/40 text-terminal-green-dim hover:border-terminal-border';
    if (count >= 5) return 'bg-red-950/80 border-red-500/80 text-red-300 shadow-md shadow-red-950/50 glow-red animate-pulse';
    if (count >= 2) return 'bg-amber-950/80 border-amber-500/80 text-amber-300 shadow-sm shadow-amber-950/50';
    return 'bg-terminal-surface/90 border-terminal-green/60 text-terminal-green text-glow-green';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0a0f0a] border border-terminal-border rounded-xl p-5 shadow-lg backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-terminal-surface border border-terminal-border text-terminal-green">
              <Layers className="w-6 h-6 text-terminal-green text-glow-green" />
            </div>
            <div>
              <h2 className="text-lg font-mono font-bold text-terminal-green text-glow-green flex items-center gap-2">
                MITRE ATT&CK® Enterprise Matrix & Heatmap
              </h2>
              <p className="text-xs text-terminal-green-dim font-mono mt-0.5">
                Real-time SOC Threat Technique Observability & Tactic Correlation Grid
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-terminal-surface border border-terminal-border text-xs font-mono text-terminal-green flex items-center gap-2">
            <span className="text-terminal-muted">Seeded Techniques:</span>
            <span className="font-bold text-terminal-green">{meta.totalTechniquesSeeded}</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/40 text-xs font-mono text-red-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Observed Alerts:</span>
            <span className="font-bold text-red-300">{meta.totalObservedAlerts}</span>
          </div>

          <button
            onClick={() => setShowObservedOnly(!showObservedOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition flex items-center gap-2 ${
              showObservedOnly
                ? 'bg-terminal-green-dark border-terminal-green text-terminal-green'
                : 'bg-terminal-surface border-terminal-border text-terminal-green-dim hover:text-terminal-green'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{showObservedOnly ? 'Show All Techniques' : 'Observed Only'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center border border-terminal-border rounded-xl bg-[#0a0f0a]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-terminal-green border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-terminal-green animate-pulse">
              Aggregating MITRE ATT&CK Telemetry Heatmap...
            </p>
          </div>
        </div>
      ) : (
        /* ATT&CK Matrix Grid */
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-12 gap-3 min-w-[1400px]">
            {(meta.tacticOrder || Object.keys(matrixData)).map((tactic) => {
              const techniques = matrixData[tactic] || [];
              const filteredTechs = showObservedOnly
                ? techniques.filter((t) => t.observedCount > 0)
                : techniques;

              return (
                <div key={tactic} className="flex flex-col gap-2">
                  {/* Tactic Column Header */}
                  <div className="p-2.5 rounded-lg bg-[#0d140d] border border-terminal-border text-center min-h-[54px] flex flex-col items-center justify-center">
                    <span className="text-[11px] font-mono font-bold text-terminal-green truncate max-w-full">
                      {tactic}
                    </span>
                    <span className="text-[9px] font-mono text-terminal-green-dim">
                      ({techniques.filter((t) => t.observedCount > 0).length}/{techniques.length} active)
                    </span>
                  </div>

                  {/* Techniques Cards Stack */}
                  <div className="flex flex-col gap-2">
                    {filteredTechs.length === 0 ? (
                      <div className="p-2 rounded border border-terminal-border/20 text-center text-[10px] text-terminal-muted italic">
                        No observed events
                      </div>
                    ) : (
                      filteredTechs.map((tech) => (
                        <div
                          key={tech.id}
                          onClick={() => setSelectedTechnique(tech)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition flex flex-col gap-1 relative group ${getHeatIntensityClass(
                            tech.observedCount,
                          )}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono font-bold tracking-wider">
                              {tech.techniqueId}
                            </span>
                            {tech.observedCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/40 border border-current">
                                {tech.observedCount}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono line-clamp-2 leading-tight">
                            {tech.name}
                          </span>

                          {/* Quick MITRE link */}
                          <a
                            href={tech.url || `https://attack.mitre.org/techniques/${tech.techniqueId}/`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition p-0.5 rounded hover:bg-white/10"
                            title={`Open MITRE page for ${tech.techniqueId}`}
                          >
                            <ExternalLink className="w-3 h-3 text-current" />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Technique Modal / Detail View */}
      {selectedTechnique && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0f0a] border border-terminal-border rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedTechnique(null)}
              className="absolute top-4 right-4 text-terminal-green-dim hover:text-terminal-green font-mono text-sm"
            >
              [✕ CLOSE]
            </button>

            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1 rounded bg-terminal-green-dark border border-terminal-border text-terminal-green text-xs font-mono font-bold">
                {selectedTechnique.techniqueId}
              </div>
              <h3 className="text-base font-mono font-bold text-terminal-green text-glow-green">
                {selectedTechnique.name}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono text-terminal-green-dim border-y border-terminal-border/50 py-3">
              <div>
                <span className="text-terminal-muted">Tactic:</span>{' '}
                <span className="text-terminal-green font-bold">{selectedTechnique.tactic}</span>
              </div>
              <div>
                <span className="text-terminal-muted">Observed Count:</span>{' '}
                <span className="text-amber-400 font-bold">{selectedTechnique.observedCount} alerts</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-mono text-terminal-muted mb-1">STIX Description</h4>
              <p className="text-xs font-mono text-terminal-green-dim leading-relaxed bg-[#050805] p-3 rounded-lg border border-terminal-border/40">
                {selectedTechnique.description || 'No detailed description available.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <a
                href={selectedTechnique.url || `https://attack.mitre.org/techniques/${selectedTechnique.techniqueId}/`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-terminal-green-dark border border-terminal-border text-terminal-green hover:bg-terminal-surface text-xs font-mono flex items-center gap-2 transition"
              >
                <span>View on MITRE ATT&CK® Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
