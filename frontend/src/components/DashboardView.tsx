import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Database, FileCode, ArrowUpRight, Activity, Cpu, CheckCircle2, Globe, Flame, BarChart2 } from 'lucide-react';

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
          fetch(`${API_BASE_URL}/alerts?limit=5`, { headers }),
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
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const calculatePercentage = (count: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const maxTrendCount = Math.max(...(stats?.alertVolumeTrend?.map((t) => t.count) || [1]), 1);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono font-semibold text-emerald-400 tracking-wider uppercase">SOC Monitor Live</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100">National Threat Operations Center</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time correlation across AlienVault OTX, NIST NVD, and abuse.ch feeds with automated Groq AI Threat Summaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('map')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition"
          >
            <Activity className="w-4 h-4" />
            <span>Launch Attack Map</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Alerts Recorded</span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-100 mt-2">{loading ? '...' : (stats?.totalAlerts ?? 0)}</p>
          <span className="text-[10px] text-amber-400/80 font-mono mt-1 block">Live Postgres Database</span>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Open Alerts</span>
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <Shield className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-100 mt-2">{loading ? '...' : (stats?.openAlerts ?? 0)}</p>
          <span className="text-[10px] text-red-400/80 font-mono mt-1 block">NEW & TRIAGED Alerts</span>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Ingested IOCs</span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Database className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-100 mt-2">{loading ? '...' : (stats?.totalIocs ?? 0)}</p>
          <span className="text-[10px] text-blue-400/80 font-mono mt-1 block">IPs, Domains, Hashes, URLs</span>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">CVE Vulnerabilities</span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <FileCode className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-100 mt-2">{loading ? '...' : (stats?.totalCves ?? 0)}</p>
          <span className="text-[10px] text-purple-400/80 font-mono mt-1 block">NVD NIST Synchronized</span>
        </div>
      </div>

      {/* Main Row 1: Alert Trend Volume & Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Alert Volume Over Time Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900/70 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-400" />
                  <span>Alert Volume Trend (Time Series)</span>
                </h3>
                <p className="text-xs text-slate-400">Real-time alert generation rate aggregated from live DB alerts</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                ● Live DB Stream
              </span>
            </div>

            {loading ? (
              <div className="h-44 flex items-center justify-center text-xs text-slate-500 font-mono">
                Loading volume trend chart...
              </div>
            ) : !stats?.alertVolumeTrend || stats.alertVolumeTrend.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-slate-500 font-mono">
                No alert trend data recorded yet.
              </div>
            ) : (
              <div className="space-y-4 my-4">
                <div className="h-40 flex items-end justify-between gap-2 pt-4 px-2 bg-slate-950/40 rounded-xl border border-slate-800/80">
                  {stats.alertVolumeTrend.map((item, idx) => {
                    const heightPercent = Math.max(8, Math.round((item.count / maxTrendCount) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                        {/* Hover Tooltip */}
                        <div className="hidden group-hover:block absolute bottom-full mb-1 px-2 py-1 bg-slate-800 text-slate-100 text-[10px] font-mono rounded border border-slate-700 whitespace-nowrap z-20 shadow-xl">
                          {item.date}: <span className="text-blue-400 font-bold">{item.count} alerts</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 font-bold">{item.count}</span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[36px] bg-gradient-to-t from-blue-600 via-blue-500 to-cyan-400 rounded-t-md transition-all duration-300 group-hover:from-blue-500 group-hover:to-cyan-300"
                        ></div>
                        <span className="text-[9px] font-mono text-slate-500 truncate max-w-full">
                          {item.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-mono">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Groq AI Copilot Active (`llama-3.3-70b-versatile`)</span>
            </span>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <span>View Alerts Stream</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Severity Breakdown from Real DB */}
        <div className="bg-slate-900/70 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Threat Severity Distribution</h3>
            <p className="text-xs text-slate-400">Live breakdown calculated from database alerts</p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 font-mono">Loading severity breakdown...</div>
          ) : (
            <div className="space-y-4 my-2 font-mono text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-red-400 font-bold">CRITICAL THREATS</span>
                  <span className="text-slate-300 font-bold">
                    {stats?.severityDistribution?.CRITICAL ?? 0} ({calculatePercentage(stats?.severityDistribution?.CRITICAL ?? 0, stats?.totalAlerts ?? 0)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${calculatePercentage(stats?.severityDistribution?.CRITICAL ?? 0, stats?.totalAlerts ?? 0)}%` }}
                    className="h-full bg-red-500 rounded-full"
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-amber-400 font-bold">HIGH SEVERITY</span>
                  <span className="text-slate-300 font-bold">
                    {stats?.severityDistribution?.HIGH ?? 0} ({calculatePercentage(stats?.severityDistribution?.HIGH ?? 0, stats?.totalAlerts ?? 0)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${calculatePercentage(stats?.severityDistribution?.HIGH ?? 0, stats?.totalAlerts ?? 0)}%` }}
                    className="h-full bg-amber-500 rounded-full"
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-yellow-400 font-bold">MEDIUM SEVERITY</span>
                  <span className="text-slate-300 font-bold">
                    {stats?.severityDistribution?.MEDIUM ?? 0} ({calculatePercentage(stats?.severityDistribution?.MEDIUM ?? 0, stats?.totalAlerts ?? 0)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${calculatePercentage(stats?.severityDistribution?.MEDIUM ?? 0, stats?.totalAlerts ?? 0)}%` }}
                    className="h-full bg-yellow-500 rounded-full"
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-blue-400 font-bold">LOW SEVERITY</span>
                  <span className="text-slate-300 font-bold">
                    {stats?.severityDistribution?.LOW ?? 0} ({calculatePercentage(stats?.severityDistribution?.LOW ?? 0, stats?.totalAlerts ?? 0)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${calculatePercentage(stats?.severityDistribution?.LOW ?? 0, stats?.totalAlerts ?? 0)}%` }}
                    className="h-full bg-blue-500 rounded-full"
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Row 2: Top Countries, Top Sources, & Detection Rules Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Widget 1: Top Targeted Countries */}
        <div className="bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Top Targeted Countries</span>
            </h3>
          </div>
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-500 font-mono">Loading country stats...</div>
          ) : !stats?.topTargetedCountries || stats.topTargetedCountries.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 font-mono">No geolocated country data available yet.</div>
          ) : (
            <div className="space-y-2 font-mono text-xs">
              {stats.topTargetedCountries.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-200 font-semibold">{c.country}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold text-[10px]">
                    {c.count} IOCs
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widget 2: Top Threat Feed Sources */}
        <div className="bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Top IOC Sources</span>
            </h3>
          </div>
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-500 font-mono">Loading source stats...</div>
          ) : !stats?.topIocSources || stats.topIocSources.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 font-mono">No IOC source data indexed yet.</div>
          ) : (
            <div className="space-y-2 font-mono text-xs">
              {stats.topIocSources.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-200 font-semibold">{s.source}</span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold text-[10px]">
                    {s.count} Records
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widget 3: Detection Rule Performance */}
        <div className="bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Rule Performance (Fires)</span>
            </h3>
            <button
              onClick={() => onNavigateTab('rules')}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-mono"
            >
              Manage
            </button>
          </div>
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-500 font-mono">Loading rule performance...</div>
          ) : !stats?.rulePerformance || stats.rulePerformance.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 font-mono">No detection rules created yet.</div>
          ) : (
            <div className="space-y-2 font-mono text-xs">
              {stats.rulePerformance.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                  <div className="truncate max-w-[170px]">
                    <span className="text-slate-200 font-semibold block truncate">{r.name}</span>
                    <span className="text-[9px] text-slate-500 uppercase">{r.severity}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold text-[10px]">
                    {r.alertCount} Fired
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Row 3: Recent Alert Stream */}
      <div className="bg-slate-900/70 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200">Recent Security Alerts Stream</h3>
          <button
            onClick={() => onNavigateTab('alerts')}
            className="text-xs text-blue-400 hover:text-blue-300 font-mono font-medium"
          >
            View All Stream
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-slate-500 font-mono">Loading alerts stream...</div>
        ) : recentAlerts.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 font-mono">
            No alerts generated yet. Trigger a threat feed sync to ingest data!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => onSelectAlert(alert.id)}
                className="p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition space-y-2"
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className={`px-2 py-0.5 rounded border font-semibold ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className="text-slate-400">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                </div>

                <p className="text-xs font-semibold text-slate-200 line-clamp-2">{alert.description}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                  <span>Source: {alert.source}</span>
                  {alert.llmExplanation && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>AI Copilot Summary</span>
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
