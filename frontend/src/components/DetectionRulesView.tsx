import React, { useState, useEffect } from 'react';
import { Settings, Plus, ToggleLeft, ToggleRight, AlertTriangle, Layers, GitBranch, Cpu, ShieldCheck } from 'lucide-react';

interface DetectionRulesViewProps {
  token: string;
  userRole?: string;
}

export const DetectionRulesView: React.FC<DetectionRulesViewProps> = ({ token, userRole }) => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New Rule Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [correlationType, setCorrelationType] = useState<'SIMPLE' | 'MULTI_CONDITION' | 'THRESHOLD' | 'CORRELATION'>('MULTI_CONDITION');
  const [logicalOperator, setLogicalOperator] = useState<'AND' | 'OR'>('AND');
  const [tagInput, setTagInput] = useState('botnet, c2');
  const [thresholdCount, setThresholdCount] = useState(3);

  const isReadOnly = userRole === 'READ_ONLY';
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/detection-rules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch detection rules', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [token]);

  const handleToggleRule = async (ruleId: string, currentEnabled: boolean) => {
    if (isReadOnly) return;
    try {
      await fetch(`${API_BASE_URL}/detection-rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      fetchRules();
    } catch (err) {
      console.error('Failed to toggle rule state', err);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !name.trim()) return;

    let conditionPayload: any = {};
    if (correlationType === 'MULTI_CONDITION') {
      const tagsList = tagInput.split(',').map((t) => t.trim()).filter(Boolean);
      conditionPayload = {
        logicalOperator,
        conditions: [
          { type: 'MATCH_TAGS', tags: [tagsList[0] || 'botnet'] },
          { type: 'MATCH_TAGS', tags: [tagsList[1] || 'c2'] },
        ],
      };
    } else if (correlationType === 'THRESHOLD') {
      conditionPayload = { type: 'OCCURRENCE_COUNT', minOccurrences: Number(thresholdCount) };
    } else if (correlationType === 'CORRELATION') {
      conditionPayload = { type: 'MALWARE_CVE_LINK' };
    } else {
      conditionPayload = { type: 'MATCH_TAGS', tags: tagInput.split(',').map((t) => t.trim()).filter(Boolean) };
    }

    try {
      await fetch(`${API_BASE_URL}/detection-rules`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          severity,
          correlationType,
          condition: conditionPayload,
        }),
      });

      setShowModal(false);
      setName('');
      setDescription('');
      fetchRules();
    } catch (err) {
      console.error('Failed to create rule', err);
    }
  };

  const getCorrelationBadge = (type: string) => {
    switch (type) {
      case 'MULTI_CONDITION':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'THRESHOLD':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CORRELATION':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <span>Data-Driven Detection Rules Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure multi-condition, threshold, and correlation rules evaluated in real time post feed sync.
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Multi-Condition Rule</span>
          </button>
        )}
      </div>

      {/* Rules Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 font-mono text-xs space-y-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p>Loading detection rules...</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="p-16 text-center text-slate-500 font-mono text-xs space-y-2">
          <Settings className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
          <p className="text-slate-400 font-semibold">No Detection Rules Configured</p>
          <p className="text-[11px] text-slate-600">Create a rule to automate threat alert correlation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 backdrop-blur-md space-y-4 hover:border-slate-700 transition shadow-xl"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getCorrelationBadge(rule.correlationType)}`}>
                    {rule.correlationType || 'SIMPLE'} RULE
                  </span>
                  <h3 className="text-sm font-bold text-slate-100">{rule.name}</h3>
                </div>

                {!isReadOnly ? (
                  <button
                    onClick={() => handleToggleRule(rule.id, rule.enabled)}
                    className="text-slate-400 hover:text-slate-200 transition"
                    title="Toggle Rule Active Status"
                  >
                    {rule.enabled ? (
                      <ToggleRight className="w-7 h-7 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-600" />
                    )}
                  </button>
                ) : (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${rule.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                {rule.description || 'No description provided.'}
              </p>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rule.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  {rule.severity}
                </span>

                <span className="text-[10px] text-slate-500">
                  {rule.enabled ? 'Active Engine' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Rule Creator Modal - Render ONLY if not READ_ONLY */}
      {showModal && !isReadOnly && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-400" />
                <span>Create Detection Rule</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 uppercase">Rule Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Multi-Tag Botnet & Ransomware Rule"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 uppercase">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rule purpose and threat context..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 uppercase">Correlation Type</label>
                  <select
                    value={correlationType}
                    onChange={(e) => setCorrelationType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="MULTI_CONDITION">MULTI_CONDITION (AND/OR)</option>
                    <option value="THRESHOLD">THRESHOLD (Occurrence Count)</option>
                    <option value="CORRELATION">CORRELATION (CVE Link)</option>
                    <option value="SIMPLE">SIMPLE (Single Tag)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 uppercase">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              {correlationType === 'MULTI_CONDITION' && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 uppercase">Logical Operator</label>
                    <select
                      value={logicalOperator}
                      onChange={(e) => setLogicalOperator(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                    >
                      <option value="AND">AND (All Conditions Required)</option>
                      <option value="OR">OR (Any Condition Required)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 uppercase">Threat Tags (Comma Separated)</label>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="botnet, c2"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                    />
                  </div>
                </div>
              )}

              {correlationType === 'THRESHOLD' && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <label className="block text-[10px] text-slate-400 mb-1 uppercase">Min Occurrences Threshold</label>
                  <input
                    type="number"
                    value={thresholdCount}
                    onChange={(e) => setThresholdCount(Number(e.target.value))}
                    min={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-600/20"
              >
                Save & Deploy Rule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
