import React, { useState, useEffect } from 'react';
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

  // Attach to case state
  const [selectedCaseIdToAttach, setSelectedCaseIdToAttach] = useState<string>('');
  const [attaching, setAttaching] = useState(false);

  const isReadOnly = userRole === 'READ_ONLY';
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Threat Alerts & AI Copilot Stream</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deduplicated threat alerts evaluated by Detection Engine & Groq LLM Advisory Scorer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none font-mono text-xs"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none font-mono text-xs"
            >
              <option value="">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="TRIAGED">TRIAGED</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Container */}
        <div className={`bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-xl ${selectedAlert ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {loading ? (
            <div className="p-16 text-center text-slate-500 font-mono text-xs space-y-3">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Loading security alerts stream...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-16 text-center text-slate-500 font-mono text-xs space-y-2">
              <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              <p className="text-slate-400 font-semibold">No Security Alerts Found</p>
              <p className="text-[11px] text-slate-600">No alerts match the selected severity/status criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Alert Description</th>
                    <th className="py-3 px-4">Case Linked</th>
                    <th className="py-3 px-4">Occurrences</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {alerts.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => fetchAlertDetail(item.id)}
                      className={`hover:bg-slate-800/50 cursor-pointer transition ${selectedAlert?.id === item.id ? 'bg-slate-800/80 border-l-2 border-amber-400' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(item.severity)}`}>
                          {item.severity}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="text-slate-200 font-semibold truncate max-w-md">{item.description}</p>
                          <span className="text-[10px] text-slate-500">Source: {item.source} • Rule: {item.rule?.name || 'Automated'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {item.relatedCase ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold truncate max-w-[120px] inline-block">
                            {item.relatedCase.title}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600">Unlinked</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-blue-400 border border-slate-700 font-bold">
                          x{item.occurrenceCount || 1}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'NEW' ? 'bg-amber-500/10 text-amber-400' : item.status === 'TRIAGED' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        <ChevronRight className="w-4 h-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Alert Side Drawer */}
        {selectedAlert && (
          <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-5 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(selectedAlert.severity)}`}>
                  {selectedAlert.severity}
                </span>
                {selectedAlert.llmSuggestedSeverity && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                    LLM Advisory: {selectedAlert.llmSuggestedSeverity}
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedAlert(null);
                  onClearSelectedAlert();
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>

            {/* Groq AI Copilot Summary Box */}
            {selectedAlert.llmExplanation && (
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  <Cpu className="w-4 h-4" />
                  <span>GROQ AI COPILOT EXECUTIVE SUMMARY</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">{selectedAlert.llmExplanation}</p>
              </div>
            )}

            {/* Linked Case Banner */}
            {selectedAlert.relatedCase ? (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-blue-400">
                  <Briefcase className="w-4 h-4" />
                  <span className="font-bold">Linked to Case:</span>
                  <span className="text-slate-200 font-semibold">{selectedAlert.relatedCase.title}</span>
                </div>
              </div>
            ) : (
              !isReadOnly && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ATTACH TO INVESTIGATION CASE</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedCaseIdToAttach}
                      onChange={(e) => setSelectedCaseIdToAttach(e.target.value)}
                      className="flex-1 bg-slate-900 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none"
                    >
                      <option value="">-- Select Open Case --</option>
                      {casesList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.severity})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAttachToCase}
                      disabled={attaching || !selectedCaseIdToAttach}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Link</span>
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Relational Correlation Breakdown */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RELATIONAL CORRELATION BREAKDOWN</span>

              {selectedAlert.sourceIoc && (
                <div className="space-y-1 text-xs">
                  <span className="text-blue-400 font-bold block">Source IOC: {selectedAlert.sourceIoc.value}</span>
                  <p className="text-slate-400 text-[10px]">Type: {selectedAlert.sourceIoc.type} • Tags: {(selectedAlert.sourceIoc.tags || []).join(', ') || 'None'}</p>
                </div>
              )}

              {selectedAlert.sourceCve && (
                <div className="space-y-1 text-xs pt-2 border-t border-slate-800/60">
                  <span className="text-purple-400 font-bold block">Correlated CVE: {selectedAlert.sourceCve.cveId}</span>
                  <p className="text-slate-300 text-[11px]">{selectedAlert.sourceCve.description}</p>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                    CVSS Score: {selectedAlert.sourceCve.cvssScore ?? 'N/A'}
                  </span>
                </div>
              )}

              {selectedAlert.sourceMalware && (
                <div className="space-y-1 text-xs pt-2 border-t border-slate-800/60">
                  <span className="text-cyan-400 font-bold block">Correlated Malware Sample: {selectedAlert.sourceMalware.name}</span>
                  <p className="text-slate-400 text-[10px]">Family: {selectedAlert.sourceMalware.malwareFamily || 'Unknown'} • SHA256: {selectedAlert.sourceMalware.hashSha256}</p>
                </div>
              )}
            </div>

            {/* Triage Action Buttons - Render ONLY if not READ_ONLY */}
            {!isReadOnly && (
              <div className="pt-2 flex items-center gap-3">
                {selectedAlert.status !== 'TRIAGED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'TRIAGED')}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Acknowledge</span>
                  </button>
                )}

                {selectedAlert.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'RESOLVED')}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
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
