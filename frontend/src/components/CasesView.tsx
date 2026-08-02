import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Clock,
  UserCheck,
  AlertTriangle,
  Database,
  FileCode,
  Shield,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Activity,
  Search,
  Filter,
  ChevronRight,
  Send,
  Calendar,
} from 'lucide-react';

interface CasesViewProps {
  token: string;
  userRole?: string;
}

export const CasesView: React.FC<CasesViewProps> = ({ token, userRole }) => {
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'alerts' | 'iocs' | 'cves' | 'malware' | 'timeline'>('overview');

  // New Case Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSeverity, setNewSeverity] = useState('MEDIUM');

  // New Note State
  const [newNote, setNewNote] = useState('');
  const [sendingNote, setSendingNote] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  const isReadOnly = userRole === 'READ_ONLY';
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch cases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [token]);

  const fetchCaseDetail = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/cases/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data && data.id) {
        setSelectedCase(data);
        fetchCaseTimeline(id);
      }
    } catch (err) {
      console.error('Failed to fetch case detail', err);
    }
  };

  const fetchCaseTimeline = async (id: string) => {
    setTimelineLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cases/${id}/timeline`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTimeline(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch case timeline', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !newTitle) return;

    try {
      const res = await fetch(`${API_BASE_URL}/cases`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          severity: newSeverity,
          status: 'OPEN',
        }),
      });
      const created = await res.json();
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      fetchCases();
      if (created?.id) fetchCaseDetail(created.id);
    } catch (err) {
      console.error('Failed to create case', err);
    }
  };

  const handleUpdateStatus = async (caseId: string, newStatus: string) => {
    if (isReadOnly) return;
    try {
      const res = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await res.json();
      setSelectedCase((prev: any) => (prev ? { ...prev, status: updated.status } : null));
      fetchCases();
      fetchCaseTimeline(caseId);
    } catch (err) {
      console.error('Failed to update case status', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !newNote.trim() || !selectedCase) return;

    setSendingNote(true);
    try {
      await fetch(`${API_BASE_URL}/cases/${selectedCase.id}/notes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note: newNote.trim() }),
      });
      setNewNote('');
      fetchCaseTimeline(selectedCase.id);
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setSendingNote(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'CLOSED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const filteredCases = cases.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterSeverity && c.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-400" />
            <span>SOC Investigation Workflows & Case Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Correlate security alerts, IOC indicators, CVE vulnerabilities, and malware artifacts in centralized case files.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isReadOnly && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Case</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Cases List & Case Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cases List Table */}
        <div className={`bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-xl ${selectedCase ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Investigation Cases ({filteredCases.length})
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-1 rounded border border-slate-700 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs space-y-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Loading investigation cases...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-mono text-xs space-y-2">
              <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              <p className="text-slate-400 font-semibold">No Investigation Cases Found</p>
              <p className="text-[11px] text-slate-600">Create a case or attach an alert from the stream to start an investigation.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 max-h-[700px] overflow-y-auto">
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => fetchCaseDetail(c.id)}
                  className={`p-4 hover:bg-slate-800/60 cursor-pointer transition space-y-2 ${selectedCase?.id === c.id ? 'bg-slate-800/80 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(c.severity)}`}>
                      {c.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{c.title}</h4>
                  {c.description && <p className="text-[11px] text-slate-400 line-clamp-2">{c.description}</p>}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>Alerts: {c.alerts?.length || 0} • IOCs: {c.iocs?.length || 0}</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Case Detail & Linked Entities Workspace */}
        {selectedCase ? (
          <div className="lg:col-span-2 bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
            {/* Case Header & Triage Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(selectedCase.severity)}`}>
                    {selectedCase.severity}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(selectedCase.status)}`}>
                    {selectedCase.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100">{selectedCase.title}</h3>
                <p className="text-xs text-slate-400">{selectedCase.description || 'No description provided.'}</p>
              </div>

              {!isReadOnly && (
                <div className="flex items-center gap-2">
                  {selectedCase.status !== 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedCase.id, 'IN_PROGRESS')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition"
                    >
                      Set In Progress
                    </button>
                  )}
                  {selectedCase.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedCase.id, 'CLOSED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                    >
                      Close Case
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-200"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveDetailTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${activeDetailTab === 'overview' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveDetailTab('alerts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${activeDetailTab === 'alerts' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Alerts ({selectedCase.alerts?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveDetailTab('iocs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${activeDetailTab === 'iocs' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>IOCs ({selectedCase.iocs?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveDetailTab('cves')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${activeDetailTab === 'cves' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>CVEs ({selectedCase.cves?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveDetailTab('malware')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${activeDetailTab === 'malware' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Malware ({selectedCase.malwareSamples?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveDetailTab('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${activeDetailTab === 'timeline' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Audit Timeline ({timeline.length})</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeDetailTab === 'overview' && (
              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">CASE ID</span>
                    <span className="text-slate-300 font-bold truncate block">{selectedCase.id}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">ASSIGNED ANALYST</span>
                    <span className="text-slate-300 font-bold block">{selectedCase.assignedTo?.email || 'Unassigned'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">CREATED DATE</span>
                    <span className="text-slate-300 font-bold block">{new Date(selectedCase.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">LAST UPDATED</span>
                    <span className="text-slate-300 font-bold block">{new Date(selectedCase.updatedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">INVESTIGATION SUMMARY & SCOPE</span>
                  <p className="text-slate-200 font-sans text-xs leading-relaxed">{selectedCase.description || 'No detailed scope available.'}</p>
                </div>
              </div>
            )}

            {/* TAB 2: LINKED ALERTS */}
            {activeDetailTab === 'alerts' && (
              <div className="space-y-3">
                {(!selectedCase.alerts || selectedCase.alerts.length === 0) ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-mono">No alerts linked to this case yet.</div>
                ) : (
                  selectedCase.alerts.map((alert: any) => (
                    <div key={alert.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className="text-slate-500 text-[10px]">Status: {alert.status}</span>
                      </div>
                      <p className="text-slate-200 font-semibold font-sans">{alert.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                        <span>Source: {alert.source}</span>
                        {alert.sourceIoc && <span className="text-blue-400">IOC: {alert.sourceIoc.value}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: LINKED IOCS */}
            {activeDetailTab === 'iocs' && (
              <div className="space-y-3">
                {(!selectedCase.iocs || selectedCase.iocs.length === 0) ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-mono">No direct IOCs linked to this case.</div>
                ) : (
                  selectedCase.iocs.map((ioc: any) => (
                    <div key={ioc.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-400 font-bold text-sm">{ioc.value}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                          {ioc.type}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px]">Source: {ioc.source} • Geolocation: {ioc.city ? `${ioc.city}, ${ioc.country}` : 'Global/N/A'}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: LINKED CVES */}
            {activeDetailTab === 'cves' && (
              <div className="space-y-3">
                {(!selectedCase.cves || selectedCase.cves.length === 0) ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-mono">No CVE vulnerabilities associated with this case.</div>
                ) : (
                  selectedCase.cves.map((cve: any) => (
                    <div key={cve.id || cve.cveId} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-400 font-bold text-sm">{cve.cveId}</span>
                        <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-[10px]">
                          CVSS {cve.cvssScore ?? 'N/A'}
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans text-xs">{cve.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 5: LINKED MALWARE */}
            {activeDetailTab === 'malware' && (
              <div className="space-y-3">
                {(!selectedCase.malwareSamples || selectedCase.malwareSamples.length === 0) ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-mono">No malware samples linked to this case.</div>
                ) : (
                  selectedCase.malwareSamples.map((m: any) => (
                    <div key={m.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-300 font-bold text-sm">{m.name}</span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px]">
                          Family: {m.malwareFamily || 'Unknown'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px]">SHA256: {m.hashSha256}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 6: AUDIT LOG TIMELINE */}
            {activeDetailTab === 'timeline' && (
              <div className="space-y-4 text-xs font-mono">
                {/* Notes Entry Form */}
                {!isReadOnly && (
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add an investigation note to timeline..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={sendingNote || !newNote.trim()}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 transition disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Note</span>
                    </button>
                  </form>
                )}

                {timelineLoading ? (
                  <div className="p-8 text-center text-slate-500">Loading audit log timeline...</div>
                ) : timeline.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No audit log timeline entries recorded yet.</div>
                ) : (
                  <div className="relative pl-6 space-y-4 border-l-2 border-slate-800 my-4">
                    {timeline.map((item) => (
                      <div key={item.id} className="relative group">
                        <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="text-blue-400 font-bold">{item.user?.email || 'System'}</span>
                            <span>{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-200 text-xs font-mono font-semibold">{item.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center min-h-[400px]">
            <Briefcase className="w-12 h-12 text-slate-700 mb-3" />
            <p className="text-slate-300 font-bold text-sm">No Case Selected</p>
            <p className="text-slate-500 mt-1 max-w-sm">Select an investigation case from the list on the left to inspect linked alerts, IOCs, CVEs, malware, and audit log history.</p>
          </div>
        )}
      </div>

      {/* Create Case Modal */}
      {showCreateModal && !isReadOnly && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 font-mono">Create Security Case</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Case Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. APT29 Spear-phishing Campaign"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Case Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed description of threat scope..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Severity Rating</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-600/20"
                >
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
