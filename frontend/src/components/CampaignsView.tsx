import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  Layers,
  ChevronRight,
  AlertTriangle,
  Database,
  FileCode,
  Tag,
  RefreshCw,
  Activity,
  ExternalLink,
  Cpu,
  CheckCircle2,
} from 'lucide-react';

interface CampaignItem {
  id: string;
  name: string;
  description: string;
  status: string;
  firstSeen: string;
  lastSeen: string;
  attackTechniqueIds: string[];
  confidence: number;
  entityCounts: {
    alerts: number;
    iocs: number;
    malwareSamples: number;
    totalEntities: number;
  };
}

interface CampaignsViewProps {
  token: string;
  userRole?: string;
  onSelectAlert?: (alertId: string) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({ token, userRole, onSelectAlert }) => {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [clusteringRunning, setClusteringRunning] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const isReadOnly = userRole === 'READ_ONLY';

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !selectedCampaign) {
        fetchCampaignDetail(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignDetail = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data && data.id) {
        setSelectedCampaign(data);
      }
    } catch (err) {
      console.error('Failed to fetch campaign detail', err);
    }
  };

  const handleRunClustering = async () => {
    if (isReadOnly) return;
    setClusteringRunning(true);
    try {
      await fetch(`${API_BASE_URL}/campaigns/cluster`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCampaigns();
    } catch (err) {
      console.error('Failed to run campaign clustering', err);
    } finally {
      setClusteringRunning(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [token]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0a0f0a] border border-terminal-border rounded-xl p-5 shadow-lg backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-terminal-surface border border-terminal-border text-terminal-green">
            <ShieldAlert className="w-6 h-6 text-terminal-green text-glow-green" />
          </div>
          <div>
            <h2 className="text-lg font-mono font-bold text-terminal-green text-glow-green flex items-center gap-2">
              Threat Campaign Intelligence & Correlation Engine
            </h2>
            <p className="text-xs text-terminal-green-dim font-mono mt-0.5">
              Heuristic Rule-Based Alert, Infrastructure, and Malware Family Campaign Timelines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunClustering}
            disabled={clusteringRunning || isReadOnly}
            className="px-4 py-2 rounded-lg bg-terminal-green-dark border border-terminal-border text-terminal-green hover:bg-terminal-surface text-xs font-mono flex items-center gap-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${clusteringRunning ? 'animate-spin' : ''}`} />
            <span>{clusteringRunning ? 'Clustering Telemetry...' : 'Run Clustering Engine'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center border border-terminal-border rounded-xl bg-[#0a0f0a]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-terminal-green border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-terminal-green animate-pulse">
              Running Heuristic Threat Campaign Aggregation...
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Campaign Selector Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-mono text-terminal-muted uppercase tracking-wider px-1">
              Active Campaigns ({campaigns.length})
            </h3>

            {campaigns.length === 0 ? (
              <div className="p-6 border border-terminal-border rounded-xl bg-[#0a0f0a] text-center text-xs font-mono text-terminal-muted">
                No active threat campaigns detected. Click &quot;Run Clustering Engine&quot; to scan telemetry.
              </div>
            ) : (
              campaigns.map((campaign) => {
                const isSelected = selectedCampaign?.id === campaign.id;
                return (
                  <div
                    key={campaign.id}
                    onClick={() => fetchCampaignDetail(campaign.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col gap-2 relative ${
                      isSelected
                        ? 'bg-terminal-surface border-terminal-green text-terminal-green shadow-md shadow-terminal-green-dark/30'
                        : 'bg-[#0a0f0a] border-terminal-border/60 text-terminal-green-dim hover:border-terminal-border hover:text-terminal-green'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold truncate max-w-[200px]">
                        {campaign.name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-purple-950/80 border border-purple-500/40 text-purple-300">
                        {Math.round(campaign.confidence * 100)}% Conf
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-terminal-green-dim line-clamp-2 leading-relaxed">
                      {campaign.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-terminal-border/40 text-[10px] font-mono text-terminal-muted">
                      <span>Alerts: <strong className="text-terminal-green">{campaign.entityCounts?.alerts || 0}</strong></span>
                      <span>•</span>
                      <span>IOCs: <strong className="text-terminal-green">{campaign.entityCounts?.iocs || 0}</strong></span>
                      <span>•</span>
                      <span>Malware: <strong className="text-terminal-green">{campaign.entityCounts?.malwareSamples || 0}</strong></span>
                    </div>

                    {campaign.attackTechniqueIds && campaign.attackTechniqueIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {campaign.attackTechniqueIds.map((tId) => (
                          <span
                            key={tId}
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-terminal-green-dark border border-terminal-border text-terminal-green"
                          >
                            {tId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Campaign Detailed View */}
          <div className="lg:col-span-8">
            {selectedCampaign ? (
              <div className="bg-[#0a0f0a] border border-terminal-border rounded-xl p-6 space-y-6 shadow-xl">
                {/* Title & Heuristic Badges */}
                <div className="space-y-2 border-b border-terminal-border pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-lg font-mono font-bold text-terminal-green text-glow-green">
                      {selectedCampaign.name}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-mono bg-purple-950 border border-purple-500 text-purple-300">
                      Heuristic Cluster Confidence: {Math.round(selectedCampaign.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs font-mono text-terminal-green-dim leading-relaxed">
                    {selectedCampaign.description}
                  </p>
                </div>

                {/* Clustering Logic Explanation */}
                <div className="p-4 rounded-lg bg-[#050805] border border-terminal-border/50 space-y-2">
                  <h4 className="text-xs font-mono font-bold text-terminal-green flex items-center gap-2">
                    <Activity className="w-4 h-4 text-terminal-green" />
                    <span>Clustering Engine Rationale</span>
                  </h4>
                  <ul className="text-xs font-mono text-terminal-green-dim space-y-1 list-disc list-inside">
                    <li>Grouped based on identical malware family telemetry and ATT&CK technique overlap.</li>
                    <li>Correlated alert triggers across AlienVault OTX, Feodo Tracker, and MISP threat feeds.</li>
                  </ul>
                </div>

                {/* Activity Timeline & Linked Entities */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold text-terminal-green uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-terminal-green" />
                    <span>Campaign Activity Timeline & Linked Telemetry</span>
                  </h4>

                  {/* Linked Alerts */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-mono text-terminal-muted flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Correlated Alerts ({selectedCampaign.alerts?.length || 0})</span>
                    </h5>

                    <div className="space-y-2">
                      {selectedCampaign.alerts?.map((alert: any) => (
                        <div
                          key={alert.id}
                          onClick={() => onSelectAlert && onSelectAlert(alert.id)}
                          className="p-3 rounded-lg bg-[#0d140d] border border-terminal-border/60 hover:border-terminal-border cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-red-950 text-red-400 border border-red-500/40">
                                {alert.severity}
                              </span>
                              <span className="text-xs font-mono font-bold text-terminal-green">
                                {alert.description}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-terminal-green-dim mt-1">
                              Source: {alert.source} • Last Seen: {new Date(alert.lastSeen).toLocaleString()}
                            </p>
                          </div>

                          {alert.attackTechniqueIds && alert.attackTechniqueIds.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {alert.attackTechniqueIds.map((tId: string) => (
                                <span
                                  key={tId}
                                  className="px-2 py-0.5 rounded text-[9px] font-mono bg-terminal-green-dark text-terminal-green border border-terminal-border"
                                >
                                  {tId}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Linked IOCs */}
                  {selectedCampaign.iocs && selectedCampaign.iocs.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h5 className="text-xs font-mono text-terminal-muted flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-terminal-green" />
                        <span>Associated Threat Indicators ({selectedCampaign.iocs.length})</span>
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedCampaign.iocs.map((ioc: any) => (
                          <div key={ioc.id} className="p-2.5 rounded-lg bg-[#050805] border border-terminal-border/40 text-xs font-mono space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-terminal-surface text-terminal-green border border-terminal-border">
                                {ioc.type}
                              </span>
                              <span className="text-[10px] text-terminal-muted">{ioc.source}</span>
                            </div>
                            <div className="font-bold text-terminal-green text-glow-green truncate">
                              {ioc.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Linked Malware Samples */}
                  {selectedCampaign.malwareSamples && selectedCampaign.malwareSamples.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h5 className="text-xs font-mono text-terminal-muted flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-purple-400" />
                        <span>Associated Malware Artifacts ({selectedCampaign.malwareSamples.length})</span>
                      </h5>
                      <div className="grid grid-cols-1 gap-2">
                        {selectedCampaign.malwareSamples.map((malware: any) => (
                          <div key={malware.id} className="p-3 rounded-lg bg-[#050805] border border-purple-500/30 text-xs font-mono flex items-center justify-between gap-3">
                            <div>
                              <div className="font-bold text-purple-300 flex items-center gap-2">
                                <span>{malware.name}</span>
                                {malware.malwareFamily && (
                                  <span className="px-2 py-0.5 rounded text-[9px] bg-purple-950 border border-purple-500/40 text-purple-400">
                                    Family: {malware.malwareFamily}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-terminal-muted truncate mt-0.5">
                                SHA256: {malware.hashSha256}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border border-terminal-border rounded-xl bg-[#0a0f0a] text-xs font-mono text-terminal-muted">
                Select a campaign from the sidebar to inspect telemetry breakdown.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
