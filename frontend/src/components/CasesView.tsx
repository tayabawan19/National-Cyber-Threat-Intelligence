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
  FileText,
  Lock,
  FileSearch,
  Zap,
  Cpu,
} from 'lucide-react';

interface CasesViewProps {
  token: string;
  userRole?: string;
}

export const CasesView: React.FC<CasesViewProps> = ({ token, userRole }) => {
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [forensicArtifacts, setForensicArtifacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [forensicsLoading, setForensicsLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'alerts' | 'iocs' | 'cves' | 'malware' | 'timeline' | 'forensics' | 'report'>('overview');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportAudienceTab, setReportAudienceTab] = useState<'exec' | 'tech'>('exec');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const handleGenerateReport = async (caseId: string) => {
    setGeneratingReport(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cases/${caseId}/generate-report`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedCase(updated);
        setActiveDetailTab('report');
      } else {
        alert('Failed to generate incident report');
      }
    } catch (err: any) {
      alert(`Report generation error: ${err.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  // New Case Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSeverity, setNewSeverity] = useState('MEDIUM');

  // Forensics Modals State
  const [showArtifactModal, setShowArtifactModal] = useState(false);
  const [artifactType, setArtifactType] = useState('LOG_FILE');
  const [artifactDesc, setArtifactDesc] = useState('');
  const [artifactHash, setArtifactHash] = useState('');
  const [initialAction, setInitialAction] = useState('Collected and attached to investigation case');

  const [selectedArtifactForCustody, setSelectedArtifactForCustody] = useState<any | null>(null);
  const [showCustodyModal, setShowCustodyModal] = useState(false);
  const [custodyActionText, setCustodyActionText] = useState('');

  // New Note State
  const [newNote, setNewNote] = useState('');
  const [sendingNote, setSendingNote] = useState(false);

  // RBAC Permission Check
  const canManageForensics = userRole === 'INVESTIGATOR' || userRole === 'ADMIN';

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  const isReadOnly = userRole === 'READ_ONLY';

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
        fetchForensics(id);
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

  const fetchForensics = async (caseId: string) => {
    setForensicsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/forensics/cases/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setForensicArtifacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch forensic artifacts', err);
    } finally {
      setForensicsLoading(false);
    }
  };

  const handleAddArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageForensics || !selectedCase) return;

    try {
      const res = await fetch(`${API_BASE_URL}/forensics/artifacts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: selectedCase.id,
          artifactType,
          description: artifactDesc,
          hash: artifactHash,
          initialAction,
        }),
      });

      if (res.ok) {
        setShowArtifactModal(false);
        setArtifactDesc('');
        setArtifactHash('');
        fetchForensics(selectedCase.id);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to add forensic artifact');
      }
    } catch (err) {
      console.error('Error adding forensic artifact', err);
    }
  };

  const handleAppendCustody = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageForensics || !selectedArtifactForCustody || !custodyActionText) return;

    try {
      const res = await fetch(`${API_BASE_URL}/forensics/artifacts/${selectedArtifactForCustody.id}/custody`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: custodyActionText,
        }),
      });

      if (res.ok) {
        setShowCustodyModal(false);
        setCustodyActionText('');
        setSelectedArtifactForCustody(null);
        if (selectedCase) fetchForensics(selectedCase.id);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to append chain-of-custody action');
      }
    } catch (err) {
      console.error('Error appending chain of custody', err);
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
        return 'bg-red-950/60 text-red-400 border-red-500/40 glow-red';
      case 'HIGH':
        return 'bg-orange-950/60 text-orange-400 border-orange-500/40 glow-orange';
      case 'MEDIUM':
        return 'bg-amber-950/60 text-amber-400 border-amber-500/40';
      default:
        return 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-amber-950/60 text-amber-400 border-amber-500/40';
      case 'IN_PROGRESS':
        return 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40';
      case 'CLOSED':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  const filteredCases = cases.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterSeverity && c.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="space-y-6 font-mono text-terminal-green">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 soc-card p-6 rounded-xl border border-terminal-border bg-[#0a0f0a]/90">
        <div>
          <h2 className="text-sm font-bold font-mono text-terminal-green flex items-center gap-2 text-glow-green">
            <Briefcase className="w-5 h-5 text-terminal-green" />
            <span>SOC INVESTIGATION WORKFLOWS & CASE MANAGEMENT</span>
          </h2>
          <p className="text-xs text-terminal-green-dim mt-0.5 font-mono">
            Correlate security alerts, IOC indicators, CVE vulnerabilities, and malware artifacts in centralized case files.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          {!isReadOnly && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-lg bg-terminal-green-dark hover:bg-terminal-border text-terminal-green text-xs font-bold shadow-lg flex items-center gap-2 transition border border-terminal-border"
            >
              <Plus className="w-4 h-4 text-terminal-green" />
              <span>Create Security Case</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Cases List & Case Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* Left Column: Cases List Table */}
        <div className={`soc-card rounded-xl border border-terminal-border bg-[#0a0f0a]/90 overflow-hidden shadow-2xl ${selectedCase ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
          <div className="p-4 border-b border-terminal-border flex items-center justify-between gap-3 font-mono">
            <h3 className="text-xs font-bold text-terminal-green uppercase tracking-wider text-glow-green">
              Investigation Cases ({filteredCases.length})
            </h3>
            <div className="flex items-center gap-2 font-mono">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#050705] text-terminal-green text-[10px] font-mono px-2 py-1 rounded border border-terminal-border focus:outline-none"
              >
                <option value="" className="bg-[#050705]">All Statuses</option>
                <option value="OPEN" className="bg-[#050705]">OPEN</option>
                <option value="IN_PROGRESS" className="bg-[#050705]">IN_PROGRESS</option>
                <option value="CLOSED" className="bg-[#050705]">CLOSED</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-terminal-muted font-mono text-xs space-y-3">
              <div className="w-6 h-6 border-2 border-terminal-green border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Loading investigation cases...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-12 text-center text-terminal-muted font-mono text-xs space-y-2">
              <Briefcase className="w-8 h-8 text-terminal-muted mx-auto mb-2 opacity-50" />
              <p className="text-terminal-green font-semibold">No Investigation Cases Found</p>
              <p className="text-[11px] text-terminal-green-dim">Create a case or attach an alert from the stream to start an investigation.</p>
            </div>
          ) : (
            <div className="divide-y divide-terminal-border/80 max-h-[700px] overflow-y-auto font-mono">
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => fetchCaseDetail(c.id)}
                  className={`p-4 hover:bg-terminal-surface cursor-pointer transition space-y-2 font-mono ${selectedCase?.id === c.id ? 'bg-terminal-green-dark/60 border-l-4 border-terminal-green' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(c.severity)}`}>
                      {c.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold font-mono text-terminal-green line-clamp-1">{c.title}</h4>
                  {c.description && <p className="text-[11px] font-mono text-terminal-green-dim line-clamp-2">{c.description}</p>}

                  <div className="flex items-center justify-between text-[10px] text-terminal-green-dim font-mono pt-1">
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
          <div className="lg:col-span-2 soc-card p-6 rounded-xl border border-terminal-border bg-[#0a0f0a] shadow-2xl space-y-6 font-mono">
            {/* Case Header & Triage Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-terminal-border">
              <div className="space-y-1 font-mono">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(selectedCase.severity)}`}>
                    {selectedCase.severity}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(selectedCase.status)}`}>
                    {selectedCase.status}
                  </span>
                </div>
                <h3 className="text-base font-bold font-mono text-terminal-green text-glow-green">{selectedCase.title}</h3>
                <p className="text-xs font-mono text-terminal-green-dim">{selectedCase.description || 'No description provided.'}</p>
              </div>

              {!isReadOnly && (
                <div className="flex items-center gap-2 font-mono">
                  {selectedCase.status !== 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedCase.id, 'IN_PROGRESS')}
                      className="px-3 py-1.5 rounded-lg bg-terminal-green-dark text-terminal-green border border-terminal-border text-xs font-bold hover:bg-terminal-border transition"
                    >
                      Set In Progress
                    </button>
                  )}
                  {selectedCase.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedCase.id, 'CLOSED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-900/80 transition"
                    >
                      Close Case
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="p-1.5 text-terminal-green-dim hover:text-terminal-green"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-terminal-border pb-2 overflow-x-auto font-mono">
              <button
                onClick={() => setActiveDetailTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${activeDetailTab === 'overview' ? 'bg-terminal-green-dark text-terminal-green border border-terminal-border glow-green' : 'text-terminal-green-dim hover:text-terminal-green'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveDetailTab('alerts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${activeDetailTab === 'alerts' ? 'bg-terminal-green-dark text-terminal-green border border-terminal-border glow-green' : 'text-terminal-green-dim hover:text-terminal-green'}`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Alerts ({selectedCase.alerts?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveDetailTab('iocs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${activeDetailTab === 'iocs' ? 'bg-terminal-green-dark text-terminal-green border border-terminal-border glow-green' : 'text-terminal-green-dim hover:text-terminal-green'}`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>IOCs ({selectedCase.iocs?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveDetailTab('cves')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${activeDetailTab === 'cves' ? 'bg-terminal-green-dark text-terminal-green border border-terminal-border glow-green' : 'text-terminal-green-dim hover:text-terminal-green'}`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>CVEs ({selectedCase.cves?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveDetailTab('malware')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${activeDetailTab === 'malware' ? 'bg-terminal-green-dark text-terminal-green border border-terminal-border glow-green' : 'text-terminal-green-dim hover:text-terminal-green'}`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Malware ({selectedCase.malwareSamples?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveDetailTab('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${activeDetailTab === 'timeline' ? 'bg-terminal-green-dark text-terminal-green border border-terminal-border glow-green' : 'text-terminal-green-dim hover:text-terminal-green'}`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Audit Timeline ({timeline.length})</span>
              </button>
              <button
                onClick={() => setActiveDetailTab('forensics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${activeDetailTab === 'forensics' ? 'bg-terminal-green-dark text-terminal-green border border-terminal-border glow-green' : 'text-terminal-green-dim hover:text-terminal-green'}`}
              >
                <FileSearch className="w-3.5 h-3.5" />
                <span>Forensics ({forensicArtifacts.length})</span>
              </button>
              <button
                onClick={() => setActiveDetailTab('report')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${activeDetailTab === 'report' ? 'bg-sky-900/80 text-sky-300 border border-sky-500/40 glow-green' : 'text-sky-400/80 hover:text-sky-300'}`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>AI Incident Report</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeDetailTab === 'overview' && (
              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className="p-3 rounded-lg bg-[#050705] border border-terminal-border">
                    <span className="text-[10px] text-terminal-green-dim block">CASE ID</span>
                    <span className="text-terminal-green font-bold truncate block">{selectedCase.id}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#050705] border border-terminal-border">
                    <span className="text-[10px] text-terminal-green-dim block">ASSIGNED ANALYST</span>
                    <span className="text-terminal-green font-bold block">{selectedCase.assignedTo?.email || 'Unassigned'}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#050705] border border-terminal-border">
                    <span className="text-[10px] text-terminal-green-dim block">CREATED DATE</span>
                    <span className="text-terminal-green font-bold block">{new Date(selectedCase.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#050705] border border-terminal-border">
                    <span className="text-[10px] text-terminal-green-dim block">LAST UPDATED</span>
                    <span className="text-terminal-green font-bold block">{new Date(selectedCase.updatedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#050705] border border-terminal-border space-y-2 font-mono">
                  <span className="text-[10px] text-terminal-green-dim font-bold uppercase tracking-wider">INVESTIGATION SUMMARY & SCOPE</span>
                  <p className="text-terminal-green font-mono text-xs leading-relaxed">{selectedCase.description || 'No detailed scope available.'}</p>
                </div>
              </div>
            )}

            {/* TAB 2: LINKED ALERTS */}
            {activeDetailTab === 'alerts' && (
              <div className="space-y-3 font-mono">
                {(!selectedCase.alerts || selectedCase.alerts.length === 0) ? (
                  <div className="p-8 text-center text-terminal-muted text-xs font-mono">No alerts linked to this case yet.</div>
                ) : (
                  selectedCase.alerts.map((alert: any) => (
                    <div key={alert.id} className="p-4 rounded-lg bg-[#050705] border border-terminal-border space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className="text-terminal-green-dim text-[10px]">Status: {alert.status}</span>
                      </div>
                      <p className="text-terminal-green font-semibold font-mono">{alert.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-terminal-green-dim pt-1 border-t border-terminal-border">
                        <span>Source: {alert.source}</span>
                        {alert.sourceIoc && <span className="text-terminal-green">IOC: {alert.sourceIoc.value}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: LINKED IOCS */}
            {activeDetailTab === 'iocs' && (
              <div className="space-y-3 font-mono">
                {(!selectedCase.iocs || selectedCase.iocs.length === 0) ? (
                  <div className="p-8 text-center text-terminal-muted text-xs font-mono">No direct IOCs linked to this case.</div>
                ) : (
                  selectedCase.iocs.map((ioc: any) => (
                    <div key={ioc.id} className="p-4 rounded-lg bg-[#050705] border border-terminal-border space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-terminal-green font-bold text-sm text-glow-green">{ioc.value}</span>
                        <span className="px-2 py-0.5 rounded bg-terminal-green-dark text-terminal-green border border-terminal-border text-[10px]">
                          {ioc.type}
                        </span>
                      </div>
                      <p className="text-terminal-green-dim text-[10px]">Source: {ioc.source} • Geolocation: {ioc.city ? `${ioc.city}, ${ioc.country}` : 'Global/N/A'}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: LINKED CVES */}
            {activeDetailTab === 'cves' && (
              <div className="space-y-3 font-mono">
                {(!selectedCase.cves || selectedCase.cves.length === 0) ? (
                  <div className="p-8 text-center text-terminal-muted text-xs font-mono">No CVE vulnerabilities associated with this case.</div>
                ) : (
                  selectedCase.cves.map((cve: any) => (
                    <div key={cve.id || cve.cveId} className="p-4 rounded-lg bg-[#050705] border border-terminal-border space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-400 font-bold text-sm">{cve.cveId}</span>
                        <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-500/40 font-bold text-[10px]">
                          CVSS {cve.cvssScore ?? 'N/A'}
                        </span>
                      </div>
                      <p className="text-terminal-green font-mono text-xs">{cve.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 5: LINKED MALWARE */}
            {activeDetailTab === 'malware' && (
              <div className="space-y-3 font-mono">
                {(!selectedCase.malwareSamples || selectedCase.malwareSamples.length === 0) ? (
                  <div className="p-8 text-center text-terminal-muted text-xs font-mono">No malware samples linked to this case.</div>
                ) : (
                  selectedCase.malwareSamples.map((m: any) => (
                    <div key={m.id} className="p-4 rounded-lg bg-[#050705] border border-terminal-border space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-terminal-green font-bold text-sm text-glow-green">{m.name}</span>
                        <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-400 border border-purple-500/40 text-[10px]">
                          Family: {m.malwareFamily || 'Unknown'}
                        </span>
                      </div>
                      <p className="text-terminal-green-dim text-[10px]">SHA256: {m.hashSha256}</p>
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
                  <form onSubmit={handleAddNote} className="flex gap-2 font-mono">
                    <input
                      type="text"
                      placeholder="Add an investigation note to timeline..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 bg-[#050705] px-4 py-2.5 rounded-lg border border-terminal-border text-terminal-green text-xs focus:outline-none font-mono"
                    />
                    <button
                      type="submit"
                      disabled={sendingNote || !newNote.trim()}
                      className="px-4 py-2.5 rounded-lg bg-terminal-green-dark hover:bg-terminal-border text-terminal-green font-bold flex items-center gap-2 transition disabled:opacity-50 font-mono border border-terminal-border"
                    >
                      <Send className="w-3.5 h-3.5 text-terminal-green" />
                      <span>Note</span>
                    </button>
                  </form>
                )}

                {timelineLoading ? (
                  <div className="p-8 text-center text-terminal-muted font-mono">Loading audit log timeline...</div>
                ) : timeline.length === 0 ? (
                  <div className="p-8 text-center text-terminal-muted font-mono">No audit log timeline entries recorded yet.</div>
                ) : (
                  <div className="relative pl-6 space-y-4 border-l-2 border-terminal-border my-4 font-mono">
                    {timeline.map((item) => (
                      <div key={item.id} className="relative group font-mono">
                        <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-terminal-green border-2 border-black glow-green"></div>
                        <div className="p-3 rounded-lg bg-[#050705] border border-terminal-border space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-terminal-green-dim">
                            <span className="text-terminal-green font-bold">{item.user?.email || 'System'}</span>
                            <span>{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-terminal-green text-xs font-mono font-semibold">{item.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: DIGITAL FORENSICS & APPEND-ONLY CHAIN OF CUSTODY */}
            {activeDetailTab === 'forensics' && (
              <div className="space-y-4 text-xs font-mono">
                <div className="flex items-center justify-between bg-[#050705] p-4 rounded-lg border border-terminal-border">
                  <div>
                    <h4 className="text-sm font-bold text-terminal-green flex items-center gap-2 text-glow-green">
                      <Lock className="w-4 h-4 text-terminal-green" />
                      <span>Digital Forensics & Append-Only Custody Log</span>
                    </h4>
                    <p className="text-[11px] text-terminal-green-dim mt-0.5 font-mono">
                      Immutable forensic artifact registry with append-only chain-of-custody tracking.
                    </p>
                  </div>

                  {canManageForensics ? (
                    <button
                      onClick={() => setShowArtifactModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-terminal-green-dark hover:bg-terminal-border text-terminal-green text-xs font-bold shadow-lg flex items-center gap-1.5 transition font-mono border border-terminal-border"
                    >
                      <Plus className="w-3.5 h-3.5 text-terminal-green" />
                      <span>Attach Artifact</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded bg-yellow-950/80 border border-yellow-500/40 text-yellow-400 text-[10px] font-bold">
                      RBAC Restricted (Read-Only)
                    </span>
                  )}
                </div>

                {forensicsLoading ? (
                  <div className="p-8 text-center text-terminal-muted font-mono">Loading forensic artifacts...</div>
                ) : forensicArtifacts.length === 0 ? (
                  <div className="p-8 text-center text-terminal-muted bg-[#050705] rounded-lg border border-terminal-border font-mono">
                    No forensic artifacts attached to this case yet.
                  </div>
                ) : (
                  <div className="space-y-4 font-mono">
                    {forensicArtifacts.map((art) => (
                      <div key={art.id} className="p-4 rounded-lg bg-[#050705] border border-terminal-border space-y-3 font-mono">
                        <div className="flex items-center justify-between border-b border-terminal-border pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-terminal-green-dark text-terminal-green border border-terminal-border">
                              {art.artifactType}
                            </span>
                            <span className="text-terminal-green font-bold text-xs">Artifact ID: {art.id.slice(0, 8)}...</span>
                          </div>
                          <span className="text-[10px] text-terminal-green-dim">
                            Collected by <strong className="text-terminal-green">{art.collectedBy}</strong> on {new Date(art.collectedAt).toLocaleString()}
                          </span>
                        </div>

                        {art.description && (
                          <p className="text-terminal-green-dim text-xs font-mono">{art.description}</p>
                        )}

                        {art.hash && (
                          <div className="p-2 rounded bg-[#050705] border border-terminal-border font-mono text-[11px] text-terminal-green-dim flex items-center justify-between">
                            <span>Hash Digest (Verification):</span>
                            <span className="text-terminal-green font-bold text-glow-green">{art.hash}</span>
                          </div>
                        )}

                        {/* Chain of custody timeline */}
                        <div className="pt-2 font-mono">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-terminal-green-dim uppercase tracking-wider">
                              Chain of Custody History Trail ({Array.isArray(art.chainOfCustody) ? art.chainOfCustody.length : 0})
                            </span>
                            {canManageForensics && (
                              <button
                                onClick={() => {
                                  setSelectedArtifactForCustody(art);
                                  setShowCustodyModal(true);
                                }}
                                className="px-2 py-1 rounded bg-terminal-green-dark hover:bg-terminal-border text-terminal-green text-[10px] font-bold transition flex items-center gap-1 border border-terminal-border font-mono"
                              >
                                <Plus className="w-3 h-3 text-terminal-green" />
                                <span>Append Custody Action</span>
                              </button>
                            )}
                          </div>

                          <div className="relative pl-4 space-y-2 border-l-2 border-terminal-border">
                            {Array.isArray(art.chainOfCustody) && art.chainOfCustody.map((cEntry: any, idx: number) => (
                              <div key={idx} className="relative text-[11px] font-mono">
                                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-terminal-green border border-black glow-green"></div>
                                <div className="p-2 rounded bg-[#050705] border border-terminal-border flex items-center justify-between gap-2">
                                  <div>
                                    <span className="text-terminal-green font-bold">{cEntry.user}</span>
                                    <span className="text-terminal-green-dim ml-2">{cEntry.action}</span>
                                  </div>
                                  <span className="text-terminal-muted text-[10px] shrink-0">{new Date(cEntry.timestamp).toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 8: AI INCIDENT REPORT */}
            {activeDetailTab === 'report' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#050705] border border-terminal-border">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-sky-400" />
                    <div>
                      <span className="font-bold text-sky-400 block text-xs">Dual-Audience AI Incident Report Engine</span>
                      <span className="text-[10px] text-terminal-green-dim">Powered by Groq LLM (`llama-3.3-70b-versatile`)</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerateReport(selectedCase.id)}
                    disabled={generatingReport}
                    className="px-4 py-2 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-500/40 font-bold transition flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-sky-400" />
                    <span>{generatingReport ? 'Generating via Groq AI...' : 'Generate / Refresh Report'}</span>
                  </button>
                </div>

                {selectedCase.incidentReport || selectedCase.report ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 bg-[#050705] p-1 rounded-lg border border-terminal-border w-fit">
                      <button
                        onClick={() => setReportAudienceTab('exec')}
                        className={`px-4 py-1.5 rounded text-xs font-bold transition ${reportAudienceTab === 'exec' ? 'bg-sky-900/80 text-sky-300 border border-sky-500/40' : 'text-terminal-green-dim'}`}
                      >
                        👔 C-Suite Executive Summary
                      </button>
                      <button
                        onClick={() => setReportAudienceTab('tech')}
                        className={`px-4 py-1.5 rounded text-xs font-bold transition ${reportAudienceTab === 'tech' ? 'bg-sky-900/80 text-sky-300 border border-sky-500/40' : 'text-terminal-green-dim'}`}
                      >
                        🛠️ Technical Deep-Dive (Engineering)
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-[#050705] border border-terminal-border space-y-3 font-mono leading-relaxed">
                      {reportAudienceTab === 'exec' ? (
                        <div className="space-y-2">
                          <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider border-b border-sky-900/50 pb-1">
                            TARGET AUDIENCE: CHIEF EXECUTIVE OFFICER (CEO), CISO & BOARD MEMBERS
                          </div>
                          <div className="text-sky-100 text-xs whitespace-pre-wrap leading-relaxed">
                            {(selectedCase.incidentReport || selectedCase.report).executiveSummary}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider border-b border-emerald-900/50 pb-1">
                            TARGET AUDIENCE: SOC OPERATIONS TEAM, THREAT ANALYSTS & FORENSIC ENGINEERS
                          </div>
                          <div className="text-emerald-100 text-xs whitespace-pre-wrap leading-relaxed">
                            {(selectedCase.incidentReport || selectedCase.report).technicalDetails}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-terminal-muted italic bg-[#050705] rounded-xl border border-terminal-border">
                    No incident report generated yet for Case #{selectedCase.id.slice(0, 8)}. Click "Generate / Refresh Report" above.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2 bg-[#050705] border border-terminal-border rounded-xl p-12 text-center text-terminal-muted font-mono text-xs flex flex-col items-center justify-center min-h-[400px]">
            <Briefcase className="w-12 h-12 text-terminal-border mb-3" />
            <p className="text-terminal-green font-bold text-sm text-glow-green">No Case Selected</p>
            <p className="text-terminal-green-dim mt-1 max-w-sm font-mono">Select an investigation case from the list on the left to inspect linked alerts, IOCs, CVEs, malware, and audit log history.</p>
          </div>
        )}
      </div>

      {/* Create Case Modal */}
      {showCreateModal && !isReadOnly && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="soc-card border border-terminal-border rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl bg-[#0a0f0a] font-mono">
            <div className="flex items-center justify-between border-b border-terminal-border pb-3">
              <h3 className="text-sm font-bold text-terminal-green uppercase font-mono text-glow-green">Create Security Case</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-terminal-green-dim hover:text-terminal-green">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-terminal-green-dim mb-1">Case Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. APT29 Spear-phishing Campaign"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#050705] border border-terminal-border rounded px-3 py-2 text-terminal-green focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-terminal-green-dim mb-1">Case Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed description of threat scope..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#050705] border border-terminal-border rounded px-3 py-2 text-terminal-green focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-terminal-green-dim mb-1">Severity Rating</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="w-full bg-[#050705] border border-terminal-border rounded px-3 py-2 text-terminal-green focus:outline-none font-mono"
                >
                  <option value="CRITICAL" className="bg-[#050705]">CRITICAL</option>
                  <option value="HIGH" className="bg-[#050705]">HIGH</option>
                  <option value="MEDIUM" className="bg-[#050705]">MEDIUM</option>
                  <option value="LOW" className="bg-[#050705]">LOW</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded bg-terminal-surface text-terminal-green-dim font-bold hover:bg-terminal-border transition border border-terminal-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded bg-terminal-green-dark hover:bg-terminal-border text-terminal-green font-bold transition border border-terminal-border"
                >
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attach Artifact Modal */}
      {showArtifactModal && canManageForensics && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="soc-card border border-terminal-border rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl bg-[#0a0f0a] font-mono">
            <div className="flex items-center justify-between border-b border-terminal-border pb-3">
              <h3 className="text-sm font-bold text-terminal-green uppercase font-mono text-glow-green">Attach Forensic Artifact</h3>
              <button onClick={() => setShowArtifactModal(false)} className="text-terminal-green-dim hover:text-terminal-green">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddArtifact} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-terminal-green-dim mb-1">Artifact Type</label>
                <select
                  value={artifactType}
                  onChange={(e) => setArtifactType(e.target.value)}
                  className="w-full bg-[#050705] border border-terminal-border rounded px-3 py-2 text-terminal-green focus:outline-none font-mono"
                >
                  <option value="LOG_FILE" className="bg-[#050705]">LOG_FILE</option>
                  <option value="MEMORY_DUMP_META" className="bg-[#050705]">MEMORY_DUMP_META</option>
                  <option value="NETWORK_CAPTURE_META" className="bg-[#050705]">NETWORK_CAPTURE_META</option>
                  <option value="FILE_METADATA" className="bg-[#050705]">FILE_METADATA</option>
                </select>
              </div>

              <div>
                <label className="block text-terminal-green-dim mb-1">Description / Metadata</label>
                <textarea
                  rows={3}
                  placeholder="Details of artifact acquisition, file path, source host..."
                  value={artifactDesc}
                  onChange={(e) => setArtifactDesc(e.target.value)}
                  className="w-full bg-[#050705] border border-terminal-border rounded px-3 py-2 text-terminal-green focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-terminal-green-dim mb-1">Cryptographic Hash (SHA256 / MD5)</label>
                <input
                  type="text"
                  placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                  value={artifactHash}
                  onChange={(e) => setArtifactHash(e.target.value)}
                  className="w-full bg-[#050705] border border-terminal-border rounded px-3 py-2 text-terminal-green focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-terminal-green-dim mb-1">Initial Chain of Custody Action</label>
                <input
                  type="text"
                  required
                  value={initialAction}
                  onChange={(e) => setInitialAction(e.target.value)}
                  className="w-full bg-[#050705] border border-terminal-border rounded px-3 py-2 text-terminal-green focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 flex gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => setShowArtifactModal(false)}
                  className="flex-1 py-2.5 rounded bg-terminal-surface text-terminal-green-dim font-bold hover:bg-terminal-border transition border border-terminal-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded bg-terminal-green-dark hover:bg-terminal-border text-terminal-green font-bold transition border border-terminal-border"
                >
                  Save Artifact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Append Custody Action Modal */}
      {showCustodyModal && canManageForensics && selectedArtifactForCustody && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="soc-card border border-terminal-border rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl bg-[#0a0f0a] font-mono">
            <div className="flex items-center justify-between border-b border-terminal-border pb-3">
              <h3 className="text-sm font-bold text-terminal-green uppercase font-mono text-glow-green">Append Chain of Custody Action</h3>
              <button onClick={() => setShowCustodyModal(false)} className="text-terminal-green-dim hover:text-terminal-green">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAppendCustody} className="space-y-4 text-xs font-mono">
              <div className="p-3 rounded bg-[#050705] border border-terminal-border font-mono">
                <span className="text-[10px] text-terminal-green-dim block">TARGET ARTIFACT</span>
                <span className="text-terminal-green font-bold text-xs">{selectedArtifactForCustody.artifactType} ({selectedArtifactForCustody.id.slice(0, 8)}...)</span>
              </div>

              <div>
                <label className="block text-terminal-green-dim mb-1">Custody Action Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Transferred memory dump copy to forensic workstation B for volatility analysis"
                  value={custodyActionText}
                  onChange={(e) => setCustodyActionText(e.target.value)}
                  className="w-full bg-[#050705] border border-terminal-border rounded px-3 py-2 text-terminal-green focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 flex gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => setShowCustodyModal(false)}
                  className="flex-1 py-2.5 rounded bg-terminal-surface text-terminal-green-dim font-bold hover:bg-terminal-border transition border border-terminal-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded bg-terminal-green-dark hover:bg-terminal-border text-terminal-green font-bold transition border border-terminal-border"
                >
                  Append Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
