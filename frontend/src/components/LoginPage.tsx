import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, AlertTriangle, ArrowRight, Eye, EyeOff, Search, Target, ChevronDown } from 'lucide-react';
import { MatrixRainBg } from './MatrixRainBg';

export const LoginPage: React.FC = () => {
  const { login, error, clearError, isLoading } = useAuth();
  const [email, setEmail] = useState('admin@cyberintel.gov');
  const [password, setPassword] = useState('AdminSecurePass123!');
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState('TOTP TOKEN');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'SOC_ANALYST' | 'INVESTIGATOR'>('ADMIN');
  const [submitting, setSubmitting] = useState(false);

  const handleRoleSelect = (role: 'ADMIN' | 'SOC_ANALYST' | 'INVESTIGATOR') => {
    setSelectedRole(role);
    if (role === 'ADMIN') {
      setEmail('admin@cyberintel.gov');
      setPassword('AdminSecurePass123!');
    } else if (role === 'SOC_ANALYST') {
      setEmail('analyst@cyberintel.gov');
      setPassword('AnalystPass123!');
    } else if (role === 'INVESTIGATOR') {
      setEmail('readonly@cyberintel.gov');
      setPassword('ReadOnlyPass123!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      // Handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#030d07] font-mono text-[#00ffaa] select-none">
      {/* 1. Animated Matrix Digital Rain Background */}
      <MatrixRainBg opacity={0.45} />

      {/* 2. CRT Scanlines Effect */}
      <div className="fixed inset-0 bg-crt-scanlines pointer-events-none z-50 opacity-30" />

      {/* 3. Central HUD Grid Frame Container (Outer Wireframe Grid Box from image) */}
      <div className="relative z-10 w-full max-w-xl p-4 sm:p-8 flex items-center justify-center">
        
        {/* Outer CRT Cyber Frame */}
        <div className="absolute inset-0 border border-[#00ffaa]/30 rounded-2xl bg-[#041209]/40 backdrop-blur-sm pointer-events-none shadow-[0_0_50px_rgba(0,255,170,0.1)]">
          {/* Corner Bevel Markers */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#00ffaa]" />
          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#00ffaa]" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#00ffaa]" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#00ffaa]" />

          {/* SVG World Map / Cyber Grid Background Overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hud-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#00ffaa" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hud-grid)" />
            {/* World map vector dots */}
            <circle cx="20%" cy="35%" r="3" fill="#00ffaa" className="animate-ping" />
            <circle cx="20%" cy="35%" r="2" fill="#00ffaa" />
            <circle cx="75%" cy="45%" r="3" fill="#00ffaa" className="animate-ping" />
            <circle cx="75%" cy="45%" r="2" fill="#00ffaa" />
            <circle cx="50%" cy="60%" r="2" fill="#00ffaa" />
          </svg>
        </div>

        {/* 4. Main Glassmorphic Login Modal Box */}
        <div className="relative w-full rounded-2xl bg-[#07170f]/90 border border-[#00ffaa]/40 p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(0,255,170,0.2)] space-y-5">
          
          {/* Top Decorative Notch Accent */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 bg-[#030d07] border border-[#00ffaa]/50 rounded-full text-[9px] font-bold text-[#00ffaa] tracking-widest uppercase shadow-md flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ffaa] animate-pulse" />
            SECURE SOC ACCESS PORTAL
          </div>

          {/* Header Title Section */}
          <div className="flex items-center gap-3 pt-2">
            {/* NCTIP Shield Crest Logo */}
            <div className="w-12 h-12 rounded-xl bg-[#032115] border border-[#00ffaa]/60 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,255,170,0.3)]">
              <Shield className="w-7 h-7 text-[#00ffaa]" />
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight leading-tight">
                <span className="text-white">NATIONAL CYBER THREAT </span>
                <span className="text-[#00ffaa] text-glow-green">INTELLIGENCE PLATFORM</span>
              </h1>
              <p className="text-[10px] text-[#00ffaa]/70 uppercase tracking-wider mt-0.5 font-semibold">
                ACCESS CONTROL PORTAL // AUTHORIZED PERSONNEL ONLY.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-950/70 border border-red-500/60 text-red-300 text-xs flex items-center justify-between font-mono shadow-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={clearError} className="text-red-400 hover:text-white font-bold ml-2">✕</button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Email Field */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#00ffaa]/80 mb-1">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 w-4 h-4 border border-[#00ffaa]/40 rounded flex items-center justify-center bg-[#021008]">
                  <Lock className="w-2.5 h-2.5 text-[#00ffaa]" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user.admin@nctip.gov"
                  className="w-full bg-[#04140a]/90 border border-[#00ffaa]/40 rounded-lg py-2.5 pl-10 pr-4 text-xs font-mono text-white placeholder-[#00ffaa]/30 focus:outline-none focus:border-[#00ffaa] focus:ring-1 focus:ring-[#00ffaa] transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#00ffaa]/80 mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 w-4 h-4 border border-[#00ffaa]/40 rounded flex items-center justify-center bg-[#021008]">
                  <Lock className="w-2.5 h-2.5 text-[#00ffaa]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#04140a]/90 border border-[#00ffaa]/40 rounded-lg py-2.5 pl-10 pr-10 text-xs font-mono text-white placeholder-[#00ffaa]/30 focus:outline-none focus:border-[#00ffaa] focus:ring-1 focus:ring-[#00ffaa] transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#00ffaa]/60 hover:text-[#00ffaa]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Authentication Method Selector */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#00ffaa]/80 mb-1">
                AUTHENTICATION METHOD
              </label>
              <div className="relative">
                <select
                  value={authMethod}
                  onChange={(e) => setAuthMethod(e.target.value)}
                  className="w-full bg-[#04140a]/90 border border-[#00ffaa]/40 rounded-lg py-2.5 px-3 text-xs font-mono text-white appearance-none focus:outline-none focus:border-[#00ffaa] cursor-pointer"
                >
                  <option value="TOTP TOKEN" className="bg-[#030d07] text-white">TOTP TOKEN</option>
                  <option value="HARDWARE KEY (FIDO2)" className="bg-[#030d07] text-white">HARDWARE KEY (FIDO2)</option>
                  <option value="PKI CAC/PIV CARD" className="bg-[#030d07] text-white">PKI CAC/PIV CARD</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#00ffaa]/60 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Role Badge Selection Cards */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#00ffaa]/80 mb-1.5">
                ROLE BADGE SELECTION
              </label>
              <div className="grid grid-cols-3 gap-2">
                
                {/* ADMIN Role Badge */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('ADMIN')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'ADMIN'
                      ? 'bg-[#00ffaa]/15 border-[#00ffaa] text-white shadow-[0_0_15px_rgba(0,255,170,0.3)]'
                      : 'bg-[#041209]/60 border-[#00ffaa]/25 text-[#00ffaa]/60 hover:border-[#00ffaa]/50 hover:text-white'
                  }`}
                >
                  <div className={`p-1.5 rounded-full border ${selectedRole === 'ADMIN' ? 'bg-[#00ffaa] border-[#00ffaa] text-[#030d07]' : 'border-[#00ffaa]/40'}`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider">ADMIN</span>
                </button>

                {/* SOC_ANALYST Role Badge */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('SOC_ANALYST')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'SOC_ANALYST'
                      ? 'bg-[#00ffaa]/15 border-[#00ffaa] text-white shadow-[0_0_15px_rgba(0,255,170,0.3)]'
                      : 'bg-[#041209]/60 border-[#00ffaa]/25 text-[#00ffaa]/60 hover:border-[#00ffaa]/50 hover:text-white'
                  }`}
                >
                  <div className={`p-1.5 rounded-full border ${selectedRole === 'SOC_ANALYST' ? 'bg-[#00ffaa] border-[#00ffaa] text-[#030d07]' : 'border-[#00ffaa]/40'}`}>
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider">SOC_ANALYST</span>
                </button>

                {/* INVESTIGATOR Role Badge */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('INVESTIGATOR')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'INVESTIGATOR'
                      ? 'bg-[#00ffaa]/15 border-[#00ffaa] text-white shadow-[0_0_15px_rgba(0,255,170,0.3)]'
                      : 'bg-[#041209]/60 border-[#00ffaa]/25 text-[#00ffaa]/60 hover:border-[#00ffaa]/50 hover:text-white'
                  }`}
                >
                  <div className={`p-1.5 rounded-full border ${selectedRole === 'INVESTIGATOR' ? 'bg-[#00ffaa] border-[#00ffaa] text-[#030d07]' : 'border-[#00ffaa]/40'}`}>
                    <Search className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider">INVESTIGATOR</span>
                </button>

              </div>
            </div>

            {/* Glowing Neon Green Submit Button */}
            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full mt-2 bg-gradient-to-r from-[#00ffaa] via-[#10b981] to-[#00ffaa] hover:from-[#22c55e] hover:to-[#00ffaa] text-[#030d07] font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_25px_rgba(0,255,170,0.4)] hover:shadow-[0_0_35px_rgba(0,255,170,0.7)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting || isLoading ? (
                <div className="w-4 h-4 border-2 border-[#030d07] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>INITIALIZE SECURE SOC SESSION</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>

          </form>

          {/* Bottom Links & MFA Status Indicator */}
          <div className="pt-3 border-t border-[#00ffaa]/20 flex flex-col items-center gap-2 text-[11px]">
            <div className="flex items-center justify-center gap-6 text-[#00ffaa]/80">
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset link dispatched to security officer'); }} className="hover:text-white hover:underline">
                Forgot Password?
              </a>
              <a href="#request" onClick={(e) => { e.preventDefault(); alert('Access request form submitted for approval'); }} className="hover:text-white hover:underline">
                Request Access?
              </a>
            </div>

            <div className="text-[10px] text-[#00ffaa]/70 font-semibold pt-1">
              MFA Status: <span className="text-[#00ffaa] font-bold">[ACTIVE]</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
