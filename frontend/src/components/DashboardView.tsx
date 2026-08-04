import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Database, FileCode, ArrowUpRight, Activity, Cpu, CheckCircle2, Globe, Flame, BarChart2, Radio, Terminal } from 'lucide-react';
import { CyberCellHeroBg } from './CyberCellHeroBg';

interface DashboardStats {
  totalAlerts: number;
  openAlerts: number;
  totalIocs: number;
  totalCves: number;
  severityDistribution: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  alertVolumeTrend: { date: string; count: number }[];
  topTargetedCountries: { country: string; count: number }[];
  topIocSources: { source: string; count: number }[];
  rulePerformance: { id: string; name: string; severity: string; alertCount: number }[];
}

export const DashboardView: React.FC<{
  token: string;
  onNavigateTab: (tab: string) => void;
  onSelectAlert: (alertId: string) => void;
}> = ({ token, onNavigateTab, onSelectAlert }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [statsRes, alertsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/dashboard/stats`, { headers }),
          fetch(`${API_BASE_URL}/alerts?limit=6`, { headers }),
        ]);

        const statsData = await statsRes.json();
        const alertsData = await alertsRes.json();

        setStats(statsData);
        setRecentAlerts(alertsData.items || (Array.isArray(alertsData) ? alertsData : []));
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
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

  const calculatePercentage = (count: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const maxTrendCount = Math.max(...(stats?.alertVolumeTrend?.map((t) => t.count) || [1]), 1);

  return (
    <div className="space-y-6 font-mono text-terminal-green">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0f0a]/95 p-6 rounded-xl border border-terminal-border shadow-2xl relative overflow-hidden">
        {/* Toned down Cyber Cell Hero background layer */}
        <CyberCellHeroBg variant="header" className="opacity-75" />

        <div className="relative z-10 font-mono">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-terminal-green animate-pulse"></span>
            <span className="text-[11px] font-mono font-bold text-terminal-green tracking-widest uppercase text-glow-green">
              ┌─[ LIVE SOC THREAT MONITOR ]
            </span>
          </div>
          <h2 className="text-lg font-bold text-terminal-green flex items-center gap-2 text-glow-green">
            <span>National Cyber Threat Operations Center</span>
          </h2>
          <p className="text-xs text-terminal-green-dim mt-1 max-w-2xl font-mono">
            Real-time feed correlation across OTX, NVD CVE, abuse.ch & MISP platforms with automated Groq AI Threat Summaries.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 font-mono">
          <button
            onClick={() => onNavigateTab('map')}
            className="px-4 py-2.5 rounded-lg bg-terminal-green-dark hover:bg-terminal-border text-terminal-green font-bold text-xs shadow-lg flex items-center gap-2 transition border border-terminal-border hover:border-terminal-green"
          >
            <Activity className="w-4 h-4 text-terminal-green" />
            <span>[ LAUNCH ATTACK MAP ]</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="soc-card p-5 rounded-xl border border-terminal-border bg-[#0a0f0a]/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-terminal-green-dim uppercase tracking-wider">Total Alerts</span>
            <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/40">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-mono text-terminal-green text-glow-green mt-2">{loading ? '...' : (stats?.totalAlerts ?? 0)}</p>
          <span className="text-[10px] text-terminal-muted font-mono mt-1 block">Live Postgres Store</span>
        </div>

        <div className="soc-card p-5 rounded-xl border border-terminal-border bg-[#0a0f0a]/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-terminal-green-dim uppercase tracking-wider">Active Open Alerts</span>
            <div className="p-2 rounded-lg bg-red-950/80 border border-red-500/50 glow-red">
              <Shield className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-mono text-red-400 mt-2">{loading ? '...' : (stats?.openAlerts ?? 0)}</p>
          <span className="text-[10px] text-red-400/90 font-mono mt-1 block">NEW & TRIAGED Alerts</span>
        </div>

        <div className="soc-card p-5 rounded-xl border border-terminal-border bg-[#0a0f0a]/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-terminal-green-dim uppercase tracking-wider">Ingested IOCs</span>
            <div className="p-2 rounded-lg bg-terminal-green-dark border border-terminal-border">
              <Database className="w-4 h-4 text-terminal-green" />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-mono text-terminal-green text-glow-green mt-2">{loading ? '...' : (stats?.totalIocs ?? 0)}</p>
          <span className="text-[10px] text-terminal-muted font-mono mt-1 block">IPs, Domains, Hashes, URLs</span>
        </div>

        <div className="soc-card p-5 rounded-xl border border-terminal-border bg-[#0a0f0a]/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-terminal-green-dim uppercase tracking-wider">CVE Database</span>
            <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-500/40">
              <FileCode className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-mono text-purple-400 mt-2">{loading ? '...' : (stats?.totalCves ?? 0)}</p>
          <span className="text-[10px] text-purple-400/90 font-mono mt-1 block">NVD NIST Synchronized</span>
        </div>
      </div>

      {/* Main Row 1: Alert Trend Volume & Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* Left Column: Alert Volume Over Time Trend Chart */}
        <div className="lg:col-span-2 soc-card p-6 rounded-xl border border-terminal-border bg-[#0a0f0a]/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold font-mono text-terminal-green flex items-center gap-2 text-glow-green">
                  <BarChart2 className="w-4 h-4 text-terminal-green" />
                  <span>ALERT GENERATION VOLUME (TIME SERIES)</span>
                </h3>
                <p className="text-xs text-terminal-green-dim mt-0.5">Real-time alert generation rate aggregated from live database alerts</p>
              </div>
              <span className="text-[10px] font-mono text-terminal-green bg-terminal-green-dark px-2.5 py-1 rounded border border-terminal-border flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
                LIVE STREAM
              </span>
            </div>

            {loading ? (
              <div className="h-44 flex items-center justify-center text-xs text-terminal-muted font-mono">
                Loading volume trend data...
              </div>
            ) : !stats?.alertVolumeTrend || stats.alertVolumeTrend.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-terminal-muted font-mono">
                No alert trend data recorded yet.
              </div>
            ) : (
              <div className="space-y-4 my-4 font-mono">
                <div className="h-40 flex items-end justify-between gap-2 pt-4 px-3 bg-[#050705] rounded-lg border border-terminal-border">
                  {stats.alertVolumeTrend.map((item, idx) => {
                    const heightPercent = Math.max(8, Math.round((item.count / maxTrendCount) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative font-mono">
                        {/* Hover Tooltip */}
                        <div className="hidden group-hover:block absolute bottom-full mb-1.5 px-2.5 py-1 bg-[#050705] text-terminal-green text-[10px] font-mono rounded border border-terminal-green whitespace-nowrap z-20 shadow-2xl">
                          {item.date}: <span className="text-terminal-green font-bold">{item.count} alerts</span>
                        </div>
                        <span className="text-[9px] font-mono text-terminal-green font-bold">{item.count}</span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[32px] bg-gradient-to-t from-[#112615] via-[#22552a] to-[#33ff66] rounded-t transition-all duration-300 group-hover:glow-green"
                        ></div>
                        <span className="text-[9px] font-mono text-terminal-green-dim truncate max-w-full">
                          {item.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-terminal-border flex items-center justify-between text-xs text-terminal-green-dim font-mono">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-terminal-green" />
              <span>Groq AI Advisory (`llama-3.3-70b-versatile`)</span>
            </span>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-terminal-green hover:text-terminal-bright font-bold flex items-center gap-1"
            >
              <span>View Alert Stream</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Severity Breakdown */}
        <div className="soc-card p-6 rounded-xl border border-terminal-border bg-[#0a0f0a]/90 space-y-4 font-mono">
          <div>
            <h3 className="text-sm font-bold font-mono text-terminal-green text-glow-green">THREAT SEVERITY BREAKDOWN</h3>
            <p className="text-xs text-terminal-green-dim mt-0.5">Live distribution calculated from database alerts</p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-terminal-muted font-mono">Loading severity breakdown...</div>
          ) : (
            <div className="space-y-4 my-2 font-mono text-xs">
              <div>
                <div className="flex justify-between mb-1.5 font-mono">
                  <span className="text-red-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> CRITICAL
                  </span>
                  <span className="text-red-400 font-bold">
                    {stats?.severityDistribution?.CRITICAL ?? 0} ({calculatePercentage(stats?.severityDistribution?.CRITICAL ?? 0, stats?.totalAlerts ?? 0)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-[#050705] rounded-full overflow-hidden border border-terminal-border">
                  <div
                    style={{ width: `${calculatePercentage(stats?.severityDistribution?.CRITICAL ?? 0, stats?.totalAlerts ?? 0)}%` }}
                    className="h-full bg-red-500 rounded-full"
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5 font-mono">
                  <span className="text-orange-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" /> HIGH
                  </span>
                  <span className="text-orange-400 font-bold">
                    {stats?.severityDistribution?.HIGH ?? 0} ({calculatePercentage(stats?.severityDistribution?.HIGH ?? 0, stats?.totalAlerts ?? 0)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-[#050705] rounded-full overflow-hidden border border-terminal-border">
                  <div
                    style={{ width: `${calculatePercentage(stats?.severityDistribution?.HIGH ?? 0, stats?.totalAlerts ?? 0)}%` }}
                    className="h-full bg-orange-500 rounded-full"
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5 font-mono">
                  <span className="text-yellow-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" /> MEDIUM
                  </span>
                  <span className="text-yellow-400 font-bold">
                    {stats?.severityDistribution?.MEDIUM ?? 0} ({calculatePercentage(stats?.severityDistribution?.MEDIUM ?? 0, stats?.totalAlerts ?? 0)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-[#050705] rounded-full overflow-hidden border border-terminal-border">
                  <div
                    style={{ width: `${calculatePercentage(stats?.severityDistribution?.MEDIUM ?? 0, stats?.totalAlerts ?? 0)}%` }}
                    className="h-full bg-yellow-400 rounded-full"
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5 font-mono">
                  <span className="text-terminal-green font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-terminal-green" /> LOW
                  </span>
                  <span className="text-terminal-green font-bold">
                    {stats?.severityDistribution?.LOW ?? 0} ({calculatePercentage(stats?.severityDistribution?.LOW ?? 0, stats?.totalAlerts ?? 0)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-[#050705] rounded-full overflow-hidden border border-terminal-border">
                  <div
                    style={{ width: `${calculatePercentage(stats?.severityDistribution?.LOW ?? 0, stats?.totalAlerts ?? 0)}%` }}
                    className="h-full bg-terminal-green rounded-full"
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Row 2: Top Countries, Top Sources, & Detection Rules Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        {/* Widget 1: Top Targeted Countries */}
        <div className="soc-card p-5 rounded-xl border border-terminal-border bg-[#0a0f0a]/90 space-y-3">
          <div className="flex items-center justify-between border-b border-terminal-border pb-2.5">
            <h3 className="text-xs font-mono font-bold text-terminal-green uppercase flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-terminal-green" />
              <span>Targeted Geo Vectors</span>
            </h3>
          </div>
          {loading ? (
            <div className="py-6 text-center text-xs text-terminal-muted font-mono">Loading country stats...</div>
          ) : !stats?.topTargetedCountries || stats.topTargetedCountries.length === 0 ? (
            <div className="py-6 text-center text-xs text-terminal-muted font-mono">No geolocated country data available yet.</div>
          ) : (
            <div className="space-y-2 font-mono text-xs">
              {stats.topTargetedCountries.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#050705] border border-terminal-border">
                  <span className="text-terminal-green font-semibold">{c.country}</span>
                  <span className="px-2 py-0.5 rounded bg-terminal-green-dark text-terminal-green border border-terminal-border font-bold text-[10px]">
                    {c.count} IOCs
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widget 2: Top Threat Feed Sources */}
        <div className="soc-card p-5 rounded-xl border border-terminal-border bg-[#0a0f0a]/90 space-y-3">
          <div className="flex items-center justify-between border-b border-terminal-border pb-2.5">
            <h3 className="text-xs font-mono font-bold text-purple-400 uppercase flex items-center gap-1.5">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Active Intelligence Feeds</span>
            </h3>
          </div>
          {loading ? (
            <div className="py-6 text-center text-xs text-terminal-muted font-mono">Loading feed stats...</div>
          ) : !stats?.topIocSources || stats.topIocSources.length === 0 ? (
            <div className="py-6 text-center text-xs text-terminal-muted font-mono">No IOC feed data indexed yet.</div>
          ) : (
            <div className="space-y-2 font-mono text-xs">
              {stats.topIocSources.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#050705] border border-terminal-border">
                  <span className="text-terminal-green font-semibold">{s.source}</span>
                  <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-400 border border-purple-500/40 font-bold text-[10px]">
                    {s.count} Records
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widget 3: Detection Rule Performance */}
        <div className="soc-card p-5 rounded-xl border border-terminal-border bg-[#0a0f0a]/90 space-y-3">
          <div className="flex items-center justify-between border-b border-terminal-border pb-2.5">
            <h3 className="text-xs font-mono font-bold text-orange-400 uppercase flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Rule Performance (Fires)</span>
            </h3>
            <button
              onClick={() => onNavigateTab('rules')}
              className="text-[10px] text-terminal-green hover:text-terminal-bright font-mono font-bold"
            >
              Manage
            </button>
          </div>
          {loading ? (
            <div className="py-6 text-center text-xs text-terminal-muted font-mono">Loading rule stats...</div>
          ) : !stats?.rulePerformance || stats.rulePerformance.length === 0 ? (
            <div className="py-6 text-center text-xs text-terminal-muted font-mono">No detection rules created yet.</div>
          ) : (
            <div className="space-y-2 font-mono text-xs">
              {stats.rulePerformance.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded bg-[#050705] border border-terminal-border">
                  <div className="truncate max-w-[160px]">
                    <span className="text-terminal-green font-semibold block truncate">{r.name}</span>
                    <span className="text-[9px] text-terminal-green-dim uppercase">{r.severity}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-orange-950/80 text-orange-400 border border-orange-500/40 font-bold text-[10px]">
                    {r.alertCount} Fired
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Row 3: Recent Alert Stream */}
      <div className="soc-card p-6 rounded-xl border border-terminal-border bg-[#0a0f0a]/90 space-y-4 font-mono">
        <div className="flex items-center justify-between border-b border-terminal-border pb-3">
          <h3 className="text-sm font-bold font-mono text-terminal-green flex items-center gap-2 text-glow-green">
            <Radio className="w-4 h-4 text-terminal-green" />
            <span>RECENT SECURITY ALERT TELEMETRY STREAM</span>
          </h3>
          <button
            onClick={() => onNavigateTab('alerts')}
            className="text-xs text-terminal-green hover:text-terminal-bright font-mono font-bold"
          >
            View Stream →
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-terminal-muted font-mono">Loading telemetry stream...</div>
        ) : recentAlerts.length === 0 ? (
          <div className="text-center py-8 text-xs text-terminal-muted font-mono">
            No alerts generated yet. Trigger a threat feed sync to ingest data!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => onSelectAlert(alert.id)}
                className="p-4 rounded-lg bg-[#050705] hover:bg-terminal-surface border border-terminal-border hover:border-terminal-green cursor-pointer transition space-y-2.5"
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className={`px-2 py-0.5 rounded border font-bold ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className="text-terminal-green-dim">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                </div>

                <p className="text-xs font-semibold text-terminal-green line-clamp-2">{alert.description}</p>

                <div className="flex items-center justify-between text-[10px] text-terminal-green-dim font-mono pt-1.5 border-t border-terminal-border">
                  <span>Source: {alert.source}</span>
                  {alert.llmExplanation && (
                    <span className="text-terminal-green font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-terminal-green" />
                      <span>AI Copilot</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
