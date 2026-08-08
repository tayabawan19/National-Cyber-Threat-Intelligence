import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, AlertTriangle, ArrowRight, Eye, EyeOff, Search, Target, ChevronDown } from 'lucide-react';
import { MatrixRainBg } from './MatrixRainBg';
import { WorldMapHudBg } from './WorldMapHudBg';
import { NctipLogo } from './NctipLogo';

export const LoginPage: React.FC = () => {
  const { login, error, clearError, isLoading } = useAuth();
  const [email, setEmail] = useState('user.admin@nctip.gov');
  const [password, setPassword] = useState('AdminSecurePass123!');
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState('TOTP TOKEN');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'SOC_ANALYST' | 'INVESTIGATOR'>('ADMIN');
  const [submitting, setSubmitting] = useState(false);

  const handleRoleSelect = (role: 'ADMIN' | 'SOC_ANALYST' | 'INVESTIGATOR') => {
    setSelectedRole(role);
    if (role === 'ADMIN') {
      setEmail('user.admin@nctip.gov');
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
      // Map user.admin@nctip.gov to internal seed email admin@cyberintel.gov if needed
      const loginEmail = email === 'user.admin@nctip.gov' ? 'admin@cyberintel.gov' : email;
      await login(loginEmail, password);
    } catch (err) {
      // Handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#020904] font-mono text-[#00ffaa] select-none">
      {/* 1. Animated Digital Rain Background */}
      <MatrixRainBg opacity={0.5} />

      {/* 2. CRT Scanline Mesh */}
      <div className="fixed inset-0 bg-crt-scanlines pointer-events-none z-50 opacity-25" />

      {/* 3. Detailed HUD Framework Box with World Map Vector Background matching screenshot */}
      <WorldMapHudBg />

      {/* 4. Main Glassmorphic Login Card (Exact match to reference image) */}
      <div className="relative z-20 w-full max-w-[480px]">
        <div className="relative rounded-[22px] bg-[#0a1e16]/85 border border-[#00ffaa]/50 p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(0,255,170,0.25)] space-y-5">
          
          {/* Top Edge Bevel Bar Accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#00ffaa] to-transparent shadow-[0_0_10px_#00ffaa]" />
          
          {/* Header Title Section with NCTIP Eagle Emblem */}
          <div className="flex items-center gap-3.5 pt-1">
            {/* Exact NCTIP Shield Eagle Emblem */}
            <NctipLogo className="w-14 h-16 shrink-0 drop-shadow-[0_0_10px_rgba(0,255,170,0.5)]" />

            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight uppercase font-mono">
                <span className="text-[#00ffaa] text-glow-green block">NATIONAL CYBER THREAT</span>
                <span className="text-[#00ffaa] text-glow-green block">INTELLIGENCE PLATFORM</span>
              </h1>
              <p className="text-[9.5px] text-[#00ffaa]/70 uppercase tracking-widest mt-1 font-semibold">
                ACCESS CONTROL PORTAL // AUTHORIZED PERSONNEL ONLY.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-300 text-xs flex items-center justify-between font-mono shadow-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={clearError} className="text-red-400 hover:text-white font-bold ml-2">✕</button>
            </div>
          )}

          {/* Form Controls */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            
            {/* Email Field */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#00ffaa]/90 mb-1.5">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-2.5 w-5 h-5 border border-[#00ffaa]/40 rounded-md flex items-center justify-center bg-[#041209]">
                  <Lock className="w-3 h-3 text-[#00ffaa]" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user.admin@nctip.gov"
                  className="w-full bg-[#11271d]/90 border border-[#00ffaa]/50 rounded-xl py-2.5 pl-11 pr-4 text-xs font-mono text-white placeholder-[#00ffaa]/40 focus:outline-none focus:border-[#00ffaa] focus:ring-1 focus:ring-[#00ffaa] transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#00ffaa]/90 mb-1.5">
                PASSWORD
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-2.5 w-5 h-5 border border-[#00ffaa]/40 rounded-md flex items-center justify-center bg-[#041209]">
                  <Lock className="w-3 h-3 text-[#00ffaa]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#11271d]/90 border border-[#00ffaa]/50 rounded-xl py-2.5 pl-11 pr-10 text-xs font-mono text-white placeholder-[#00ffaa]/40 focus:outline-none focus:border-[#00ffaa] focus:ring-1 focus:ring-[#00ffaa] transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#00ffaa]/60 hover:text-[#00ffaa]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Authentication Method Dropdown */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#00ffaa]/90 mb-1.5">
                AUTHENTICATION METHOD
              </label>
              <div className="relative">
                <select
                  value={authMethod}
                  onChange={(e) => setAuthMethod(e.target.value)}
                  className="w-full bg-[#11271d]/90 border border-[#00ffaa]/50 rounded-xl py-2.5 px-3 text-xs font-mono text-white appearance-none focus:outline-none focus:border-[#00ffaa] cursor-pointer"
                >
                  <option value="TOTP TOKEN" className="bg-[#041209] text-white">TOTP TOKEN</option>
                  <option value="HARDWARE KEY (FIDO2)" className="bg-[#041209] text-white">HARDWARE KEY (FIDO2)</option>
                  <option value="PKI CAC/PIV CARD" className="bg-[#041209] text-white">PKI CAC/PIV CARD</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#00ffaa]/70 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Role Badge Selection Tiles matching screenshot */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#00ffaa]/90 mb-2">
                ROLE BADGE SELECTION
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                
                {/* ADMIN Tile */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('ADMIN')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'ADMIN'
                      ? 'bg-[#00ffaa]/15 border-2 border-[#00ffaa] text-white shadow-[0_0_20px_rgba(0,255,170,0.35)]'
                      : 'bg-[#06180f]/70 border-[#00ffaa]/30 text-[#00ffaa]/60 hover:border-[#00ffaa]/60 hover:text-white'
                  }`}
                >
                  <div className={`p-2 rounded-full border ${selectedRole === 'ADMIN' ? 'bg-[#00ffaa] border-[#00ffaa] text-[#041209]' : 'border-[#00ffaa]/40'}`}>
                    <Shield className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="text-[10.5px] font-extrabold tracking-wider">ADMIN</span>
                </button>

                {/* SOC_ANALYST Tile */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('SOC_ANALYST')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'SOC_ANALYST'
                      ? 'bg-[#00ffaa]/15 border-2 border-[#00ffaa] text-white shadow-[0_0_20px_rgba(0,255,170,0.35)]'
                      : 'bg-[#06180f]/70 border-[#00ffaa]/30 text-[#00ffaa]/60 hover:border-[#00ffaa]/60 hover:text-white'
                  }`}
                >
                  <div className={`p-2 rounded-full border ${selectedRole === 'SOC_ANALYST' ? 'bg-[#00ffaa] border-[#00ffaa] text-[#041209]' : 'border-[#00ffaa]/40'}`}>
                    <Target className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="text-[10.5px] font-extrabold tracking-wider">SOC_ANALYST</span>
                </button>

                {/* INVESTIGATOR Tile */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('INVESTIGATOR')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'INVESTIGATOR'
                      ? 'bg-[#00ffaa]/15 border-2 border-[#00ffaa] text-white shadow-[0_0_20px_rgba(0,255,170,0.35)]'
                      : 'bg-[#06180f]/70 border-[#00ffaa]/30 text-[#00ffaa]/60 hover:border-[#00ffaa]/60 hover:text-white'
                  }`}
                >
                  <div className={`p-2 rounded-full border ${selectedRole === 'INVESTIGATOR' ? 'bg-[#00ffaa] border-[#00ffaa] text-[#041209]' : 'border-[#00ffaa]/40'}`}>
                    <Search className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="text-[10.5px] font-extrabold tracking-wider">INVESTIGATOR</span>
                </button>

              </div>
            </div>

            {/* Glowing Mint/Neon Green Main Button */}
            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full mt-2 bg-gradient-to-r from-[#00ffaa] via-[#34d399] to-[#00ffaa] hover:from-[#22c55e] hover:to-[#00ffaa] text-[#021008] font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_30px_rgba(0,255,170,0.5)] hover:shadow-[0_0_40px_rgba(0,255,170,0.8)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting || isLoading ? (
                <div className="w-4 h-4 border-2 border-[#021008] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>INITIALIZE SECURE SOC SESSION</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>

          </form>

          {/* Footer Links & MFA Status Indicator */}
          <div className="pt-3 border-t border-[#00ffaa]/25 flex flex-col items-center gap-2 text-[11px] font-mono">
            <div className="flex items-center justify-center gap-6 text-[#00ffaa]/90">
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset request dispatched'); }} className="hover:text-white underline underline-offset-2">
                Forgot Password?
              </a>
              <a href="#request" onClick={(e) => { e.preventDefault(); alert('Access request submitted to administrator'); }} className="hover:text-white underline underline-offset-2">
                Request Access?
              </a>
            </div>

            <div className="text-[10.5px] text-[#00ffaa]/80 font-bold pt-1">
              MFA Status: <span className="text-[#00ffaa] font-black tracking-widest">[ACTIVE]</span>
            </div>
          </div>

          {/* Bottom Edge Bevel Bar Accent */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#00ffaa] to-transparent shadow-[0_0_10px_#00ffaa]" />

        </div>
      </div>
    </div>
  );
};
