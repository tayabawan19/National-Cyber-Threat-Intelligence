import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  ChevronRight,
  Filter,
  FileCode,
  Tag,
  Hash,
  Database,
  ExternalLink,
  Cpu,
  Briefcase,
  Plus,
  Radio,
  Terminal,
  Zap,
} from 'lucide-react';

interface AlertsViewProps {
  token: string;
  userRole?: string;
  selectedAlertId: string | null;
  onClearSelectedAlert: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  token,
  userRole,
  selectedAlertId,
  onClearSelectedAlert,
}) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [casesList, setCasesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [flashAlertId, setFlashAlertId] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Attach to case state
  const [selectedCaseIdToAttach, setSelectedCaseIdToAttach] = useState<string>('');
  const [attaching, setAttaching] = useState(false);

  const isReadOnly = userRole === 'READ_ONLY';
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const WS_URL = API_BASE_URL.replace('/api', '');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let queryParams = new URLSearchParams();
      if (filterSeverity) queryParams.append('severity', filterSeverity);
      if (filterStatus) queryParams.append('status', filterStatus);

      const res = await fetch(`${API_BASE_URL}/alerts?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCasesList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCasesList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch cases list', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchCasesList();
  }, [filterSeverity, filterStatus, token]);

  // Real-time WebSocket setup
  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = io(WS_URL, {
        query: { token },
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('[WEBSOCKET CONNECTED] Real-time alert stream online');
        setSocketConnected(true);
      });

      socket.on('disconnect', () => {
        setSocketConnected(false);
      });

      socket.on('alert:created', (data: any) => {
        if (data && data.alert) {
          const newAlert = data.alert;
          setAlerts((prev) => {
            if (prev.some((a) => a.id === newAlert.id)) return prev;
            return [newAlert, ...prev];
          });
          setFlashAlertId(newAlert.id);
          setTimeout(() => setFlashAlertId(null), 4000);
        }
      });

      socket.on('alert:updated', (data: any) => {
        if (data && data.alert) {
          const updatedAlert = data.alert;
          setAlerts((prev) =>
            prev.map((a) => (a.id === updatedAlert.id ? { ...a, ...updatedAlert } : a)),
          );
        }
      });
    } catch (err) {
      console.error('Failed to establish WebSocket connection', err);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [token, WS_URL]);

  const fetchAlertDetail = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/alerts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data && data.id) {
        setSelectedAlert(data);
      }
    } catch (err) {
      console.error('Failed to fetch alert detail', err);
    }
  };

  useEffect(() => {
    if (selectedAlertId) {
      fetchAlertDetail(selectedAlertId);
    }
  }, [selectedAlertId]);

  const handleUpdateStatus = async (alertId: string, newStatus: 'TRIAGED' | 'RESOLVED') => {
    if (isReadOnly) return;
    try {
      const res = await fetch(`${API_BASE_URL}/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await res.json();
      setSelectedAlert(updated);
      fetchAlerts();
    } catch (err) {
      console.error('Failed to update alert status', err);
    }
  };

  const handleAttachToCase = async () => {
    if (isReadOnly || !selectedAlert || !selectedCaseIdToAttach) return;
    setAttaching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/alerts/${selectedAlert.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ relatedCaseId: selectedCaseIdToAttach }),
      });
      const updated = await res.json();
      setSelectedAlert(updated);
      setSelectedCaseIdToAttach('');
      fetchAlerts();
    } catch (err) {
      console.error('Failed to attach alert to case', err);
    } finally {
      setAttaching(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-950/80 text-red-400 border-red-500/50 glow-red';
      case 'HIGH':
        return 'bg-orange-950/80 text-orange-400 border-orange-500/50 glow-orange';
      case 'MEDIUM':
        return 'bg-yellow-950/80 text-yellow-400 border-yellow-500/50';
      default:
        return 'bg-terminal-green-dark text-terminal-green border-terminal-border';
    }
  };

  return (
    <div className="space-y-6 font-mono text-terminal-green">
      {/* Filters Header */}
      <div className="soc-card p-6 rounded-xl border border-terminal-border bg-[#0a0f0a]/90 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold font-mono text-terminal-green flex items-center gap-2 text-glow-green">
            <Radio className="w-5 h-5 text-terminal-green" />
            <span>REAL-TIME THREAT ALERTS & WEBSOCKET STREAM</span>
            <span
              className={`px-2 py-0.5 rounded text-[9px] font-mono border ${
                socketConnected
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-950/80 text-amber-400 border-amber-500/40'
              }`}
            >
              {socketConnected ? 'WS LIVE PUSH ACTIVE' : 'CONNECTING WS...'}
            </span>
          </h2>
          <p className="text-xs text-terminal-green-dim mt-0.5 font-mono">
            Deduplicated security events correlated across detection rules, ATT&CK framework, and Groq LLM Advisory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto font-mono">
          <div className="flex items-center gap-2 bg-[#050705] px-3 py-1.5 rounded border border-terminal-border text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-terminal-green" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-transparent text-terminal-green focus:outline-none text-xs font-mono"
            >
              <option value="" className="bg-[#050705]">All Severities</option>
              <option value="CRITICAL" className="bg-[#050705]">CRITICAL</option>
              <option value="HIGH" className="bg-[#050705]">HIGH</option>
              <option value="MEDIUM" className="bg-[#050705]">MEDIUM</option>
              <option value="LOW" className="bg-[#050705]">LOW</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#050705] px-3 py-1.5 rounded border border-terminal-border text-xs font-mono">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-terminal-green focus:outline-none text-xs font-mono"
            >
              <option value="" className="bg-[#050705]">All Statuses</option>
              <option value="NEW" className="bg-[#050705]">NEW</option>
              <option value="TRIAGED" className="bg-[#050705]">TRIAGED</option>
              <option value="RESOLVED" className="bg-[#050705]">RESOLVED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* Table Container */}
        <div className={`soc-card rounded-xl border border-terminal-border bg-[#0a0f0a]/90 overflow-hidden shadow-2xl ${selectedAlert ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {loading ? (
            <div className="p-16 text-center text-terminal-muted font-mono text-xs space-y-3">
              <div className="w-6 h-6 border-2 border-terminal-green border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Loading security telemetry stream...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-16 text-center text-terminal-muted font-mono text-xs space-y-2">
              <AlertTriangle className="w-8 h-8 text-terminal-muted mx-auto mb-2 opacity-50" />
              <p className="text-terminal-green font-semibold">No Security Alerts Found</p>
              <p className="text-[11px] text-terminal-green-dim">No alerts match the selected severity/status criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#050705] text-terminal-green-dim uppercase text-[10px] border-b border-terminal-border">
                  <tr>
                    <th className="py-3.5 px-4">Severity</th>
                    <th className="py-3.5 px-4">Alert Description</th>
                    <th className="py-3.5 px-4">MITRE ATT&CK®</th>
                    <th className="py-3.5 px-4">Case Linked</th>
                    <th className="py-3.5 px-4">Count</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-border/80">
                  {alerts.map((item) => {
                    const isFlashing = flashAlertId === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => fetchAlertDetail(item.id)}
                        className={`hover:bg-terminal-surface cursor-pointer transition ${
                          selectedAlert?.id === item.id ? 'bg-terminal-green-dark/60 border-l-4 border-terminal-green' : ''
                        } ${
                          isFlashing ? 'bg-amber-950/90 animate-pulse border-l-4 border-amber-400 shadow-lg shadow-amber-500/50' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(item.severity)}`}>
                            {item.severity}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="text-terminal-green font-mono font-semibold truncate max-w-md">{item.description}</p>
                            <span className="text-[10px] text-terminal-green-dim">Source: {item.source} • Rule: {item.rule?.name || 'Automated Engine'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {item.attackTechniqueIds && item.attackTechniqueIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.attackTechniqueIds.map((tId: string) => (
                                <a
                                  key={tId}
                                  href={`https://attack.mitre.org/techniques/${tId}/`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-950/80 text-purple-300 border border-purple-500/40 hover:bg-purple-900 transition flex items-center gap-1"
                                  title={`View ${tId} on MITRE ATT&CK`}
                                >
                                  <span>{tId}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-terminal-muted">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {item.relatedCase ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-terminal-green-dark text-terminal-green border border-terminal-border font-semibold truncate max-w-[120px] inline-block">
                              {item.relatedCase.title}
                            </span>
                          ) : (
                            <span className="text-[10px] text-terminal-muted">Unlinked</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#050705] text-terminal-green border border-terminal-border font-bold">
                            x{item.occurrenceCount || 1}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.status === 'NEW' ? 'bg-amber-950/80 text-amber-400 border-amber-500/40' : item.status === 'TRIAGED' ? 'bg-terminal-green-dark text-terminal-green border-terminal-border' : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'}`}>
                            {item.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-terminal-green-dim">
                          <ChevronRight className="w-4 h-4 text-terminal-green" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Alert Side Drawer */}
        {selectedAlert && (
          <div className="soc-card p-6 rounded-xl border border-terminal-border bg-[#0a0f0a] shadow-2xl space-y-5 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-terminal-border">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(selectedAlert.severity)}`}>
                  {selectedAlert.severity}
                </span>
                {selectedAlert.llmSuggestedSeverity && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950/80 text-purple-400 border border-purple-500/40 font-bold">
                    LLM Advisory: {selectedAlert.llmSuggestedSeverity}
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedAlert(null);
                  onClearSelectedAlert();
                }}
                className="text-terminal-green-dim hover:text-terminal-green"
              >
                Close
              </button>
            </div>

            {/* MITRE ATT&CK Badges in Drawer */}
            {selectedAlert.attackTechniqueIds && selectedAlert.attackTechniqueIds.length > 0 && (
              <div className="p-3 rounded-lg bg-[#050705] border border-purple-500/30 space-y-2">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                  MITRE ATT&CK® TECHNIQUE MAPPING
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedAlert.attackTechniqueIds.map((tId: string) => (
                    <a
                      key={tId}
                      href={`https://attack.mitre.org/techniques/${tId}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded text-xs font-mono bg-purple-950 text-purple-300 border border-purple-500/50 hover:bg-purple-900 transition flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      <span>{tId}</span>
                      <ExternalLink className="w-3 h-3 text-purple-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Groq AI Copilot Summary Box */}
            {selectedAlert.llmExplanation && (
              <div className="p-4 rounded-lg bg-[#050705] border border-terminal-border space-y-2 font-mono glow-green">
                <div className="flex items-center gap-2 text-terminal-green text-[10px] font-bold uppercase tracking-wider text-glow-green">
                  <Cpu className="w-4 h-4 text-terminal-green" />
                  <span>[AI_COPILOT_ADVISORY_STDOUT]</span>
                </div>
                <p className="text-xs text-terminal-green leading-relaxed font-mono">{selectedAlert.llmExplanation}</p>
              </div>
            )}

            {/* Linked Case Banner */}
            {selectedAlert.relatedCase ? (
              <div className="p-3 rounded-lg bg-terminal-green-dark border border-terminal-border flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-terminal-green">
                  <Briefcase className="w-4 h-4" />
                  <span className="font-bold">Linked Case:</span>
                  <span className="text-terminal-green font-semibold">{selectedAlert.relatedCase.title}</span>
                </div>
              </div>
            ) : (
              !isReadOnly && (
                <div className="p-3 rounded-lg bg-[#050705] border border-terminal-border space-y-2 font-mono">
                  <span className="text-[10px] font-bold text-terminal-green-dim uppercase tracking-wider block">ATTACH TO INVESTIGATION CASE</span>
                  <div className="flex items-center gap-2 font-mono">
                    <select
                      value={selectedCaseIdToAttach}
                      onChange={(e) => setSelectedCaseIdToAttach(e.target.value)}
                      className="flex-1 bg-[#050705] text-terminal-green text-xs rounded px-2.5 py-1.5 border border-terminal-border focus:outline-none font-mono"
                    >
                      <option value="">-- Select Open Case --</option>
                      {casesList.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#050705]">
                          {c.title} ({c.severity})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAttachToCase}
                      disabled={attaching || !selectedCaseIdToAttach}
                      className="px-3 py-1.5 rounded bg-terminal-green-dark hover:bg-terminal-border text-terminal-green font-bold text-xs transition disabled:opacity-50 flex items-center gap-1 font-mono border border-terminal-border"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Link</span>
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Relational Correlation Breakdown */}
            <div className="p-4 rounded-lg bg-[#050705] border border-terminal-border space-y-3 font-mono">
              <span className="text-[10px] font-bold text-terminal-green-dim uppercase tracking-wider block">RELATIONAL CORRELATION BREAKDOWN</span>

              {selectedAlert.sourceIoc && (
                <div className="space-y-1 text-xs font-mono">
                  <span className="text-terminal-green font-bold block">Source IOC: {selectedAlert.sourceIoc.value}</span>
                  <p className="text-terminal-green-dim text-[10px]">Type: {selectedAlert.sourceIoc.type} • Tags: {(selectedAlert.sourceIoc.tags || []).join(', ') || 'None'}</p>
                </div>
              )}

              {selectedAlert.sourceCve && (
                <div className="space-y-1 text-xs pt-2 border-t border-terminal-border font-mono">
                  <span className="text-purple-400 font-bold block">Correlated CVE: {selectedAlert.sourceCve.cveId}</span>
                  <p className="text-terminal-green text-[11px] font-mono">{selectedAlert.sourceCve.description}</p>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-red-950/80 text-red-400 border border-red-500/40 font-bold">
                    CVSS Score: {selectedAlert.sourceCve.cvssScore ?? 'N/A'}
                  </span>
                </div>
              )}

              {selectedAlert.sourceMalware && (
                <div className="space-y-1 text-xs pt-2 border-t border-terminal-border font-mono">
                  <span className="text-terminal-green font-bold block">Correlated Malware: {selectedAlert.sourceMalware.name}</span>
                  <p className="text-terminal-green-dim text-[10px]">Family: {selectedAlert.sourceMalware.malwareFamily || 'Unknown'} • SHA256: {selectedAlert.sourceMalware.hashSha256}</p>
                </div>
              )}
            </div>

            {/* Triage Action Buttons - Render ONLY if not READ_ONLY */}
            {!isReadOnly && (
              <div className="pt-2 flex items-center gap-3 font-mono">
                {selectedAlert.status !== 'TRIAGED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'TRIAGED')}
                    className="flex-1 py-2.5 rounded-lg bg-terminal-green-dark hover:bg-terminal-border text-terminal-green font-bold transition flex items-center justify-center gap-2 font-mono border border-terminal-border"
                  >
                    <Shield className="w-4 h-4 text-terminal-green" />
                    <span>Acknowledge</span>
                  </button>
                )}

                {selectedAlert.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'RESOLVED')}
                    className="flex-1 py-2.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-400 font-bold transition flex items-center justify-center gap-2 font-mono border border-emerald-500/40"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Resolve Alert</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
