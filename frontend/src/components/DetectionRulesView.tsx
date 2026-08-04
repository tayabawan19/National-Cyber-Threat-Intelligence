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
        return 'bg-purple-950/80 text-purple-400 border-purple-500/40';
      case 'THRESHOLD':
        return 'bg-yellow-950/80 text-yellow-400 border-yellow-500/40';
      case 'CORRELATION':
        return 'bg-terminal-green-dark text-terminal-green border-terminal-border';
      default:
        return 'bg-[#050705] text-terminal-green-dim border-terminal-border';
    }
  };

  return (
    <div className="space-y-6 font-mono text-terminal-green">
      {/* Top Header */}
      <div className="soc-card p-6 rounded-xl border border-terminal-border bg-[#0a0f0a]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        <div>
          <h2 className="text-sm font-bold font-mono text-terminal-green flex items-center gap-2 text-glow-green">
            <Settings className="w-5 h-5 text-terminal-green" />
            <span>DATA-DRIVEN DETECTION RULES ENGINE</span>
          </h2>
          <p className="text-xs text-terminal-green-dim mt-0.5 font-mono">
            Configure multi-condition, threshold, and correlation rules evaluated in real time post feed sync.
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-lg bg-terminal-green-dark hover:bg-terminal-border text-terminal-green text-xs font-mono font-bold transition flex items-center gap-2 border border-terminal-border shadow-lg"
          >
            <Plus className="w-4 h-4 text-terminal-green" />
            <span>New Multi-Condition Rule</span>
          </button>
        )}
      </div>

      {/* Rules Grid */}
      {loading ? (
        <div className="p-16 text-center text-terminal-muted font-mono text-xs space-y-3">
          <div className="w-6 h-6 border-2 border-terminal-green border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p>Loading detection rules...</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="p-16 text-center text-terminal-muted font-mono text-xs space-y-2">
          <Settings className="w-8 h-8 text-terminal-muted mx-auto mb-2 opacity-50" />
          <p className="text-terminal-green font-semibold">No Detection Rules Configured</p>
          <p className="text-[11px] text-terminal-green-dim">Create a rule to automate threat alert correlation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="soc-card p-5 rounded-xl border border-terminal-border bg-[#0a0f0a]/90 space-y-4 hover:border-terminal-green/60 transition shadow-xl font-mono"
            >
              <div className="flex items-start justify-between gap-2 font-mono">
                <div className="space-y-1 font-mono">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${getCorrelationBadge(rule.correlationType)}`}>
                    {rule.correlationType || 'SIMPLE'} RULE
                  </span>
                  <h3 className="text-xs font-bold font-mono text-terminal-green text-glow-green">{rule.name}</h3>
                </div>

                {!isReadOnly ? (
                  <button
                    onClick={() => handleToggleRule(rule.id, rule.enabled)}
                    className="text-terminal-green-dim hover:text-terminal-green transition"
                    title="Toggle Rule Active Status"
                  >
                    {rule.enabled ? (
                      <ToggleRight className="w-7 h-7 text-terminal-green" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-terminal-muted" />
                    )}
                  </button>
                ) : (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${rule.enabled ? 'bg-terminal-green-dark text-terminal-green border border-terminal-border' : 'bg-[#050705] text-terminal-muted'}`}>
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                )}
              </div>

              <p className="text-xs text-terminal-green-dim leading-relaxed min-h-[36px] font-mono">
                {rule.description || 'No description provided.'}
              </p>

              <div className="pt-2 border-t border-terminal-border flex items-center justify-between text-xs font-mono">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rule.severity === 'CRITICAL' ? 'bg-red-950/80 text-red-400 border border-red-500/40 glow-red' : 'bg-orange-950/80 text-orange-400 border border-orange-500/40'}`}>
                  {rule.severity}
                </span>

                <span className="text-[10px] text-terminal-green-dim">
                  {rule.enabled ? 'Engine Active' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Rule Creator Modal - Render ONLY if not READ_ONLY */}
      {showModal && !isReadOnly && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="soc-card border border-terminal-border rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl font-mono text-xs bg-[#0a0f0a]">
            <div className="flex items-center justify-between pb-3 border-b border-terminal-border">
              <h3 className="text-sm font-bold text-terminal-green flex items-center gap-2 font-mono uppercase text-glow-green">
                <GitBranch className="w-4 h-4 text-terminal-green" />
                <span>Create Detection Rule</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-terminal-green-dim hover:text-terminal-green font-mono">
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 font-mono">
              <div>
                <label className="block text-[10px] text-terminal-green-dim mb-1 uppercase">Rule Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Multi-Tag Botnet & Ransomware Rule"
                  className="w-full bg-[#050705] border border-terminal-border rounded px-3 py-2 text-terminal-green focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-terminal-green-dim mb-1 uppercase">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rule purpose and threat context..."
                  className="w-full bg-[#050705] border border-terminal-border rounded px-3 py-2 text-terminal-green focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-[10px] text-terminal-green-dim mb-1 uppercase">Correlation Type</label>
                  <select
                    value={correlationType}
                    onChange={(e) => setCorrelationType(e.target.value as any)}
                    className="w-full bg-[#050705] border border-terminal-border rounded px-3 py-2 text-terminal-green focus:outline-none font-mono"
                  >
                    <option value="MULTI_CONDITION" className="bg-[#050705]">MULTI_CONDITION (AND/OR)</option>
                    <option value="THRESHOLD" className="bg-[#050705]">THRESHOLD (Occurrence Count)</option>
                    <option value="CORRELATION" className="bg-[#050705]">CORRELATION (CVE Link)</option>
                    <option value="SIMPLE" className="bg-[#050705]">SIMPLE (Single Tag)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-terminal-green-dim mb-1 uppercase">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full bg-[#050705] border border-terminal-border rounded px-3 py-2 text-terminal-green focus:outline-none font-mono"
                  >
                    <option value="CRITICAL" className="bg-[#050705]">CRITICAL</option>
                    <option value="HIGH" className="bg-[#050705]">HIGH</option>
                    <option value="MEDIUM" className="bg-[#050705]">MEDIUM</option>
                    <option value="LOW" className="bg-[#050705]">LOW</option>
                  </select>
                </div>
              </div>

              {correlationType === 'MULTI_CONDITION' && (
                <div className="p-3 bg-[#050705] rounded border border-terminal-border space-y-3 font-mono">
                  <div>
                    <label className="block text-[10px] text-terminal-green-dim mb-1 uppercase">Logical Operator</label>
                    <select
                      value={logicalOperator}
                      onChange={(e) => setLogicalOperator(e.target.value as any)}
                      className="w-full bg-[#050705] border border-terminal-border rounded px-2.5 py-1.5 text-terminal-green font-mono"
                    >
                      <option value="AND">AND (All Conditions Required)</option>
                      <option value="OR">OR (Any Condition Required)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-terminal-green-dim mb-1 uppercase">Threat Tags (Comma Separated)</label>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="botnet, c2"
                      className="w-full bg-[#050705] border border-terminal-border rounded px-2.5 py-1.5 text-terminal-green font-mono"
                    />
                  </div>
                </div>
              )}

              {correlationType === 'THRESHOLD' && (
                <div className="p-3 bg-[#050705] rounded border border-terminal-border font-mono">
                  <label className="block text-[10px] text-terminal-green-dim mb-1 uppercase">Min Occurrences Threshold</label>
                  <input
                    type="number"
                    value={thresholdCount}
                    onChange={(e) => setThresholdCount(Number(e.target.value))}
                    min={2}
                    className="w-full bg-[#050705] border border-terminal-border rounded px-2.5 py-1.5 text-terminal-green font-mono"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded bg-terminal-green-dark hover:bg-terminal-border text-terminal-green font-bold transition border border-terminal-border font-mono"
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
