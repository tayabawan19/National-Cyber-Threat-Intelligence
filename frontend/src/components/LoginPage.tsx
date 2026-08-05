import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, AlertTriangle, Server, ArrowRight, Activity, Terminal } from 'lucide-react';
import { CyberCellHeroBg } from './CyberCellHeroBg';
import { MatrixRainBg } from './MatrixRainBg';

export const LoginPage: React.FC = () => {
  const { login, error, clearError, isLoading } = useAuth();
  const [email, setEmail] = useState('admin@cyberintel.gov');
  const [password, setPassword] = useState('AdminSecurePass123!');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      // Handled by AuthContext error state
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#031406] font-mono text-terminal-green">
      {/* Animated Matrix Digital Rain Background */}
      <MatrixRainBg opacity={0.35} />

      {/* Generative Cyber Cell Hero Background (Skyline, Shield, Network Web) */}
      <CyberCellHeroBg variant="full" align="left" />

      {/* CRT Scanline Overlay */}
      <div className="fixed inset-0 bg-crt-scanlines pointer-events-none z-50 opacity-40" />

      {/* Main Split Container */}
      <div className="w-full max-w-6xl mx-auto relative z-10 font-mono flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 px-4">
        {/* Left Side: SOC Platform Branding & Telemetry (Over Shield Backdrop) */}
        <div className="hidden lg:flex flex-col max-w-md space-y-6 text-left p-6 rounded-2xl bg-[#070c07]/85 border border-terminal-border/60 backdrop-blur-md shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-terminal-surface border border-terminal-border text-xs text-terminal-green w-fit shadow-md">
            <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
            <span className="font-bold font-mono">CTIP-SEC-NODE-01 // ACTIVE</span>
          </div>

          <h1 className="text-3xl font-extrabold text-terminal-green text-glow-green tracking-tight leading-tight">
            NATIONAL CYBER THREAT OPERATIONS CELL
          </h1>

          <p className="text-xs text-terminal-green-dim leading-relaxed">
            Enterprise AI-assisted Security Operations Center platform for real-time threat feed aggregation, multi-condition rule detection, malware correlation, and digital forensics chain of custody.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
            <div className="p-3 rounded-lg bg-[#050705]/80 border border-terminal-border flex items-center gap-2.5 shadow-lg">
              <Activity className="w-4 h-4 text-terminal-green shrink-0" />
              <div>
                <p className="text-terminal-green font-bold">LIVE FEEDS</p>
                <p className="text-[10px] text-terminal-muted">OTX, NVD, abuse.ch</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#050705]/80 border border-terminal-border flex items-center gap-2.5 shadow-lg">
              <Shield className="w-4 h-4 text-terminal-green shrink-0" />
              <div>
                <p className="text-terminal-green font-bold">CHAIN OF CUSTODY</p>
                <p className="text-[10px] text-terminal-muted">Immutable Forensics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Box */}
        <div className="w-full max-w-md">
        {/* Logo & Terminal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-terminal-surface border border-terminal-border mb-3 shadow-xl text-terminal-green text-glow-green">
            <Terminal className="w-8 h-8 text-terminal-green" />
          </div>
          <h1 className="text-xl font-bold text-terminal-green text-glow-green tracking-tight flex items-center justify-center gap-1 font-mono">
            <span>root@ctip-sec-node-01:~#</span>
            <span className="animate-pulse text-terminal-green font-bold font-mono text-glow-green">_</span>
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-terminal-green-dim font-mono mt-1">
            NATIONAL CYBER THREAT OPERATIONS CELL
          </p>
        </div>

        {/* Terminal Login Box */}
        <div className="soc-card p-6 rounded-xl border border-terminal-border shadow-2xl bg-[#0a0f0a]/95 space-y-5">
          {/* Header Box motif */}
          <div className="flex items-center justify-between border-b border-terminal-border pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-terminal-green" />
              <span className="text-terminal-green text-xs font-bold font-mono">ANALYST AUTHENTICATION PORTAL</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-terminal-green-dark text-terminal-green border border-terminal-border">
              <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
              ACTIVE PORT
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-400 text-xs flex items-start gap-2.5 font-mono">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-300">AUTHENTICATION_ERROR</p>
                <p className="mt-0.5 text-[11px] opacity-90">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-[11px] font-mono text-terminal-green-dim uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>ANALYST EMAIL ADDRESS</span>
                <span className="text-[10px] text-terminal-muted">[REQUIRED]</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-terminal-green-dim absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@cyberintel.gov"
                  className="w-full bg-[#050705] border border-terminal-border rounded-lg py-2.5 pl-10 pr-4 text-xs font-mono text-terminal-green placeholder-terminal-muted focus:outline-none focus:border-terminal-green focus:ring-1 focus:ring-terminal-green transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-terminal-green-dim uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>AUTHENTICATION PASSPHRASE</span>
                <span className="text-[10px] text-terminal-muted">[ENCRYPTED]</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-terminal-green-dim absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#050705] border border-terminal-border rounded-lg py-2.5 pl-10 pr-4 text-xs font-mono text-terminal-green placeholder-terminal-muted focus:outline-none focus:border-terminal-green focus:ring-1 focus:ring-terminal-green transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full bg-terminal-green-dark hover:bg-terminal-border text-terminal-green hover:text-terminal-bright font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider font-mono transition-all duration-200 border border-terminal-border hover:border-terminal-green flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-terminal-green-dark/30"
            >
              {submitting || isLoading ? (
                <div className="w-4 h-4 border-2 border-terminal-green border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>AUTHENTICATE SESSION</span>
                  <span className="font-mono text-terminal-green group-hover:translate-x-1 transition-transform">█</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Seed Accounts */}
          <div className="pt-4 border-t border-terminal-border text-xs">
            <p className="font-mono text-[11px] text-terminal-green-dim mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-terminal-green" />
                Demo Accounts:
              </span>
              <span className="text-[9px] text-terminal-muted">[SEED_STORE]</span>
            </p>
            <div className="bg-[#050705] rounded-lg p-3 font-mono text-[10px] space-y-1.5 text-terminal-green-dim border border-terminal-border">
              <div className="flex justify-between items-center">
                <span className="text-terminal-green">admin@cyberintel.gov</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-400 border border-purple-500/40 font-bold">ADMIN</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-terminal-green">analyst@cyberintel.gov</span>
                <span className="px-1.5 py-0.5 rounded bg-terminal-green-dark text-terminal-green border border-terminal-border font-bold">SOC_ANALYST</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-terminal-green">readonly@cyberintel.gov</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700 font-bold">READ_ONLY</span>
              </div>
              <p className="text-[9px] text-terminal-muted pt-1.5 border-t border-terminal-border">
                Passphrases: AdminSecurePass123! | AnalystPass123! | ReadOnlyPass123!
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-terminal-green-dim mt-4 font-mono flex items-center justify-center gap-1">
          <Activity className="w-3 h-3 text-terminal-green" />
          <span>RESTRICTED SOC SYSTEM • ALL SESSION ACTIONS MONITORED & AUDITED</span>
        </p>
      </div>
    </div>
  </div>
);
};
