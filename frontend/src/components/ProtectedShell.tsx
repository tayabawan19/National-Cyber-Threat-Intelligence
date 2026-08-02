import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  LogOut,
  LayoutDashboard,
  AlertTriangle,
  Globe,
  Search,
  Settings,
  Layers,
  FileText,
  ExternalLink,
  Database,
  Briefcase,
} from 'lucide-react';
import { DashboardView } from './DashboardView';
import { AlertsView } from './AlertsView';
import { CasesView } from './CasesView';
import { DetectionRulesView } from './DetectionRulesView';
import { AttackMapView } from './AttackMapView';
import { SearchView } from './SearchView';
import { MalwareView } from './MalwareView';

export const ProtectedShell: React.FC = () => {
  const { user, logout, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'cases' | 'map' | 'search' | 'malware' | 'rules' | 'system'>('dashboard');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'SOC_ANALYST':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'INVESTIGATOR':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'READ_ONLY':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'SOC Dashboard', icon: LayoutDashboard },
    { id: 'alerts', label: 'Alerts Stream', icon: AlertTriangle },
    { id: 'cases', label: 'Investigations', icon: Briefcase },
    { id: 'map', label: 'Live Attack Map', icon: Globe },
    { id: 'search', label: 'Threat Search', icon: Search },
    { id: 'malware', label: 'Malware DB', icon: Database },
    { id: 'rules', label: 'Detection Rules', icon: Settings },
    { id: 'system', label: 'System Stack', icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 tracking-wide flex items-center gap-2">
                <span>CYBER THREAT INTEL PLATFORM</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  PHASE 4 POLISHED
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">SOC COMMAND SHELL • AI COPILOT</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="http://localhost:3000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Swagger API Docs</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="text-right hidden md:block">
                <p className="text-xs font-medium text-slate-200">{user?.email}</p>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getRoleBadgeColor(
                    user?.role,
                  )}`}
                >
                  {user?.role}
                </span>
              </div>

              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-all"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Sub-Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto border-t border-slate-800/60 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-semibold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            token={token || ''}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            onSelectAlert={(alertId) => {
              setSelectedAlertId(alertId);
              setActiveTab('alerts');
            }}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            token={token || ''}
            userRole={user?.role}
            selectedAlertId={selectedAlertId}
            onClearSelectedAlert={() => setSelectedAlertId(null)}
          />
        )}

        {activeTab === 'cases' && (
          <CasesView
            token={token || ''}
            userRole={user?.role}
          />
        )}

        {activeTab === 'map' && <AttackMapView token={token || ''} />}

        {activeTab === 'search' && <SearchView token={token || ''} />}

        {activeTab === 'malware' && <MalwareView token={token || ''} />}

        {activeTab === 'rules' && (
          <DetectionRulesView
            token={token || ''}
            userRole={user?.role}
          />
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md space-y-4">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <span>Platform Architecture & Services Overview</span>
              </h2>
              <p className="text-xs text-slate-400">
                Phase 4 Analyst-Facing Experience: Centralized investigation case files, audit-log timeline correlation, spatial attack map clustering, and zero-data UI states.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                  <span className="text-xs font-mono font-bold text-blue-400 block">POSTGRESQL 16</span>
                  <p className="text-xs text-slate-300">Authoritative Source of Truth for Users, Cases, Alerts, IOCs, CVEs, MalwareSamples, DetectionRules, and AuditLogs.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                  <span className="text-xs font-mono font-bold text-red-400 block">REDIS + BULLMQ</span>
                  <p className="text-xs text-slate-300">Asynchronous background ingestion queue processing `sync-otx`, `sync-nvd`, `sync-abusech`, `sync-malware` jobs.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 block">GROQ LLM API</span>
                  <p className="text-xs text-slate-300">Fast inference (`llama-3.3-70b-versatile`) generating threat summaries & advisory severity scores.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 block">OPENSEARCH 2.18</span>
                  <p className="text-xs text-slate-300">Full-text search mirror indexing `ctp-iocs`, `ctp-cves`, and `ctp-malware` for instant search.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                  <span className="text-xs font-mono font-bold text-purple-400 block">NESTJS REST API</span>
                  <p className="text-xs text-slate-300">Aggregated SOC Dashboard API (`/api/dashboard/stats`), Case Investigation endpoints (`/api/cases`), and RBAC guards.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                  <span className="text-xs font-mono font-bold text-yellow-400 block">REACT + VITE SHELL</span>
                  <p className="text-xs text-slate-300">Spatial Clustered Attack Map, Investigation Workflows, Strict Read-Only RBAC UI, and Loading Skeletons.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
