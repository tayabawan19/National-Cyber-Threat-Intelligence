import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, AlertTriangle, ArrowRight, Eye, EyeOff, Search, Target, ChevronDown } from 'lucide-react';
import { MatrixRainBg } from './MatrixRainBg';
import { WorldMapHudBg } from './WorldMapHudBg';
import { NctipLogo } from './NctipLogo';

export const LoginPage: React.FC = () => {
  const { login, error, clearError, isLoading } = useAuth();
  
  // Real login fields wired to backend
  const [email, setEmail] = useState('user.admin@nctip.gov');
  const [password, setPassword] = useState('AdminSecurePass123!');
  const [showPassword, setShowPassword] = useState(false);
  
  // Cosmetic / UI state matching reference design
  const [authMethod, setAuthMethod] = useState('TOTP TOKEN');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'SOC_ANALYST' | 'INVESTIGATOR'>('ADMIN');
  const [submitting, setSubmitting] = useState(false);

  // Handle role selection (pre-fills credentials for convenience)
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

  // Real Login Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    try {
      // Map user.admin@nctip.gov to internal backend seed admin@cyberintel.gov
      const actualLoginEmail = email === 'user.admin@nctip.gov' ? 'admin@cyberintel.gov' : email;
      await login(actualLoginEmail, password);
    } catch (err) {
      // Handled by AuthContext error state
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0e0d] font-mono text-[#00ff88] select-none">
      
      {/* 1. Low-opacity Matrix Alphanumeric Digital Rain */}
      <MatrixRainBg opacity={0.2} />

      {/* 2. CRT Scanline Mesh Effect */}
      <div className="fixed inset-0 bg-crt-scanlines pointer-events-none z-10 opacity-20" />

      {/* 3. Symmetrical Left & Right World Map Radar Panels Background */}
      <WorldMapHudBg />

      {/* 4. Centered Login Card Structure (~450px wide) */}
      <div className="relative z-20 w-full max-w-[460px]">
        <div className="relative rounded-2xl bg-[#0a140f]/90 border border-[#00ff88]/40 p-6 sm:p-7 backdrop-blur-md shadow-[0_0_40px_rgba(0,255,136,0.15)] space-y-5">
          
          {/* Top Subtle Edge Highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[1.5px] bg-gradient-to-r from-transparent via-[#00ff88] to-transparent opacity-80" />

          {/* ITEM 1: Header Row (Shield icon/logo + Two-line bold title) */}
          <div className="flex items-center gap-3">
            <NctipLogo className="w-11 h-11 shrink-0" />
            <h1 className="text-[20px] font-black text-[#00ff88] leading-tight tracking-tight uppercase font-mono">
              NATIONAL CYBER THREAT<br />
              INTELLIGENCE PLATFORM
            </h1>
          </div>

          {/* ITEM 2: Subtitle */}
          <p className="text-[10px] text-[#5a8a6e] font-semibold tracking-wider uppercase font-mono mt-0.5">
            ACCESS CONTROL PORTAL // AUTHORIZED PERSONNEL ONLY.
          </p>

          {/* Backend Error Banner */}
          {error && (
            <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/60 text-red-300 text-xs flex items-center justify-between font-mono shadow-md">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={clearError} className="text-red-400 hover:text-white font-bold ml-2">✕</button>
            </div>
          )}

          {/* LOGIN FORM */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            
            {/* ITEM 3: Field "EMAIL ADDRESS" */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#5a8a6e] mb-1.5">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-3 w-4 h-4 text-[#00ff88]/70 flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-[#00ff88]" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user.admin@nctip.gov"
                  className="w-full h-[46px] bg-[#0d1410] border border-[#00ff88]/30 rounded-lg pl-10 pr-4 text-xs font-mono text-[#00ff88] placeholder-[#5a8a6e]/50 focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] transition-all"
                />
              </div>
            </div>

            {/* ITEM 4: Field "PASSWORD" */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#5a8a6e] mb-1.5">
                PASSWORD
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-3 w-4 h-4 text-[#00ff88]/70 flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-[#00ff88]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-[46px] bg-[#0d1410] border border-[#00ff88]/30 rounded-lg pl-10 pr-10 text-xs font-mono text-[#00ff88] placeholder-[#5a8a6e]/50 focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#5a8a6e] hover:text-[#00ff88] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* ITEM 5: Field "AUTHENTICATION METHOD" */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#5a8a6e] mb-1.5">
                AUTHENTICATION METHOD
              </label>
              <div className="relative">
                <select
                  value={authMethod}
                  onChange={(e) => setAuthMethod(e.target.value)}
                  className="w-full h-[46px] bg-[#0d1410] border border-[#00ff88]/30 rounded-lg px-3 text-xs font-mono text-[#00ff88] appearance-none focus:outline-none focus:border-[#00ff88] cursor-pointer"
                >
                  <option value="TOTP TOKEN" className="bg-[#0d1410] text-[#00ff88]">TOTP TOKEN</option>
                  <option value="HARDWARE KEY (FIDO2)" className="bg-[#0d1410] text-[#00ff88]">HARDWARE KEY (FIDO2)</option>
                  <option value="PKI CAC/PIV CARD" className="bg-[#0d1410] text-[#00ff88]">PKI CAC/PIV CARD</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#5a8a6e] absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* ITEM 6: "ROLE BADGE SELECTION" (Row of 3 equal-width selectable badges) */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#5a8a6e] mb-2">
                ROLE BADGE SELECTION
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                
                {/* ADMIN Badge */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('ADMIN')}
                  className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'ADMIN'
                      ? 'bg-[#00ff88]/15 border-[#00ff88] text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.25)] font-bold'
                      : 'bg-[#0d1410] border-[#00ff88]/20 text-[#5a8a6e] hover:border-[#00ff88]/50 hover:text-[#00ff88]'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span className="text-[10px] tracking-wider uppercase font-bold">ADMIN</span>
                </button>

                {/* SOC_ANALYST Badge */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('SOC_ANALYST')}
                  className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'SOC_ANALYST'
                      ? 'bg-[#00ff88]/15 border-[#00ff88] text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.25)] font-bold'
                      : 'bg-[#0d1410] border-[#00ff88]/20 text-[#5a8a6e] hover:border-[#00ff88]/50 hover:text-[#00ff88]'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  <span className="text-[10px] tracking-wider uppercase font-bold">SOC_ANALYST</span>
                </button>

                {/* INVESTIGATOR Badge */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('INVESTIGATOR')}
                  className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'INVESTIGATOR'
                      ? 'bg-[#00ff88]/15 border-[#00ff88] text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.25)] font-bold'
                      : 'bg-[#0d1410] border-[#00ff88]/20 text-[#5a8a6e] hover:border-[#00ff88]/50 hover:text-[#00ff88]'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span className="text-[10px] tracking-wider uppercase font-bold">INVESTIGATOR</span>
                </button>

              </div>
            </div>

            {/* ITEM 7: Primary CTA Button (Full width green gradient fill, black contrast text) */}
            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full h-[48px] mt-2 bg-gradient-to-r from-[#00ff88] to-[#10b981] hover:from-[#10b981] hover:to-[#00ff88] text-[#051a10] font-black rounded-lg text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting || isLoading ? (
                <div className="w-4 h-4 border-2 border-[#051a10] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="font-mono font-black text-[12px] tracking-wider">INITIALIZE SECURE SOC SESSION</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>

          </form>

          {/* ITEM 8: Centered row with two underlined text links */}
          <div className="flex items-center justify-center gap-8 text-[11px] font-mono text-[#5a8a6e] pt-1">
            <a
              href="#forgot"
              onClick={(e) => { e.preventDefault(); alert('Password reset flow: Contact your System Administrator at admin@cyberintel.gov'); }}
              className="hover:text-[#00ff88] underline underline-offset-4 transition-colors"
            >
              Forgot Password?
            </a>
            <a
              href="#request"
              onClick={(e) => { e.preventDefault(); alert('Access request form: Submit employee CAC/PIV credentials to security department'); }}
              className="hover:text-[#00ff88] underline underline-offset-4 transition-colors"
            >
              Request Access?
            </a>
          </div>

          {/* ITEM 9: Footer Line at very bottom of card */}
          <div className="text-center text-[10.5px] font-mono text-[#5a8a6e] pt-1">
            MFA Status: <span className="text-[#00ff88] font-bold">[ACTIVE]</span>
          </div>

          {/* Bottom Edge Bevel Bar Accent */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-[1.5px] bg-gradient-to-r from-transparent via-[#00ff88] to-transparent opacity-80" />

        </div>
      </div>
    </div>
  );
};
