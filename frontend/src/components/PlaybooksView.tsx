import React, { useState, useEffect } from 'react';
import { Play, Plus, Zap, CheckCircle2, AlertTriangle, ShieldAlert, History, Trash2, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PlaybooksView: React.FC = () => {
  const { token, user } = useAuth();
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'builder' | 'history'>('builder');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerSeverity, setTriggerSeverity] = useState('CRITICAL');
  const [selectedActions, setSelectedActions] = useState<string[]>(['CREATE_CASE', 'ESCALATE_SEVERITY', 'ASSIGN_ANALYST', 'FORWARD_SIEM']);

  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pbRes, execRes] = await Promise.all([
        fetch(`${apiBase}/playbooks`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/playbooks/executions`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (pbRes.ok) setPlaybooks(await pbRes.json());
      if (execRes.ok) setExecutions(await execRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaybook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const payload = {
        name,
        description,
        triggerCondition: { severity: triggerSeverity },
        actions: selectedActions.map((type) => ({ type })),
        enabled: true,
      };

      const res = await fetch(`${apiBase}/playbooks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create playbook');
      setName('');
      setDescription('');
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      alert(`Error creating playbook: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this playbook?')) return;
    try {
      const res = await fetch(`${apiBase}/playbooks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const toggleAction = (type: string) => {
    setSelectedActions((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc' }}>
            <Zap style={{ color: '#38bdf8' }} /> SOAR Automated Response Playbooks
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
            Automated event-driven playbook triggers, auto-escalation, analyst routing, and SIEM streaming.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', backgroundColor: '#1e293b', padding: '4px', borderRadius: '6px' }}>
            <button
              onClick={() => setActiveTab('builder')}
              style={{
                background: activeTab === 'builder' ? '#0284c7' : 'transparent',
                color: activeTab === 'builder' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              Playbook Builder ({playbooks.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                background: activeTab === 'history' ? '#0284c7' : 'transparent',
                color: activeTab === 'history' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              Execution History ({executions.length})
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                backgroundColor: '#38bdf8',
                color: '#0f172a',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={16} /> New Playbook
            </button>
          )}
        </div>
      </div>

      {/* Main View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading SOAR Engine...</div>
      ) : activeTab === 'builder' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {playbooks.map((pb) => (
            <div
              key={pb.id}
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>{pb.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {pb.id.substring(0, 8)}...</span>
                </div>
                <span
                  style={{
                    backgroundColor: pb.enabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: pb.enabled ? '#4ade80' : '#f87171',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {pb.enabled ? 'ACTIVE' : 'DISABLED'}
                </span>
              </div>

              <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.85rem' }}>
                {pb.description || 'Automated incident response workflow.'}
              </p>

              {/* Trigger Condition */}
              <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  TRIGGER CONDITION:
                </span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <AlertTriangle size={14} style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>
                    Severity = {pb.triggerCondition?.severity || 'ANY'}
                  </span>
                </div>
              </div>

              {/* Actions List */}
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  ORDERED AUTOMATED ACTIONS:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {(pb.actions || []).map((act: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.8rem',
                        color: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      <span style={{ color: '#94a3b8', fontWeight: 700 }}>{idx + 1}.</span> {act.type}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #334155' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Executed: <strong>{pb._count?.executions || 0} times</strong>
                </span>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(pb.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8rem',
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Execution History Table */
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '12px 16px' }}>Execution Time</th>
                <th style={{ padding: '12px 16px' }}>Playbook Name</th>
                <th style={{ padding: '12px 16px' }}>Triggering Alert</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Actions Executed</th>
              </tr>
            </thead>
            <tbody>
              {executions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No playbook execution logs recorded yet.
                  </td>
                </tr>
              ) : (
                executions.map((exec) => (
                  <tr key={exec.id} style={{ borderBottom: '1px solid #334155', color: '#f8fafc' }}>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(exec.executedAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#38bdf8' }}>
                      {exec.playbook?.name || exec.playbookId}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                      {exec.alert?.description || `Alert #${exec.alertId.substring(0, 8)}`}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: exec.status === 'SUCCESS' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: exec.status === 'SUCCESS' ? '#4ade80' : '#f87171',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      >
                        {exec.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {((exec.actionsRan as any[]) || []).map((act, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.75rem',
                              backgroundColor: '#0f172a',
                              color: '#e2e8f0',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid #334155',
                            }}
                          >
                            {act.action} ({act.status})
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Playbook Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '24px', width: '500px', color: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#38bdf8' }}>Create SOAR Response Playbook</h3>
            <form onSubmit={handleCreatePlaybook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Playbook Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Critical Threat Auto-Containment"
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe target response logic"
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Trigger Severity</label>
                <select
                  value={triggerSeverity}
                  onChange={(e) => setTriggerSeverity(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Select Automated Actions</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { id: 'CREATE_CASE', label: '1. Auto-Create Security Case File' },
                    { id: 'ESCALATE_SEVERITY', label: '2. Auto-Escalate Alert Severity' },
                    { id: 'ASSIGN_ANALYST', label: '3. Auto-Assign Analyst' },
                    { id: 'FORWARD_SIEM', label: '4. Auto-Push to Live SIEM Stream (Splunk/Wazuh)' },
                  ].map((act) => (
                    <label key={act.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedActions.includes(act.id)}
                        onChange={() => toggleAction(act.id)}
                      />
                      {act.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Create Playbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
