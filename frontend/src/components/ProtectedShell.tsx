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
  Activity,
  Radio,
  Terminal
} from 'lucide-react';
import { DashboardView } from './DashboardView';
import { AlertsView } from './AlertsView';
import { CasesView } from './CasesView';
import { DetectionRulesView } from './DetectionRulesView';
import { AttackMapView } from './AttackMapView';
import { SearchView } from './SearchView';
import { MalwareView } from './MalwareView';
import { MatrixRainBg } from './MatrixRainBg';

export const ProtectedShell: React.FC = () => {
  const { user, logout, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'cases' | 'map' | 'search' | 'malware' | 'rules' | 'system'>('dashboard');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-950/80 text-purple-400 border-purple-500/40 shadow-sm shadow-purple-950';
      case 'SOC_ANALYST':
        return 'bg-terminal-green-dark text-terminal-green border-terminal-border shadow-sm shadow-terminal-green-dark/30';
      case 'INVESTIGATOR':
        return 'bg-amber-950/80 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-950';
      case 'READ_ONLY':
        return 'bg-slate-900 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'SOC Dashboard', icon: LayoutDashboard },
    { id: 'alerts', label: 'Alert Stream', icon: AlertTriangle },
    { id: 'cases', label: 'Case Management', icon: Briefcase },
    { id: 'map', label: 'Live Attack Map', icon: Globe },
    { id: 'search', label: 'Threat Search', icon: Search },
    { id: 'malware', label: 'Malware DB', icon: Database },
    { id: 'rules', label: 'Detection Rules', icon: Settings },
    { id: 'system', label: 'System Stack', icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-[#031406] bg-terminal-grid flex flex-col font-mono text-terminal-green relative">
      {/* Animated Matrix Digital Rain Background */}
      <MatrixRainBg opacity={0.28} />

      {/* CRT Scanlines Overlay */}
      <div className="fixed inset-0 bg-crt-scanlines pointer-events-none z-50 opacity-30" />

      {/* Top Navbar */}
      <header className="border-b border-terminal-border bg-[#0a0f0a]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-terminal-surface border border-terminal-border text-terminal-green text-glow-green">
              <Terminal className="w-5 h-5 text-terminal-green" />
            </div>
            <div>
              <h1 className="text-xs font-mono font-bold text-terminal-green tracking-wider flex items-center gap-2 text-glow-green">
                <span>NATIONAL CYBER THREAT INTEL</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-terminal-green-dark text-terminal-green border border-terminal-border">
                  NODE_01
                </span>
              </h1>
              <p className="text-[10px] text-terminal-green-dim font-mono flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
                <span>root@ctip-sec:~#</span>
                <span className="text-terminal-muted">•</span>
                <span className="text-terminal-green-dim">AI COPILOT ONLINE</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="http://localhost:3000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050705] hover:bg-terminal-surface text-terminal-green text-xs font-mono border border-terminal-border transition"
            >
              <FileText className="w-3.5 h-3.5 text-terminal-green" />
              <span>Swagger Docs</span>
              <ExternalLink className="w-3 h-3 text-terminal-green-dim" />
            </a>

            <div className="flex items-center gap-3 pl-3 border-l border-terminal-border">
              <div className="text-right hidden md:block">
                <p className="text-xs font-mono text-terminal-green">{user?.email}</p>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${getRoleBadgeColor(
                    user?.role,
                  )}`}
                >
                  [{user?.role}]
                </span>
              </div>

              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/40 text-xs font-mono font-bold transition-all"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Sub-Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto border-t border-terminal-border pt-1 font-mono">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-bold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-terminal-green text-terminal-green bg-terminal-green-dark/60 rounded-t-lg text-glow-green'
                    : 'border-transparent text-terminal-green-dim hover:text-terminal-green hover:bg-terminal-surface'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-terminal-green' : 'text-terminal-muted'}`} />
                <span>{isActive ? `[ ${item.label} ]` : item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-mono">
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
          <div className="space-y-6 font-mono">
            <div className="soc-card p-6 rounded-xl border border-terminal-border space-y-4 bg-[#0a0f0a]/90">
              <h2 className="text-sm font-bold text-terminal-green flex items-center gap-2 font-mono text-glow-green">
                <Layers className="w-5 h-5 text-terminal-green" />
                <span>SYSTEM ARCHITECTURE & SERVICE BUS TELEMETRY</span>
              </h2>
              <p className="text-xs text-terminal-green-dim">
                Phase 6 Production-Hardened Infrastructure: PostgreSQL 16 indexed store, OpenSearch 2.13 search mirror, Redis BullMQ queues, self-hosted MISP Threat Sharing, and Groq LLM Advisory Engine.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-[#050705] border border-terminal-border space-y-2 font-mono">
                  <span className="text-xs font-mono font-bold text-terminal-green flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> POSTGRESQL 16
                  </span>
                  <p className="text-xs text-terminal-green-dim">Authoritative Relational Store for Core Entities, Indexed Alerts, Cases, IOCs, CVEs, and Append-Only Audit Logs.</p>
                </div>

                <div className="p-4 rounded-lg bg-[#050705] border border-terminal-border space-y-2 font-mono">
                  <span className="text-xs font-mono font-bold text-red-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-red-400" /> REDIS 7 + BULLMQ
                  </span>
                  <p className="text-xs text-terminal-green-dim">Async Threat Feed Ingestion Broker (`sync-otx`, `sync-nvd`, `sync-abusech`, `sync-malware`, `sync-misp`).</p>
                </div>

                <div className="p-4 rounded-lg bg-[#050705] border border-terminal-border space-y-2 font-mono">
                  <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" /> GROQ LLM ADVISORY
                  </span>
                  <p className="text-xs text-terminal-green-dim">Automated Threat Risk Scoring (`llama-3.3-70b-versatile`) producing natural language severity explanations.</p>
                </div>

                <div className="p-4 rounded-lg bg-[#050705] border border-terminal-border space-y-2 font-mono">
                  <span className="text-xs font-mono font-bold text-terminal-green flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-terminal-green" /> OPENSEARCH MIRROR
                  </span>
                  <p className="text-xs text-terminal-green-dim">Full-text search mirror (`ctp-iocs`, `ctp-cves`, `ctp-malware`) with instant database fallback support.</p>
                </div>

                <div className="p-4 rounded-lg bg-[#050705] border border-terminal-border space-y-2 font-mono">
                  <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-400" /> NESTJS REST API
                  </span>
                  <p className="text-xs text-terminal-green-dim">Class Validator DTOs, Swagger Docs (`/api/docs`), Per-User Rate Limiting (`@nestjs/throttler`), and Configurable CORS.</p>
                </div>

                <div className="p-4 rounded-lg bg-[#050705] border border-terminal-border space-y-2 font-mono">
                  <span className="text-xs font-mono font-bold text-terminal-green flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-terminal-green" /> SELF-HOSTED MISP
                  </span>
                  <p className="text-xs text-terminal-green-dim">Threat-Sharing Platform with Dedicated MariaDB storage & CIRCL OSINT Community Feed Integration.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
