import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, AlertTriangle, Server, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#090d16]">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-full max-w-md relative z-10">
        {/* Logo & Platform Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4 shadow-lg shadow-blue-500/5">
            <Shield className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            National Cyber Threat Intelligence
          </h1>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-mono mt-1">
            SOC Operations & Intelligence Hub • Phase 1
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-panel p-8 rounded-2xl shadow-2xl">
          <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Analyst Sign In</h2>
              <p className="text-xs text-slate-400">Authenticate with JWT security token</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM ONLINE
            </span>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Authentication Error</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-200 text-xs font-mono font-bold"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Analyst Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@cyberintel.gov"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting || isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Local Dev Seeds Info */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-xs text-slate-400">
            <p className="font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              Local Development Demo Accounts:
            </p>
            <div className="bg-slate-900/60 rounded-lg p-3 font-mono text-[10px] space-y-1.5 text-slate-300 border border-slate-800">
              <div className="flex justify-between">
                <span>admin@cyberintel.gov</span>
                <span className="text-purple-400 font-bold">ADMIN</span>
              </div>
              <div className="flex justify-between">
                <span>analyst@cyberintel.gov</span>
                <span className="text-blue-400 font-bold">ANALYST</span>
              </div>
              <div className="flex justify-between">
                <span>readonly@cyberintel.gov</span>
                <span className="text-emerald-400 font-bold">READ_ONLY</span>
              </div>
              <p className="text-[9px] text-slate-500 pt-1 border-t border-slate-800/80">
                Passwords: AdminSecurePass123! | AnalystPass123! | ReadOnlyPass123!
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6 font-mono">
          Restricted Government & SOC System • Authorized Access Only
        </p>
      </div>
    </div>
  );
};
